"""Staff accounts: one per person, whatever the capitalisation of their email."""

from __future__ import annotations

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from accounts.models import User


@pytest.mark.django_db
def test_an_email_in_another_case_is_the_same_account() -> None:
    User.objects.create_user(email="Ann@zgate.test", password="x" * 16)

    with pytest.raises(IntegrityError), transaction.atomic():
        User.objects.create_user(email="ann@zgate.test", password="x" * 16)

    # Admin forms validate model constraints first, so staff see a message.
    with pytest.raises(ValidationError, match="already exists"):
        User(email="ANN@zgate.test").validate_constraints()
