"""
Audit trail for Confidential data on the website - leads and consent
records (docs/SECURITY.md) - and for the staff
accounts whose roles decide who can see them.

Append-only: entries are written by server code (audit/record.py) and can
never be changed or deleted through the application, admins included. The
database enforces it too, with a trigger (migrations/0002_integrity.py):
no DELETE, and no UPDATE except the one Django makes when an actor's
account is deleted (actor -> NULL; actor_email keeps who it was).
"""

from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import models
from django.db.models import Q

ACTOR_TYPES = [("user", "user"), ("system", "system"), ("anonymous", "anonymous")]
ACTIONS = [
    ("read", "read"),
    ("create", "create"),
    ("update", "update"),
    ("delete", "delete"),
    ("login", "login"),
]


class AuditLog(models.Model):
    ACTOR_TYPES = ACTOR_TYPES
    ACTIONS = ACTIONS

    actor_type = models.CharField(max_length=10, choices=ACTOR_TYPES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    # A snapshot: the account (and so the link above) may be deleted later;
    # the log must still say who it was.
    actor_email = models.EmailField(blank=True)
    action = models.CharField(max_length=10, choices=ACTIONS)
    target_collection = models.CharField(max_length=60)
    doc_ids = models.JSONField(default=list)
    # Updates only: which fields changed - names, never values, so the log
    # never becomes a second copy of personal data.
    changed_fields = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "audit log entry"
        verbose_name_plural = "audit log"
        constraints = [
            models.CheckConstraint(
                condition=Q(actor_type__in=[t for t, _ in ACTOR_TYPES]),
                name="auditlog_actor_type_valid",
            ),
            models.CheckConstraint(
                condition=Q(action__in=[a for a, _ in ACTIONS]), name="auditlog_action_valid"
            ),
            # A staff member's entry always says who, even after their account
            # (and so the actor link) is gone.
            models.CheckConstraint(
                condition=~Q(actor_type="user") | ~Q(actor_email=""),
                name="auditlog_user_entries_name_the_user",
            ),
            models.CheckConstraint(
                condition=Q(actor_type="user") | Q(actor__isnull=True),
                name="auditlog_only_users_have_an_actor",
            ),
        ]
        indexes = [
            # "What happened to leads (or accounts), newest first" - the
            # admin's filter and order. Also serves target_collection alone.
            models.Index(
                fields=["target_collection", "-created_at"], name="auditlog_target_newest_first"
            ),
        ]

    def __str__(self) -> str:
        who = self.actor_email or self.actor_type
        return f"{self.created_at:%Y-%m-%d %H:%M} {who} {self.action} {self.target_collection}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk is not None:
            raise PermissionDenied("Audit log entries can't be changed.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise PermissionDenied("Audit log entries can't be deleted.")
