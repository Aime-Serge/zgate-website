"""
Lead form validation - the same rules and messages as the frontend's
schema (packages/website-contracts/src/leads/schema.ts), applied again
here because the bearer token proves the caller is our frontend, not that
its input is sound. leads/tests/test_forms.py runs the TS schema's test
cases against this.

Field names are the frontend's (camelCase), so a submission binds as is.
Plain-language messages and a deliberately free-form "contact" field
(email, phone or WhatsApp) carry over from the v1 contact form.
"""

from __future__ import annotations

from typing import Any

from django import forms

SERVICE_AREAS = ("advisory", "academy", "tech", "data", "not-sure")
REPLY_CHANNELS = ("provided-contact", "whatsapp", "phone", "email")
ATTRIBUTION_FIELDS = (
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmContent",
    "utmTerm",
    "landingPage",
    "referrer",
)
_ATTRIBUTION_LIMITS = {"landingPage": 500, "referrer": 500}


def _too_big(limit: int) -> str:
    return f"Too big: expected string to have <={limit} characters"


class CheckboxField(forms.Field):
    """An HTML checkbox as the browser posts it: "on" (or "true") when ticked."""

    def to_python(self, value: Any) -> bool:
        return value in ("on", "true")

    def validate(self, value: bool) -> None:
        if self.required and not value:
            raise forms.ValidationError(self.error_messages["required"], code="required")


class LeadForm(forms.Form):
    _kind_error = 'Invalid option: expected one of "contact"|"waitlist"'
    kind = forms.ChoiceField(
        choices=[("contact", "Enquiry"), ("waitlist", "Course waitlist")],
        error_messages={"required": _kind_error, "invalid_choice": _kind_error},
    )
    name = forms.CharField(
        max_length=200,
        error_messages={"required": "Enter your name.", "max_length": _too_big(200)},
    )
    businessName = forms.CharField(required=False, max_length=160)
    contact = forms.CharField(
        max_length=200,
        error_messages={
            "required": "Enter a phone number, WhatsApp number or email so we can reach you.",
            "max_length": _too_big(200),
        },
    )
    preferredChannel = forms.ChoiceField(
        choices=[(value, value) for value in REPLY_CHANNELS],
        required=False,
        initial="provided-contact",
    )
    serviceInterests = forms.MultipleChoiceField(
        choices=[(value, value) for value in SERVICE_AREAS],
        required=False,
        error_messages={"invalid_choice": "Choose a listed service area."},
    )
    courseId = forms.IntegerField(
        required=False,
        min_value=1,
        error_messages={
            "invalid": "Invalid input: expected number",
            "min_value": "Too small: expected number to be >0",
        },
    )
    message = forms.CharField(
        required=False, max_length=2000, error_messages={"max_length": _too_big(2000)}
    )
    consentContact = CheckboxField(
        error_messages={"required": "Please agree so we can contact you about your enquiry."}
    )
    consentMarketing = CheckboxField(required=False)

    def clean_preferredChannel(self) -> str:
        return self.cleaned_data["preferredChannel"] or "provided-contact"

    def clean(self) -> dict[str, Any]:
        cleaned = super().clean()
        services = cleaned.get("serviceInterests", [])
        if cleaned.get("kind") == "contact":
            if len(set(services)) != len(services):
                self.add_error("serviceInterests", "Choose each service only once.")
            elif not services:
                self.add_error(
                    "serviceInterests", "Choose at least one service, or select Not sure yet."
                )
            elif "not-sure" in services and len(services) > 1:
                self.add_error(
                    "serviceInterests",
                    "Choose Not sure yet by itself, or select one or more services.",
                )
        elif cleaned.get("kind") == "waitlist" and services:
            self.add_error("serviceInterests", "Course waitlists are routed through Academy.")
        if (
            cleaned.get("kind") == "waitlist"
            and cleaned.get("courseId") is None
            and "courseId" not in self.errors
        ):
            self.add_error("courseId", "Choose a course.")
        return cleaned

    def field_errors(self) -> dict[str, str]:
        """The first error per field, the shape the frontend shows."""
        return {field: str(errors[0]) for field, errors in self.errors.items()}


def attribution(form: dict[str, str | list[str]]) -> dict[str, str]:
    """UTM and referrer captured in the browser: trimmed and capped, never an error."""

    def trimmed(key: str) -> str:
        value = form.get(key, "")
        return value.strip() if isinstance(value, str) else ""

    return {key: trimmed(key)[: _ATTRIBUTION_LIMITS.get(key, 100)] for key in ATTRIBUTION_FIELDS}
