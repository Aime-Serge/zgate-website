from __future__ import annotations

import pytest

from content.models import Course, SiteSettings
from content.revalidate import sign

# Produced by the frontend's own signer (packages/cms-contracts/src/webhook.ts,
# signRevalidation) for this body, secret and time: the CMS must sign
# byte-for-byte the same, or the frontend refuses every webhook.
BODY = '{"event":"content-changed","source":"pages"}'
TS_SIGNATURE = "t=1792054800,v1=92339eeff286cba7b1d159661031e937ef2452668c0404fbbe36657ca1444618"


def test_signs_exactly_like_the_frontend_verifies() -> None:
    assert sign(BODY, "s" * 32, now=1792054800) == TS_SIGNATURE


@pytest.mark.usefixtures("seeded")
def test_publishing_tells_the_site_and_drafts_do_not(no_revalidation: list[str]) -> None:
    no_revalidation.clear()
    course = Course.objects.get(slug="ebm-digital-invoicing")
    course.title = "New title"
    course.save_revision()
    assert no_revalidation == []
    course.save_revision().publish()
    assert no_revalidation == ["course"]


@pytest.mark.usefixtures("seeded")
def test_settings_changes_tell_the_site(no_revalidation: list[str]) -> None:
    no_revalidation.clear()
    site = SiteSettings.load()
    site.motto = "Where Business Meets Technology"
    site.save()
    assert no_revalidation == ["sitesettings"]
