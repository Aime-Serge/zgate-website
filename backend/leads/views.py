"""
POST /api/lead-intake - stores a public form submission handed over by
the website frontend (packages/website-contracts/src/leadIntake.ts).

Server to server only: the frontend authenticates with
`Authorization: Bearer <LEAD_INTAKE_TOKEN>`, and the browser never talks
to the CMS. The frontend already applies the visitor-facing checks it
alone can (honeypot, per-visitor rate limits - it sees the visitor's
address); everything is validated again here.

Personal data is never collected without a published privacy notice
(Law N° 058/2021): until then the form is
refused, not just hidden.
"""

from __future__ import annotations

import json
import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from audit.record import public_submission
from config.tokens import bearer_matches
from content.models import Course, SitePage, SiteSettings
from leads.forms import LeadForm, attribution
from leads.models import Lead, ServiceArea

logger = logging.getLogger(__name__)


def privacy_notice_published() -> bool:
    return SitePage.objects.live().filter(slug="privacy").exists()


def _notify(lead: Lead, to: str) -> None:
    """No personal data in the email: it only says one arrived, with a link."""
    waitlist = lead.kind == "waitlist"
    what = "course waitlist sign-up" if waitlist else "enquiry"
    link = f"{settings.CONFIG.admin_url}/admin/leads/edit/{lead.pk}/"

    def send() -> None:
        try:
            send_mail(
                subject="New course waitlist sign-up" if waitlist else "New website enquiry",
                message=f"A new {what} arrived on the website.\n\nOpen it in the CMS: {link}",
                from_email=None,
                recipient_list=[to],
            )
        except Exception:
            logger.exception("Lead notification email failed")

    # After commit, off the request: a slow or failing mail server never
    # delays or breaks the visitor's submission.
    transaction.on_commit(lambda: threading.Thread(target=send, daemon=True).start())


def _json(body: dict, status: int) -> JsonResponse:
    return JsonResponse(body, status=status)


@csrf_exempt  # server to server, bearer-token authenticated - no cookies involved
@require_POST
def lead_intake(request: HttpRequest) -> JsonResponse:
    token = settings.CONFIG.lead_intake_token
    if not token:
        return _json({"error": "lead intake is not configured"}, 503)
    if not bearer_matches(request.headers.get("Authorization"), token):
        return _json({"error": "unauthorized"}, 401)

    # Read only once the caller is known to be the frontend.
    try:
        body = json.loads(request.body or b"null")
    except ValueError:
        body = None
    form = body.get("form") if isinstance(body, dict) else None
    if not isinstance(form, dict):
        return _json({"error": "expected { form: { ... } }"}, 400)
    form = {
        key: value
        for key, value in form.items()
        if isinstance(key, str)
        and (
            isinstance(value, str)
            or (isinstance(value, list) and all(isinstance(item, str) for item in value))
        )
    }

    bound = LeadForm(data=form)
    if not bound.is_valid():
        return _json({"ok": False, "reason": "invalid", "fieldErrors": bound.field_errors()}, 422)
    data = bound.cleaned_data

    try:
        if not privacy_notice_published():
            return _json({"ok": False, "reason": "privacy-unpublished"}, 422)

        # The browser only names a course; whether it exists and is live is
        # re-checked here, never trusted from the form.
        course = None
        if data["courseId"] is not None:
            course = Course.objects.filter(pk=data["courseId"], live=True).first()
            if course is None:
                return _json({"ok": False, "reason": "course-unavailable"}, 422)

        site = SiteSettings.load()
        tracking = attribution(form)
        service_codes = ["academy"] if data["kind"] == "waitlist" else data["serviceInterests"]
        service_areas = list(ServiceArea.objects.filter(code__in=service_codes))
        if len(service_areas) != len(service_codes):
            raise RuntimeError("Lead service-area reference data is incomplete")
        with transaction.atomic(), public_submission():
            lead = Lead.objects.create(
                kind=data["kind"],
                status="new",
                name=data["name"],
                business_name=data["businessName"],
                contact=data["contact"],
                preferred_channel=data["preferredChannel"],
                course=course,
                message=data["message"],
                consent_contact_allowed=data["consentContact"],
                consent_marketing_allowed=data["consentMarketing"],
                consent_notice_version=site.privacy_notice_version,
                consented_at=timezone.now(),
                utm_source=tracking["utmSource"],
                utm_medium=tracking["utmMedium"],
                utm_campaign=tracking["utmCampaign"],
                utm_content=tracking["utmContent"],
                utm_term=tracking["utmTerm"],
                landing_page=tracking["landingPage"],
                referrer=tracking["referrer"],
            )
            lead.service_areas.set(service_areas)
            if site.lead_notification_email:
                _notify(lead, site.lead_notification_email)
    except Exception:
        logger.exception("Lead intake failed")
        return _json({"error": "lead could not be stored"}, 500)

    return _json({"ok": True, "leadId": lead.pk}, 201)
