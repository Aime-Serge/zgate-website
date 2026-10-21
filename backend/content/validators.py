"""Field rules shared by the content models and blocks."""

import re

from django.core.exceptions import ValidationError

# Same rule the e-learning platform's enroll links rely on (course slugs);
# packages/cms-contracts/src/slug.ts holds the same pattern for the frontend.
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_HTTPS_URL = re.compile(r"^https://\S+$")

DIVISION_SLUGS = ("advisory", "academy", "tech", "data")
DIVISION_CHOICES = [(slug, slug.capitalize()) for slug in DIVISION_SLUGS]

# Page addresses the public site already uses for something else
# (frontend/src/lib/routes.ts): a page there would be hidden or would hide it.
RESERVED_PAGE_SLUGS = frozenset({*DIVISION_SLUGS, "insights", "search", "demos"})


def validate_slug(value: str) -> None:
    if not SLUG_PATTERN.match(value or ""):
        raise ValidationError(
            "Use lowercase letters, numbers and single hyphens (e.g. tax-basics)."
        )


def validate_href(value: str) -> None:
    """
    Links editors can enter: site-relative paths, or absolute https URLs
    (e.g. the e-learning platform). No javascript:, data: or plain http.
    """
    if not value:
        return
    if value.startswith("/") and not value.startswith("//"):
        return
    if _HTTPS_URL.match(value):
        return
    raise ValidationError("Use a site path like /contact, or a full https:// address.")


def validate_https_url(value: str) -> None:
    if value and not _HTTPS_URL.match(value):
        raise ValidationError("Use a full https:// address.")
