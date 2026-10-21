"""
The same samples as tests/contracts/src/courseSlug.test.ts, which checks
the frontend's copy of the rule against the e-learning contract. Here the
CMS's own validator must agree with both.
"""

import pytest
from django.core.exceptions import ValidationError

from content.validators import validate_slug

ACCEPTED = ["tax-bookkeeping-fundamentals", "ebm-digital-invoicing", "a1", "course-2026"]
REFUSED = ["Tax", "tax basics", "-lead", "trail-", "double--hyphen", "../etc", "taxé", ""]


@pytest.mark.parametrize("slug", ACCEPTED)
def test_accepts(slug: str) -> None:
    validate_slug(slug)


@pytest.mark.parametrize("slug", REFUSED)
def test_refuses(slug: str) -> None:
    with pytest.raises(ValidationError):
        validate_slug(slug)
