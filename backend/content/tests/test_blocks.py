"""The homepage sections and the rules that keep them honest."""

from __future__ import annotations

import pytest
from django.test import Client
from wagtail import blocks

from content.blocks import PAGE_BLOCKS, HeroBlock, ScenarioBlock
from content.seed import home_layout


def test_the_seeded_homepage_passes_every_block_rule() -> None:
    stream = blocks.StreamBlock(PAGE_BLOCKS)
    value = stream.to_python([{"type": t, "value": v} for t, v in home_layout()])
    stream.clean(value)  # raises on any invalid block


def test_the_gradient_words_must_open_the_headline() -> None:
    hero = HeroBlock()
    value = hero.to_python(
        {"headline": "Stop juggling four vendors.", "headline_accent": "Juggling"}
    )
    with pytest.raises(blocks.StructBlockValidationError):
        hero.clean(value)
    ok = hero.to_python({"headline": "Stop juggling four vendors.", "headline_accent": "Stop"})
    assert hero.clean(ok)["headline_accent"] == "Stop"


def test_a_scenario_figure_always_carries_its_label() -> None:
    scenario = ScenarioBlock()
    value = scenario.to_python(
        {"situation": "The EBM stops", "response": "We respond.", "figure": "4 hrs"}
    )
    with pytest.raises(blocks.StructBlockValidationError):
        scenario.clean(value)


@pytest.mark.usefixtures("seeded")
def test_the_homepage_api_serves_the_new_sections(client: Client) -> None:
    layout = client.get("/api/pages/home").json()["layout"]
    types = [block["blockType"] for block in layout]
    for expected in ("showcase", "spotlights", "pillars", "audiences", "scenarios", "trust"):
        assert expected in types
    hero = layout[0]
    assert hero["layout"] == "centered"
    assert hero["headline"].startswith(hero["headlineAccent"])
    scenarios = next(b for b in layout if b["blockType"] == "scenarios")
    assert "not client case studies" in scenarios["note"]
    assert all(
        isinstance(point, str) for point in layout[types.index("audiences")]["items"][0]["points"]
    )
