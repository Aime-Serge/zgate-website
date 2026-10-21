"""
The same cases as the frontend's schema tests
(packages/website-contracts/src/leads/schema.test.ts): the CMS must
accept and refuse exactly what the site's own form does.
"""

from typing import Any

from leads.forms import LeadForm, attribution


def validate(data: dict[str, str | list[str]]) -> tuple[dict[str, Any] | None, dict[str, str]]:
    form = LeadForm(data=data)
    return (form.cleaned_data, {}) if form.is_valid() else (None, form.field_errors())


BASE = {
    "kind": "contact",
    "name": "  Solange  ",
    "contact": "+250 788 000 000",
    "serviceInterests": ["advisory"],
    "message": "",
    "consentContact": "on",
}


def test_accepts_a_minimal_contact_enquiry_and_trims_input() -> None:
    data, errors = validate(BASE)
    assert errors == {}
    assert data is not None
    assert data["name"] == "Solange"
    assert data["preferredChannel"] == "provided-contact"
    assert data["consentMarketing"] is False


def test_requires_contact_consent_with_a_plain_language_reason() -> None:
    _, errors = validate({**BASE, "consentContact": ""})
    assert "agree" in errors["consentContact"]


def test_requires_a_course_on_the_waitlist_form() -> None:
    waitlist = {**BASE, "kind": "waitlist", "serviceInterests": []}
    assert validate(waitlist)[1] == {"courseId": "Choose a course."}
    assert validate({**waitlist, "courseId": "3"})[1] == {}


def test_rejects_oversized_input() -> None:
    assert "name" in validate({**BASE, "name": "x" * 201})[1]


def test_allows_multiple_service_areas() -> None:
    data, errors = validate({**BASE, "serviceInterests": ["advisory", "data"]})
    assert errors == {}
    assert data is not None
    assert data["serviceInterests"] == ["advisory", "data"]


def test_requires_a_service_area_for_contact_enquiries() -> None:
    _, errors = validate({**BASE, "serviceInterests": []})
    assert errors == {"serviceInterests": "Choose at least one service, or select Not sure yet."}


def test_not_sure_must_be_selected_by_itself() -> None:
    _, errors = validate({**BASE, "serviceInterests": ["not-sure", "tech"]})
    assert errors == {
        "serviceInterests": "Choose Not sure yet by itself, or select one or more services."
    }


def test_course_waitlists_are_routed_only_through_academy() -> None:
    data, errors = validate(
        {**BASE, "kind": "waitlist", "courseId": "3", "serviceInterests": ["data"]}
    )
    assert data is None
    assert errors == {"serviceInterests": "Course waitlists are routed through Academy."}


def test_messages_match_the_site_form() -> None:
    _, errors = validate({"kind": "contact"})
    assert errors["name"] == "Enter your name."
    assert errors["contact"] == (
        "Enter a phone number, WhatsApp number or email so we can reach you."
    )


def test_attribution_is_trimmed_and_capped_never_an_error() -> None:
    cleaned = attribution({"utmSource": f"  {'f' * 300}  ", "referrer": "https://x.example/"})
    assert cleaned["utmSource"] == "f" * 100
    assert cleaned["referrer"] == "https://x.example/"
    assert cleaned["utmTerm"] == ""
