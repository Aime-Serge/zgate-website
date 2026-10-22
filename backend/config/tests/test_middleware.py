"""What the CMS answers, and on which host (config/middleware.py)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import pytest
from django.test import Client

CMS_HOST = "cms.example.rw"
PLATFORM_HOST = "zgate-website-cms.onrender.com"


@pytest.fixture
def production(config: Callable[..., None], settings: Any) -> None:
    """Production, reachable at its own domain and at a platform address."""
    config(environment="production", admin_url=f"https://{CMS_HOST}")
    settings.ALLOWED_HOSTS = [CMS_HOST, PLATFORM_HOST]


STAFF_PATHS = ["/admin/", "/admin", "/static/wagtailadmin/x.css", "/documents/1/"]


@pytest.mark.usefixtures("production")
@pytest.mark.parametrize("path", STAFF_PATHS)
def test_the_staff_side_answers_only_on_the_cms_domain(client: Client, path: str) -> None:
    assert client.get(path, HTTP_HOST=PLATFORM_HOST).status_code == 404


@pytest.mark.django_db
@pytest.mark.usefixtures("production")
def test_the_admin_still_answers_on_the_cms_domain(client: Client) -> None:
    response = client.get("/admin/", HTTP_HOST=CMS_HOST, secure=True)
    assert response.status_code == 302  # to the sign-in page
    assert "/admin/login/" in response["Location"]


@pytest.mark.django_db
@pytest.mark.usefixtures("production")
@pytest.mark.parametrize("host", [CMS_HOST, PLATFORM_HOST])
def test_health_checks_and_robots_answer_on_any_allowed_host(client: Client, host: str) -> None:
    assert client.get("/api/health", HTTP_HOST=host).status_code == 200
    assert client.get("/robots.txt", HTTP_HOST=host).status_code == 200


@pytest.mark.django_db
def test_outside_production_any_allowed_host_reaches_the_admin(client: Client) -> None:
    assert client.get("/admin/", HTTP_HOST="127.0.0.1").status_code == 302


def test_everything_else_is_not_found(client: Client) -> None:
    assert client.get("/about").status_code == 404
