"""The Demo Library: placeholders until a demo is recorded, then a video."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.test import Client

from content.models import Demo
from content.seed import DEMOS


@pytest.fixture
def api(client: Client, config) -> Client:
    config(cms_api_token=None)
    return client


@pytest.mark.usefixtures("seeded")
def test_every_seeded_demo_is_listed_as_a_placeholder(api: Client) -> None:
    docs = api.get("/api/demos").json()["docs"]
    assert {doc["slug"] for doc in docs} == {d["slug"] for d in DEMOS}
    for doc in docs:
        # Nothing recorded yet: no video, and so no duration to show either.
        assert doc["videoUrl"] is None
        assert doc["duration"] is None


@pytest.mark.usefixtures("seeded")
def test_a_demo_names_the_kinds_of_business_it_is_for(api: Client) -> None:
    docs = {doc["slug"]: doc for doc in api.get("/api/demos").json()["docs"]}
    ebm = docs["ebm-setup-and-receipt-checks"]
    assert [a["slug"] for a in ebm["audiences"]] == ["traders-and-shops"]
    assert ebm["division"] == "advisory"


@pytest.mark.usefixtures("seeded")
def test_a_recorded_demo_shows_its_video_and_duration(api: Client) -> None:
    demo = Demo.objects.get(slug="one-relationship-four-teams")
    demo.video_url = "https://videos.example.rw/one-relationship.mp4"
    demo.duration = "2 min 15 s"
    demo.save()
    demo.save_revision().publish()
    doc = next(d for d in api.get("/api/demos").json()["docs"] if d["slug"] == demo.slug)
    assert doc["videoUrl"] == "https://videos.example.rw/one-relationship.mp4"
    assert doc["duration"] == "2 min 15 s"


@pytest.mark.django_db
def test_only_an_https_video_link_is_accepted() -> None:
    demo = Demo(slug="x", title="X", summary="X", division="tech", video_url="http://example.rw/v")
    with pytest.raises(ValidationError) as error:
        demo.full_clean(exclude=["audiences"])
    assert "video_url" in error.value.message_dict
