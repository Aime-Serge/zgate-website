"""The audit trail: what is recorded, and that nobody can rewrite it."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import pytest
from django.contrib.auth.models import Group
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError, transaction
from django.test import Client
from wagtail.permissions import policy_registry

from accounts.models import User
from accounts.roles import PUBLISHERS
from audit.models import AuditLog

pytestmark = pytest.mark.usefixtures("seeded")


def test_every_staff_read_of_a_lead_is_recorded(
    publisher: User, logged_in: Any, make_lead: Any
) -> None:
    lead = make_lead()
    client = logged_in(publisher)
    assert client.get(f"/admin/leads/edit/{lead.pk}/").status_code == 200
    reads = AuditLog.objects.filter(action="read", actor=publisher, target_collection="leads")
    assert [str(lead.pk)] in [entry.doc_ids for entry in reads]


def test_lead_updates_record_field_names_never_values(make_lead: Any) -> None:
    lead = make_lead()
    lead.status = "contacted"
    lead.staff_notes = "Called back"
    lead.save()
    entry = AuditLog.objects.filter(action="update", target_collection="leads").latest("id")
    assert entry.changed_fields == ["staff_notes", "status"]
    assert "Called back" not in str(entry.__dict__)


def test_role_grants_password_changes_and_sign_ins_are_recorded(editor: User) -> None:
    editor.groups.add(Group.objects.get(name=PUBLISHERS))
    grant = AuditLog.objects.filter(target_collection="users", action="update").latest("id")
    assert grant.changed_fields == ["groups"]
    assert grant.doc_ids == [str(editor.pk)]

    editor.set_password("a-new-long-password-123")
    editor.save()
    change = AuditLog.objects.filter(target_collection="users", action="update").latest("id")
    assert change.changed_fields == ["password"]

    Client().post(
        "/admin/login/",
        {"username": editor.email, "password": "a-new-long-password-123"},
    )
    login = AuditLog.objects.filter(action="login").latest("id")
    assert login.actor_email == editor.email


def test_the_log_still_names_someone_whose_account_was_deleted(
    publisher: User, logged_in: Any, make_lead: Any
) -> None:
    lead = make_lead()
    logged_in(publisher).get(f"/admin/leads/edit/{lead.pk}/")
    email = publisher.email
    publisher.delete()
    read = AuditLog.objects.filter(action="read", actor_email=email).latest("id")
    assert read.actor is None
    assert read.doc_ids == [str(lead.pk)]


def test_the_audit_log_is_append_only_even_for_admins(admin_user: User) -> None:
    entry = AuditLog.objects.first()
    assert entry is not None
    entry.action = "create"
    with pytest.raises(PermissionDenied):
        entry.save()
    with pytest.raises(PermissionDenied):
        entry.delete()
    policy = policy_registry.get_by_type(AuditLog)
    assert policy.user_has_permission(admin_user, "view")
    assert not policy.user_has_permission(admin_user, "change")


def test_the_audit_log_is_hidden_from_publishers(publisher: User, logged_in: Any) -> None:
    assert logged_in(publisher).get("/admin/audit-log/").status_code in (302, 403)


def _refused(write: Callable[[], Any]) -> str:
    with pytest.raises(IntegrityError) as error, transaction.atomic():
        write()
    return str(error.value)


def test_the_database_refuses_to_rewrite_or_delete_entries(admin_user: User) -> None:
    """Around the model too: a bulk update or delete, a shell, SQL (migrations/0002)."""
    entry = AuditLog.objects.create(
        actor_type="user",
        actor=admin_user,
        actor_email=admin_user.email,
        action="read",
        target_collection="leads",
        doc_ids=["1"],
    )
    entries = AuditLog.objects.filter(pk=entry.pk)
    for write in (
        lambda: entries.update(action="create"),
        lambda: entries.update(doc_ids=["2"]),
        lambda: entries.update(actor_email="someone-else@test.invalid"),
        lambda: entries.update(actor=None, actor_email=""),  # unlinking may not erase who
        lambda: entries.delete(),
        lambda: AuditLog.objects.all().delete(),
    ):
        assert "append-only" in _refused(write)
    assert entries.get().action == "read"


@pytest.mark.parametrize(
    "entry",
    [
        {"actor_type": "robot", "action": "read"},
        {"actor_type": "system", "action": "erase"},
        {"actor_type": "user", "action": "read", "actor_email": ""},
    ],
    ids=["actor type", "action", "user without email"],
)
def test_the_database_refuses_an_entry_that_doesnt_say_who_and_what(entry: dict) -> None:
    _refused(lambda: AuditLog.objects.create(target_collection="leads", doc_ids=[], **entry))


def test_only_staff_entries_link_an_account(editor: User) -> None:
    _refused(
        lambda: AuditLog.objects.create(
            actor_type="system", actor=editor, action="read", target_collection="leads"
        )
    )
