from __future__ import annotations

import pytest
from django.test import Client

from content.models import Article, Course, SitePage, SiteSettings

pytestmark = pytest.mark.usefixtures("seeded")


def test_serves_the_homepage_blocks_in_order(client: Client) -> None:
    page = client.get("/api/pages/home").json()
    assert [b["blockType"] for b in page["layout"]] == [
        "hero",
        "showcase",
        "spotlights",
        "factStrip",
        "commitments",
        "pillars",
        "marketFacts",
        "audiences",
        "scenarios",
        "trust",
        "latest",
        "steps",
        "callToAction",
    ]
    hero = page["layout"][0]
    assert hero["cta"] == {"label": "Start Now", "href": "/contact"}
    assert hero["layout"] == "centered"
    assert page["meta"]["title"].startswith("Z-GATE Solution")


def test_never_serves_a_draft_page(client: Client) -> None:
    assert client.get("/api/pages/privacy").status_code == 404
    slugs = [p["slug"] for p in client.get("/api/pages").json()["docs"]]
    assert "privacy" not in slugs


def test_serves_the_published_version_not_a_newer_draft(client: Client) -> None:
    course = Course.objects.get(slug="ebm-digital-invoicing")
    course.title = "Draft title"
    course.save_revision()  # a draft, not published
    served = client.get("/api/courses/ebm-digital-invoicing").json()
    assert served["title"] == "EBM & Digital Invoicing Mastery"


def test_unpublished_snippets_disappear(client: Client) -> None:
    Course.objects.get(slug="ebm-digital-invoicing").unpublish()
    slugs = [c["slug"] for c in client.get("/api/courses").json()["docs"]]
    assert slugs == ["tax-bookkeeping-fundamentals"]


def test_division_shape(client: Client) -> None:
    division = client.get("/api/divisions/advisory").json()
    assert division["shortName"] == "Advisory"
    assert division["cta"] == {"label": "Request a consultation", "href": "/contact"}
    assert division["objection"]["question"] == "Can I afford ongoing help?"
    assert len(division["included"]) == 5
    assert client.get("/api/divisions/not-a-division").status_code == 404


def test_settings_keep_the_staff_inbox_private(client: Client) -> None:
    site = SiteSettings.load()
    site.lead_notification_email = "staff@example.rw"
    site.save()
    body = client.get("/api/site-settings").json()
    assert body["legalName"] == "Z-GATE LTD"
    assert "staff@example.rw" not in str(body)


def test_rich_text_is_sanitized(client: Client) -> None:
    Article.objects.create(
        title="EBM basics",
        slug="ebm-basics",
        published_on="2026-10-20",
        author_name="Z-GATE",
        excerpt="What an EBM is.",
        body='<p>Hi<script>alert(1)</script></p><p><a href="javascript:alert(1)">x</a></p>',
    ).save_revision().publish()
    body = client.get("/api/articles/ebm-basics").json()["body"]
    assert "<script" not in body
    assert "javascript:" not in body
    assert body.startswith("<p>Hi")


def test_marketing_pages_need_a_next_step() -> None:
    page = SitePage.objects.get(slug="about")
    page.layout = [("hero", {"headline": "No next step"})]
    with pytest.raises(Exception, match="next step"):
        page.full_clean()


def test_only_the_cms_is_served_with_its_security_headers(client: Client) -> None:
    assert client.get("/old-public-page").status_code == 404
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "default-src 'self'" in response["Content-Security-Policy"]
    assert response["X-Robots-Tag"] == "noindex, nofollow"
    assert client.get("/robots.txt").content == b"User-agent: *\nDisallow: /\n"


def test_open_without_an_api_token(client: Client) -> None:
    assert client.get("/api/site-settings").status_code == 200


def test_requires_the_api_token_when_one_is_set(client: Client, config) -> None:
    token = "a" * 32
    config(cms_api_token=token)
    assert client.get("/api/pages/home").status_code == 401
    assert client.get("/api/divisions", HTTP_AUTHORIZATION="Bearer wrong").status_code == 401
    found = client.get("/api/pages/home", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert found.status_code == 200
    # Without the token, a missing page looks the same as a present one.
    assert client.get("/api/pages/nope").status_code == 401
    missing = client.get("/api/pages/nope", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert missing.status_code == 404
    # Liveness and readiness stay open for load balancers and uptime checks.
    assert client.get("/api/health").status_code == 200


def test_is_read_only(client: Client) -> None:
    assert client.post("/api/pages/home").status_code == 405
