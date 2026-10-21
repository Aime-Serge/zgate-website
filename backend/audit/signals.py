"""
What the audit log records automatically:
  - leads: every create, change (field names) and delete;
  - staff accounts: every create, change - above all a role grant - and
    delete, because roles decide who can see leads;
  - every staff sign-in.
Reads of leads are recorded by the lead admin views (leads/views.py).
"""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save
from django.dispatch import receiver

from audit.record import changed_fields, record
from leads.models import Lead

User = get_user_model()
_BEFORE = "_audit_before"


def _snapshot(instance: Any) -> dict[str, Any]:
    values = {f.attname: getattr(instance, f.attname) for f in instance._meta.concrete_fields}
    if "password" in values:
        # Report a new password by name, never store a hash in the log.
        values["password"] = hash(values["password"])
    return values


@receiver(pre_save, sender=Lead)
@receiver(pre_save, sender=User)
def _remember(sender: type, instance: Any, **_kwargs: Any) -> None:
    if instance.pk is None:
        return
    previous = sender._default_manager.filter(pk=instance.pk).first()
    if previous is not None:
        setattr(instance, _BEFORE, _snapshot(previous))


def _target(instance: Any) -> str:
    return "leads" if isinstance(instance, Lead) else "users"


@receiver(post_save, sender=Lead)
@receiver(post_save, sender=User)
def _saved(sender: type, instance: Any, created: bool, **kwargs: Any) -> None:
    if created:
        record("create", _target(instance), [instance.pk])
        return
    before = getattr(instance, _BEFORE, None)
    fields = changed_fields(before, _snapshot(instance)) if before else []
    # Sign-in bookkeeping (last_login) alone is not an account change.
    if before is not None and not fields:
        return
    record("update", _target(instance), [instance.pk], fields=fields)


@receiver(post_delete, sender=Lead)
@receiver(post_delete, sender=User)
def _deleted(sender: type, instance: Any, **_kwargs: Any) -> None:
    record("delete", _target(instance), [instance.pk])


@receiver(m2m_changed, sender=User.groups.through)
def _groups_changed(sender: type, instance: Any, action: str, **_kwargs: Any) -> None:
    """Role grants and removals are group changes."""
    if action in ("post_add", "post_remove", "post_clear") and isinstance(instance, User):
        record("update", "users", [instance.pk], fields=["groups"])


@receiver(user_logged_in)
def _logged_in(sender: type, request: Any, user: Any, **_kwargs: Any) -> None:
    record("login", "users", [user.pk], actor=user)
