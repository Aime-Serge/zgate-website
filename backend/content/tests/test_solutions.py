"""Solution pages: one per kind of business, published under /solutions."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.test import Client
from wagtail import blocks

from content.blocks import PAGE_BLOCKS
from content.models import SitePage
from content.seed import PAGES

SOLUTION_SLUGS = {spec["slug"] for spec in PAGES if spec["page_type"] == "solution"}


@pytest.mark.parametrize("spec", PAGES, ids=lambda spec: spec["slug"])
def test_every_seeded_page_passes_every_block_rule(spec: dict) -> None:
    stream = blocks.StreamBlock(PAGE_BLOCKS)
    value = stream.to_python([{"type": t, "value": v} for t, v in spec["layout"]()])
    stream.clean(value)  # raises on any invalid block


@pytest.mark.usefixtures("seeded")
def test_solution_pages_are_listed_with_their_summary(client: Client) -> None:
    docs = client.get("/api/pages").json()["docs"]
    solutions = {doc["slug"]: doc for doc in docs if doc["pageType"] == "solution"}
    assert set(solutions) == SOLUTION_SLUGS
    assert all(doc["meta"]["description"] for doc in solutions.values())


@pytest.mark.usefixtures("seeded")
def test_the_solutions_page_lists_them_and_offers_a_way_by_need(client: Client) -> None:
    layout = client.get("/api/pages/solutions").json()["layout"]
    types = [block["blockType"] for block in layout]
    assert "solutionGrid" in types
    assert "doors" in types
    assert types[-1] == "callToAction"


@pytest.mark.usefixtures("seeded")
def test_homepage_tabs_lead_to_solution_pages(client: Client) -> None:
    layout = client.get("/api/pages/home").json()["layout"]
    audiences = next(block for block in layout if block["blockType"] == "audiences")
    targets = {item["href"].removeprefix("/solutions/") for item in audiences["items"]}
    assert targets == SOLUTION_SLUGS


def _page(**fields: object) -> SitePage:
    page = SitePage(**{"title": "Test", "page_type": "marketing", **fields})
    page.layout = [("callToAction", {"heading": "Talk", "label": "Go", "href": "/contact"})]
    return page


@pytest.mark.django_db
@pytest.mark.parametrize("slug", ["advisory", "search", "insights"])
def test_a_page_cannot_take_an_address_the_site_already_uses(slug: str) -> None:
    with pytest.raises(ValidationError) as error:
        _page(slug=slug).clean()
    assert "slug" in error.value.message_dict


@pytest.mark.usefixtures("seeded")
def test_page_addresses_are_unique_across_the_whole_site() -> None:
    # A sibling-level check isn't enough: the site finds a page by slug alone.
    with pytest.raises(ValidationError) as error:
        _page(slug="traders-and-shops").clean()
    assert "slug" in error.value.message_dict


@pytest.mark.django_db
def test_a_solution_page_needs_the_summary_the_menu_shows() -> None:
    page = _page(slug="farmers", page_type="solution")
    with pytest.raises(ValidationError) as error:
        page.clean()
    assert "search_description" in error.value.message_dict
    page.search_description = "Help for farmers."
    page.clean()
