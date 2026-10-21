"""
Contact enquiries and course-waitlist sign-ups - personal data
(Confidential). This inbox is the record of truth until leads are
forwarded to a CRM (ADR-007).

Nothing can create a lead except lead intake (leads/views.py): there is
no "add" in the admin, and consent and attribution are fixed at
submission - a new consent needs a new record.

The database enforces the same rules, so no path around the application
(a bulk update, a shell, SQL) can break them: the CHECK constraints below,
and a trigger that refuses any change to IMMUTABLE_FIELDS
(migrations/0003_integrity.py; backend/database/README.md).
"""

from __future__ import annotations

from typing import Any

from django.db import models
from django.db.models import Q
from wagtail.admin.panels import FieldPanel, FieldRowPanel, MultiFieldPanel

SERVICE_AREAS = [
    ("advisory", "Advisory"),
    ("academy", "Academy"),
    ("tech", "Tech"),
    ("data", "Data"),
    ("not-sure", "Not sure yet"),
]
REPLY_CHANNELS = [
    ("provided-contact", "Use the contact detail I provided"),
    ("whatsapp", "WhatsApp"),
    ("phone", "Phone call"),
    ("email", "Email"),
]

# Recorded at submission, never edited afterwards. Lead.save() keeps them,
# and a database trigger refuses any change to these columns: adding one
# here needs a migration that re-creates the trigger (leads/tests/test_integrity.py
# fails until it does).
IMMUTABLE_FIELDS = (
    "kind",
    "name",
    "business_name",
    "contact",
    "preferred_channel",
    "course_id",
    "message",
    "consent_contact_allowed",
    "consent_marketing_allowed",
    "consent_notice_version",
    "consented_at",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "landing_page",
    "referrer",
)


class ServiceArea(models.Model):
    code = models.CharField(max_length=10, choices=SERVICE_AREAS, unique=True)
    label = models.CharField(max_length=40)

    class Meta:
        ordering = ["code"]
        verbose_name = "service area"
        constraints = [
            models.CheckConstraint(
                condition=Q(code__in=[code for code, _ in SERVICE_AREAS]),
                name="servicearea_code_valid",
            )
        ]

    def __str__(self) -> str:
        return self.label


KINDS = [("contact", "Contact enquiry"), ("waitlist", "Course waitlist")]
STATUSES = [
    ("new", "new"),
    ("contacted", "contacted"),
    ("qualified", "qualified"),
    ("closed", "closed"),
]


class Lead(models.Model):
    KINDS = KINDS
    STATUSES = STATUSES

    kind = models.CharField(max_length=10, choices=KINDS)
    status = models.CharField(max_length=10, choices=STATUSES, default="new")
    name = models.CharField(max_length=200)
    business_name = models.CharField(max_length=160, blank=True)
    # Deliberately free-form: email, phone or WhatsApp - whatever the
    # person gave us (docs/WEBSITE.md, Forms).
    contact = models.CharField(max_length=200)
    preferred_channel = models.CharField(
        max_length=20, choices=REPLY_CHANNELS, default="provided-contact"
    )
    service_areas = models.ManyToManyField(ServiceArea, related_name="leads", blank=True)
    # PROTECT: a waitlist sign-up is demand for one course, and the link is
    # fixed at submission. A course people are waiting for is unpublished,
    # not deleted (or its leads are deleted first, by an admin, audit-logged).
    course = models.ForeignKey(
        "content.Course", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    message = models.TextField(max_length=2000, blank=True)

    consent_contact_allowed = models.BooleanField("may contact them")
    consent_marketing_allowed = models.BooleanField("may send news", default=False)
    consent_notice_version = models.CharField("privacy notice version", max_length=40)
    consented_at = models.DateTimeField()

    utm_source = models.CharField(max_length=100, blank=True)
    utm_medium = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    utm_content = models.CharField(max_length=100, blank=True)
    utm_term = models.CharField(max_length=100, blank=True)
    landing_page = models.CharField(max_length=500, blank=True)
    referrer = models.CharField(max_length=500, blank=True)

    staff_notes = models.TextField(max_length=4000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    panels = [
        FieldRowPanel([FieldPanel("status"), FieldPanel("kind", read_only=True)]),
        FieldPanel("staff_notes"),
        MultiFieldPanel(
            [
                FieldPanel("name", read_only=True),
                FieldPanel("business_name", read_only=True),
                FieldPanel("contact", read_only=True),
                FieldPanel("preferred_channel", read_only=True),
                FieldPanel("service_areas", read_only=True),
                FieldPanel("course", read_only=True),
                FieldPanel("message", read_only=True),
            ],
            heading="What they sent",
        ),
        MultiFieldPanel(
            [
                FieldPanel("consent_contact_allowed", read_only=True),
                FieldPanel("consent_marketing_allowed", read_only=True),
                FieldPanel("consent_notice_version", read_only=True),
                FieldPanel("consented_at", read_only=True),
            ],
            heading="Consent (recorded at submission - never edited)",
        ),
        MultiFieldPanel(
            [
                FieldPanel("utm_source", read_only=True),
                FieldPanel("utm_medium", read_only=True),
                FieldPanel("utm_campaign", read_only=True),
                FieldPanel("utm_content", read_only=True),
                FieldPanel("utm_term", read_only=True),
                FieldPanel("landing_page", read_only=True),
                FieldPanel("referrer", read_only=True),
            ],
            heading="Attribution",
        ),
    ]

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "lead"
        constraints = [
            models.CheckConstraint(
                condition=Q(kind__in=[k for k, _ in KINDS]), name="lead_kind_valid"
            ),
            models.CheckConstraint(
                condition=Q(status__in=[s for s, _ in STATUSES]), name="lead_status_valid"
            ),
            models.CheckConstraint(
                condition=Q(preferred_channel__in=[c for c, _ in REPLY_CHANNELS]),
                name="lead_preferred_channel_valid",
            ),
            # No personal data without permission to use it (Law N° 058/2021).
            models.CheckConstraint(
                condition=Q(consent_contact_allowed=True), name="lead_has_contact_consent"
            ),
            models.CheckConstraint(
                condition=~Q(name="") & ~Q(contact="") & ~Q(consent_notice_version=""),
                name="lead_required_text_present",
            ),
            models.CheckConstraint(
                condition=~Q(kind="waitlist") | Q(course__isnull=False),
                name="lead_waitlist_names_a_course",
            ),
        ]
        indexes = [
            # The inbox: newest first, often filtered by status.
            models.Index(fields=["-created_at"], name="lead_newest_first"),
            models.Index(fields=["status", "-created_at"], name="lead_status_newest_first"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_kind_display()})"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk is not None:
            original = type(self).objects.filter(pk=self.pk).values(*IMMUTABLE_FIELDS).first()
            if original:
                for field, value in original.items():
                    setattr(self, field, value)
        super().save(*args, **kwargs)

    # A column in the lead inbox (leads/viewsets.py). Wagtail resolves
    # list_display names on the model, not the viewset, so it lives here.
    def service_areas_display(self) -> str:
        return ", ".join(area.label for area in self.service_areas.all()) or "—"

    service_areas_display.short_description = "Service areas"  # type: ignore[attr-defined]
