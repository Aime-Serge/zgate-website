"""Social accounts: the footer links to them, so each must be on its own network's site."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError

from content.models import SocialLink


@pytest.mark.parametrize(
    ("network", "url"),
    [
        ("linkedin", "https://www.linkedin.com/company/z-gate"),
        ("x", "https://x.com/zgate"),
        ("x", "https://twitter.com/zgate"),
        ("tiktok", "https://www.tiktok.com/@zgate"),
    ],
)
def test_an_address_on_the_network_is_accepted(network: str, url: str) -> None:
    SocialLink(network=network, url=url).clean()


@pytest.mark.parametrize(
    ("network", "url"),
    [
        ("facebook", "https://facebook.com.example.net/zgate"),  # look-alike domain
        ("instagram", "https://www.facebook.com/zgate"),  # wrong network
        ("youtube", "https://notyoutube.com/@zgate"),
    ],
)
def test_an_address_elsewhere_is_refused(network: str, url: str) -> None:
    with pytest.raises(ValidationError) as error:
        SocialLink(network=network, url=url).clean()
    assert "url" in error.value.message_dict
