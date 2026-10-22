"""
Creates the first admin from the environment, once:

    DJANGO_SUPERUSER_EMAIL=you@company.rw DJANGO_SUPERUSER_PASSWORD=... \
        python manage.py ensure_superuser

For hosts with no shell to run `createsuperuser` on (Render's free tier,
render.free.yaml). It does nothing once any admin exists, or when the
variables aren't set, so it is safe on every start and never resets a
password changed in the admin. The password must pass the same rules as
any other (AUTH_PASSWORD_VALIDATORS); remove both variables from the host
after the first sign-in.
"""

from __future__ import annotations

import os
from typing import Any

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


class Command(BaseCommand):
    help = "Creates the first admin from DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD."

    def handle(self, *args: Any, **options: Any) -> None:
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("ensure_superuser: an admin already exists, skipped")
            return
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        if not email or not password:
            self.stdout.write("ensure_superuser: DJANGO_SUPERUSER_EMAIL/PASSWORD not set, skipped")
            return
        if User.objects.filter(email__iexact=email).exists():
            # Never promote an existing account from the environment.
            raise CommandError(f"A staff account for {email} exists but isn't an admin.")
        try:
            validate_password(password, User(email=email))
        except ValidationError as error:
            raise CommandError("DJANGO_SUPERUSER_PASSWORD: " + " ".join(error.messages)) from None
        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"ensure_superuser: created admin {email}"))
