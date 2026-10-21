from __future__ import annotations

import json
from typing import Any

import pytest
from django.test import Client

from audit.models import AuditLog
from content.models import Course, SitePage
from leads.models import Lead

LEAD_TOKEN = "t" * 40

FORM = {
    "kind": "contact",
    "name": "Test Person",
    "businessName": "Kigali Traders Ltd",
    "contact": "+250 700 000 123",
    "preferredChannel": "whatsapp",
    "serviceInterests": ["advisory", "data"],
    "message": "EBM help",
    "consentContact": "on",
    "utmSource": "facebook",
    "utmCampaign": "launch",
}


def post(client: Client, form: Any = FORM, token: str | None = LEAD_TOKEN):
    headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"} if token else {}
    return client.post(
        "/api/lead-intake",
        data=json.dumps({"form": form}),
        content_type="application/json",
        **headers,
    )


@pytest.fixture
def intake(config, seeded: None) -> None:
    config(lead_intake_token=LEAD_TOKEN)


def publish_privacy() -> None:
    page = SitePage.objects.get(slug="privacy")
    page.save_revision().publish()


@pytest.mark.django_db
def test_refuses_when_not_configured(client: Client, config) -> None:
    config(lead_intake_token=None)
    assert post(client).status_code == 503


def test_refuses_a_wrong_or_missing_token(client: Client, intake: None) -> None:
    assert post(client, token="x" * 40).status_code == 401
    assert post(client, token=None).status_code == 401


def test_refuses_a_malformed_body(client: Client, intake: None) -> None:
    response = client.post(
        "/api/lead-intake",
        data="not json",
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {LEAD_TOKEN}",
    )
    assert response.status_code == 400


def test_answers_field_errors(client: Client, intake: None) -> None:
    response = post(client, {**FORM, "name": ""})
    assert response.status_code == 422
    assert response.json() == {
        "ok": False,
        "reason": "invalid",
        "fieldErrors": {"name": "Enter your name."},
    }


def test_rejects_an_unknown_service_area(client: Client, intake: None) -> None:
    response = post(client, {**FORM, "serviceInterests": ["advisory", "unknown"]})
    assert response.status_code == 422
    assert response.json()["reason"] == "invalid"
    assert "serviceInterests" in response.json()["fieldErrors"]


def test_refuses_every_lead_until_a_privacy_notice_is_published(
    client: Client, intake: None
) -> None:
    response = post(client)
    assert response.status_code == 422
    assert response.json() == {"ok": False, "reason": "privacy-unpublished"}
    assert Lead.objects.count() == 0


def test_stores_the_lead_with_consent_and_attribution(client: Client, intake: None) -> None:
    publish_privacy()
    response = post(client)
    assert response.status_code == 201
    body = response.json()
    assert body["ok"] is True
    lead = Lead.objects.get(pk=body["leadId"])
    assert (
        lead.name,
        lead.business_name,
        lead.kind,
        lead.status,
        lead.preferred_channel,
        set(lead.service_areas.values_list("code", flat=True)),
    ) == (
        "Test Person",
        "Kigali Traders Ltd",
        "contact",
        "new",
        "whatsapp",
        {"advisory", "data"},
    )
    assert lead.consent_contact_allowed is True
    assert lead.consent_marketing_allowed is False
    assert lead.consent_notice_version == "draft"
    assert (lead.utm_source, lead.utm_campaign) == ("facebook", "launch")


def test_records_the_submission_as_anonymous(client: Client, intake: None) -> None:
    publish_privacy()
    lead_id = post(client).json()["leadId"]
    entry = AuditLog.objects.get(target_collection="leads", action="create")
    assert entry.actor_type == "anonymous"
    assert entry.doc_ids == [str(lead_id)]


def test_waitlist_needs_a_published_course(client: Client, intake: None) -> None:
    publish_privacy()
    course = Course.objects.first()
    assert course is not None
    waitlist_form = {**FORM, "kind": "waitlist", "serviceInterests": []}
    ok = post(client, {**waitlist_form, "courseId": str(course.pk)})
    assert ok.status_code == 201
    lead = Lead.objects.get(pk=ok.json()["leadId"])
    assert (lead.course_id, set(lead.service_areas.values_list("code", flat=True))) == (
        course.pk,
        {"academy"},
    )

    course.unpublish()
    refused = post(client, {**waitlist_form, "courseId": str(course.pk)})
    assert refused.json() == {"ok": False, "reason": "course-unavailable"}


def test_consent_and_attribution_cannot_be_edited(client: Client, intake: None) -> None:
    publish_privacy()
    lead = Lead.objects.get(pk=post(client).json()["leadId"])
    lead.consent_contact_allowed = False
    lead.utm_source = "tampered"
    lead.status = "contacted"
    lead.save()
    lead.refresh_from_db()
    assert lead.status == "contacted"
    assert lead.consent_contact_allowed is True
    assert lead.utm_source == "facebook"
