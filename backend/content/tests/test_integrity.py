"""
Database rules for content (content/migrations/0006_integrity.py), and the
admin around the one protected link: a course people are waiting for.
"""

from __future__ import annotations

import datetime as dt
from collections.abc import Callable
from typing import Any

import pytest
from django.db import IntegrityError, transaction

from content.models import Course, Division, Redirect, SitePage, SiteSettings, SocialLink
from leads.models import Lead

pytestmark = pytest.mark.usefixtures("seeded")


def _refused(write: Callable[[], Any]) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        write()


@pytest.mark.parametrize(
    ("from_path", "to"),
    [("old-page", "/new"), ("//evil.example", "/new"), ("/same", "/same")],
)
def test_the_database_refuses_a_broken_redirect(from_path: str, to: str) -> None:
    _refused(lambda: Redirect.objects.create(from_path=from_path, to=to))


def test_one_account_per_social_network() -> None:
    settings = SiteSettings.load()
    SocialLink.objects.create(settings=settings, network="x", url="https://x.com/zgate")
    _refused(
        lambda: SocialLink.objects.create(
            settings=settings, network="x", url="https://x.com/zgate-two"
        )
    )


@pytest.mark.parametrize(
    "write",
    [
        lambda: SitePage.objects.filter(slug="home").update(page_type="blog"),
        lambda: Division.objects.filter(slug="tech").update(slug="crypto"),
        lambda: Course.objects.update(currency="USD"),
        lambda: SocialLink.objects.create(
            settings=SiteSettings.load(), network="myspace", url="https://myspace.com/z"
        ),
    ],
    ids=["page type", "division slug", "currency", "social network"],
)
def test_the_database_refuses_values_outside_the_fixed_lists(write: Callable[[], Any]) -> None:
    _refused(write)


@pytest.fixture
def waitlisted_course() -> Course:
    course = Course.objects.first()
    Lead.objects.create(
        kind="waitlist",
        course=course,
        name="Waiting Person",
        contact="+250 700 000 000",
        consent_contact_allowed=True,
        consent_notice_version="2026-11-01",
        consented_at=dt.datetime(2026, 10, 20, 9, tzinfo=dt.UTC),
    )
    return course


def test_the_admin_offers_no_delete_for_a_waitlisted_course(
    waitlisted_course: Course, admin_user: Any, logged_in: Callable[[Any], Any]
) -> None:
    client = logged_in(admin_user)
    delete_url = f"/admin/snippets/content/course/delete/{waitlisted_course.pk}/"

    edit = client.get(f"/admin/snippets/content/course/edit/{waitlisted_course.pk}/")
    assert edit.status_code == 200
    assert delete_url.encode() not in edit.content

    # Opening the URL directly: back to the course, with the reason.
    for response in (client.get(delete_url), client.post(delete_url)):
        assert response.status_code == 302
        assert response["Location"].endswith(f"/edit/{waitlisted_course.pk}/")
    assert b"Unpublish it to take it off the website" in client.get(response["Location"]).content

    # Bulk delete from the listing skips it.
    client.post(f"/admin/bulk/content/course/delete/?id={waitlisted_course.pk}")
    assert Course.objects.filter(pk=waitlisted_course.pk).exists()


def test_a_course_nobody_waits_for_can_still_be_deleted(
    admin_user: Any, logged_in: Callable[[Any], Any]
) -> None:
    course = Course.objects.first()
    client = logged_in(admin_user)
    response = client.post(f"/admin/snippets/content/course/delete/{course.pk}/")
    assert response.status_code == 302
    assert not Course.objects.filter(pk=course.pk).exists()
