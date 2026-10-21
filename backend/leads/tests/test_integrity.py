"""
The database itself keeps leads sound, whatever writes to it: the CHECK
constraints and the immutability trigger (leads/migrations/0003_integrity.py).
Every write here goes around Lead.save() and the form on purpose.
"""

from __future__ import annotations

import datetime as dt
from collections.abc import Callable
from typing import Any

import pytest
from django.db import IntegrityError, connection, transaction
from django.db.models import ProtectedError
from django.test.utils import CaptureQueriesContext

from content.models import Course
from leads.models import IMMUTABLE_FIELDS, Lead, ServiceArea

pytestmark = pytest.mark.usefixtures("seeded")


def _valid(**changes: Any) -> dict[str, Any]:
    return {
        "kind": "contact",
        "name": "Integrity Person",
        "contact": "+250 700 000 000",
        "consent_contact_allowed": True,
        "consent_notice_version": "2026-11-01",
        "consented_at": dt.datetime(2026, 10, 20, 9, tzinfo=dt.UTC),
        **changes,
    }


def _refused(write: Callable[[], Any]) -> str:
    with pytest.raises(IntegrityError) as error, transaction.atomic():
        write()
    return str(error.value)


@pytest.mark.parametrize(
    "changes",
    [
        {"kind": "spam"},
        {"status": "deleted"},
        {"preferred_channel": "pigeon"},
        {"consent_contact_allowed": False},
        {"name": ""},
        {"contact": ""},
        {"consent_notice_version": ""},
        {"kind": "waitlist", "course": None},
    ],
    ids=lambda changes: ",".join(f"{k}={v!r}" for k, v in changes.items()),
)
def test_the_database_refuses_an_invalid_lead(changes: dict[str, Any]) -> None:
    _refused(lambda: Lead.objects.create(**_valid(**changes)))


def test_a_valid_waitlist_lead_is_stored() -> None:
    course = Course.objects.first()
    lead = Lead.objects.create(**_valid(kind="waitlist", course=course))
    assert lead.course == course


def _different(lead: Lead, field: str) -> Any:
    value = getattr(lead, field)
    if field == "course_id":
        return Course.objects.exclude(pk=value).values_list("pk", flat=True).first()
    if field == "kind":
        return "contact"  # the lead below is a waitlist lead
    if field == "preferred_channel":
        return "phone"
    if isinstance(value, bool):
        return not value
    if isinstance(value, dt.datetime):
        return value + dt.timedelta(days=1)
    return f"{value}-changed"


@pytest.mark.parametrize("field", IMMUTABLE_FIELDS)
def test_what_was_submitted_cant_be_rewritten_by_a_bulk_update(field: str) -> None:
    lead = Lead.objects.create(**_valid(kind="waitlist", course=Course.objects.first()))
    message = _refused(
        lambda: Lead.objects.filter(pk=lead.pk).update(**{field: _different(lead, field)})
    )
    assert "fixed at submission" in message


def test_staff_can_still_work_a_lead() -> None:
    lead = Lead.objects.create(**_valid())
    Lead.objects.filter(pk=lead.pk).update(status="contacted", staff_notes="Called back")
    lead.refresh_from_db()
    assert (lead.status, lead.staff_notes) == ("contacted", "Called back")


def test_a_course_with_waitlist_leads_cant_be_deleted() -> None:
    course = Course.objects.first()
    Lead.objects.create(**_valid(kind="waitlist", course=course))
    with pytest.raises(ProtectedError):
        course.delete()
    assert Course.objects.filter(pk=course.pk).exists()


def test_service_areas_are_the_fixed_list() -> None:
    _refused(lambda: ServiceArea.objects.create(code="crypto", label="Crypto"))


def test_the_inbox_loads_service_areas_once_per_page(
    publisher: Any, logged_in: Callable[[Any], Any]
) -> None:
    client = logged_in(publisher)
    areas = list(ServiceArea.objects.all())

    def queries_for(leads: int) -> int:
        for _ in range(leads):
            Lead.objects.create(**_valid()).service_areas.set(areas[:2])
        with CaptureQueriesContext(connection) as captured:
            assert client.get("/admin/leads/").status_code == 200
        return len(captured)

    queries_for(0)  # the first request also loads the session and settings
    one_lead = queries_for(1)
    # Six leads on the page cost no more queries than one (session
    # bookkeeping varies by one between requests, so not "equal").
    assert queries_for(5) <= one_lead
