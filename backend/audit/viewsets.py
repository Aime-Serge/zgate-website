"""The audit log in the Wagtail admin: admins (superusers) only, view only."""

from __future__ import annotations

from typing import Any

from wagtail.admin.viewsets.model import ModelViewSet
from wagtail.permission_policies.base import ModelPermissionPolicy

from audit.models import AuditLog


class AdminsViewOnly(ModelPermissionPolicy):
    def user_has_permission(self, user: Any, action: str) -> bool:
        return action == "view" and bool(user.is_active and user.is_superuser)

    def user_has_any_permission(self, user: Any, actions: list[str]) -> bool:
        return any(self.user_has_permission(user, action) for action in actions)


class AuditLogViewSet(ModelViewSet):
    model = AuditLog
    icon = "history"
    menu_label = "Audit log"
    menu_order = 900
    add_to_admin_menu = True
    list_display = ["created_at", "actor_email", "action", "target_collection", "changed_fields"]
    list_filter = ["action", "target_collection", "actor_type"]
    inspect_view_enabled = True
    # Required by the viewset; never reachable - the policy refuses edits.
    form_fields = ["target_collection"]


audit_log_viewset = AuditLogViewSet("audit-log")
