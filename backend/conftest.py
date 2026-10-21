"""
Fixtures shared by every app's tests (pytest-django, settings
config.settings.test). Tests run against a real database: Postgres in CI
(DATABASE_URL), in-memory SQLite locally.
"""

from __future__ import annotations

import dataclasses
import io
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import Client

from accounts.models import User
from accounts.roles import EDITORS, PUBLISHERS
from leads.models import Lead


@pytest.fixture
def config(monkeypatch: pytest.MonkeyPatch):
    """Override validated settings for one test: config(lead_intake_token=...)."""

    def override(**changes: Any) -> None:
        monkeypatch.setattr(settings, "CONFIG", dataclasses.replace(settings.CONFIG, **changes))

    return override


@pytest.fixture
def seeded(db: None) -> None:
    call_command("seed_content", stdout=io.StringIO())


def _user(email: str, *, group: str | None = None, superuser: bool = False) -> User:
    if superuser:
        return User.objects.create_superuser(email=email, password="x" * 16)
    user = User.objects.create_user(email=email, password="x" * 16, is_staff=True)
    if group:
        user.groups.add(Group.objects.get(name=group))
    return user


@pytest.fixture
def editor(db: None) -> User:
    return _user("editor@test.invalid", group=EDITORS)


@pytest.fixture
def publisher(db: None) -> User:
    return _user("publisher@test.invalid", group=PUBLISHERS)


@pytest.fixture
def admin_user(db: None) -> User:
    return _user("admin@test.invalid", superuser=True)


@pytest.fixture
def no_revalidation(monkeypatch: pytest.MonkeyPatch) -> Iterator[list[str]]:
    """Captures revalidation calls instead of sending them."""
    sent: list[str] = []
    monkeypatch.setattr("content.signals.revalidate_site", sent.append)
    yield sent


@pytest.fixture
def make_lead(db: None) -> Callable[[], Lead]:
    """A lead as lead intake would store it: make_lead()."""

    def make() -> Lead:
        return Lead.objects.create(
            kind="contact",
            name="Audit Person",
            contact="+250 700 000 000",
            consent_contact_allowed=True,
            consent_notice_version="test",
            consented_at="2026-10-20T09:00:00Z",
        )

    return make


@pytest.fixture
def logged_in() -> Callable[[User], Client]:
    """An admin client signed in as `user`: logged_in(user)."""

    def login(user: User) -> Client:
        client = Client()
        client.force_login(user)
        return client

    return login
