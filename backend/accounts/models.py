"""
CMS staff accounts. Separate from the e-learning platform's accounts
(ADR-007): no shared sessions, no shared tables. Staff sign in with their
email address; there is no username.

Roles (accounts/roles.py):
  - Editors:     draft content; cannot publish, cannot see leads
  - Publishers:  everything an editor can, plus publish and work leads
                 (the Marketing lead)
  - Admins:      Django superusers - everything, plus staff accounts, the
                 audit log and the enrollment switch (the MD)
Only two people should hold publisher or admin (docs/SECURITY.md).
"""

from __future__ import annotations

from typing import Any, ClassVar

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.functions import Lower


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def _create(self, email: str, password: str | None, **extra: Any) -> User:
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra: Any) -> User:
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra: Any) -> User:
        extra.update(is_staff=True, is_superuser=True)
        return self._create(email, password, **extra)


class User(AbstractUser):
    username = None  # type: ignore[assignment]
    email = models.EmailField("email address", unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    objects = UserManager()  # type: ignore[misc]

    class Meta:
        verbose_name = "staff account"
        constraints = [
            # Ann@zgate.rw and ann@zgate.rw are the same person: one account,
            # one set of roles, one trail in the audit log.
            models.UniqueConstraint(
                Lower("email"),
                name="staff_email_unique_ignoring_case",
                violation_error_message="A staff account with this email address already exists.",
            )
        ]

    def __str__(self) -> str:
        return self.get_full_name() or self.email
