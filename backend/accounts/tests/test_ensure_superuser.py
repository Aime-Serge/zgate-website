"""The first admin from the environment, for hosts without a shell."""

from __future__ import annotations

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from accounts.models import User

STRONG = "correct-horse-battery-staple-7"


@pytest.fixture
def admin_env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "md@zgate.test")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", STRONG)
    return monkeypatch


@pytest.mark.django_db
def test_creates_the_first_admin(admin_env: pytest.MonkeyPatch) -> None:
    call_command("ensure_superuser")
    user = User.objects.get(email="md@zgate.test")
    assert user.is_superuser and user.is_staff
    assert user.check_password(STRONG)


@pytest.mark.django_db
def test_never_touches_an_existing_admin(admin_env: pytest.MonkeyPatch) -> None:
    User.objects.create_superuser(email="md@zgate.test", password="changed-in-the-admin-42")
    call_command("ensure_superuser")
    user = User.objects.get(email="md@zgate.test")
    assert user.check_password("changed-in-the-admin-42")
    assert User.objects.count() == 1


@pytest.mark.django_db
def test_does_nothing_without_the_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DJANGO_SUPERUSER_EMAIL", raising=False)
    monkeypatch.delenv("DJANGO_SUPERUSER_PASSWORD", raising=False)
    call_command("ensure_superuser")
    assert not User.objects.exists()


@pytest.mark.django_db
def test_refuses_a_weak_password(admin_env: pytest.MonkeyPatch) -> None:
    admin_env.setenv("DJANGO_SUPERUSER_PASSWORD", "password")
    with pytest.raises(CommandError, match="DJANGO_SUPERUSER_PASSWORD"):
        call_command("ensure_superuser")
    assert not User.objects.exists()


@pytest.mark.django_db
def test_never_promotes_an_existing_staff_account(admin_env: pytest.MonkeyPatch) -> None:
    User.objects.create_user(email="MD@zgate.test", password=STRONG)
    with pytest.raises(CommandError, match="isn't an admin"):
        call_command("ensure_superuser")
    assert not User.objects.filter(is_superuser=True).exists()
