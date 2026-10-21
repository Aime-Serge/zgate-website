"""
Writing audit entries, and knowing who is acting.

Signal handlers have no request, so CurrentUserMiddleware puts the signed-
in staff member in a context variable for the length of each request.
Lead intake marks its own work as a public submission. Anything else with
no user (seed, shell, migrations) is recorded as "system".
"""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

_current_user: ContextVar[Any] = ContextVar("audit_current_user", default=None)
_public_submission: ContextVar[bool] = ContextVar("audit_public_submission", default=False)


def set_current_user(user: Any) -> object:
    return _current_user.set(user)


def reset_current_user(token: Any) -> None:
    _current_user.reset(token)


def current_user() -> Any:
    user = _current_user.get()
    return user if user is not None and getattr(user, "is_authenticated", False) else None


@contextmanager
def public_submission() -> Iterator[None]:
    """Lead intake: what happens inside is an anonymous visitor's doing."""
    token = _public_submission.set(True)
    try:
        yield
    finally:
        _public_submission.reset(token)


def record(
    action: str,
    target: str,
    ids: Iterable[Any],
    *,
    actor: Any = None,
    fields: Iterable[str] | None = None,
) -> None:
    from audit.models import AuditLog

    who = actor if actor is not None else current_user()
    if who is not None:
        actor_type = "user"
    elif _public_submission.get():
        actor_type = "anonymous"
    else:
        actor_type = "system"
    AuditLog.objects.create(
        actor_type=actor_type,
        actor=who,
        actor_email=getattr(who, "email", "") or "",
        action=action,
        target_collection=target,
        doc_ids=[str(i) for i in ids],
        changed_fields=sorted(fields) if fields else [],
    )


# Bookkeeping the framework rewrites on saves - never a meaningful change.
IGNORED_FIELDS = {"id", "created_at", "updated_at", "last_login", "date_joined"}


def changed_fields(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    """
    Names of the fields that changed - never values. A new password shows
    up only as a new hash and is reported as "password".
    """
    keys = set(before) | set(after)
    return sorted(
        key for key in keys if key not in IGNORED_FIELDS and before.get(key) != after.get(key)
    )
