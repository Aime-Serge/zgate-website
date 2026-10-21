"""
The lead inbox in the Wagtail admin (Leads in the menu).

  - Publishers see and work leads (status, staff notes); editors can't.
  - Nobody adds a lead by hand: lead intake is the only way in.
  - Only admins (superusers) delete.
  - Every list or record a staff member opens is a "read" in the audit log.
"""

from __future__ import annotations

from typing import Any

from django.http import HttpRequest, HttpResponse
from wagtail.admin.views.generic import EditView, IndexView
from wagtail.admin.viewsets.model import ModelViewSet
from wagtail.permission_policies.base import ModelPermissionPolicy

from audit.record import record
from leads.models import Lead


class LeadPermissionPolicy(ModelPermissionPolicy):
    def user_has_permission(self, user: Any, action: str) -> bool:
        if action == "add":
            return False
        if action == "delete":
            return bool(user.is_active and user.is_superuser)
        return super().user_has_permission(user, action)

    def user_has_any_permission(self, user: Any, actions: list[str]) -> bool:
        return any(self.user_has_permission(user, action) for action in actions)


class LeadIndexView(IndexView):
    def get_base_queryset(self):
        # The "Service areas" column: one query for the page, not one per lead.
        return super().get_base_queryset().prefetch_related("service_areas")

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        ids = [lead.pk for lead in context.get("object_list", [])]
        if ids:
            record("read", "leads", ids)
        return context


class LeadEditView(EditView):
    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        response = super().get(request, *args, **kwargs)
        record("read", "leads", [self.object.pk])
        return response


class LeadViewSet(ModelViewSet):
    model = Lead
    icon = "mail"
    menu_label = "Leads"
    menu_order = 200
    add_to_admin_menu = True
    list_display = ["name", "kind", "service_areas_display", "status", "created_at"]
    list_filter = ["kind", "status", "service_areas__code"]
    index_view_class = LeadIndexView
    edit_view_class = LeadEditView
    inspect_view_enabled = False
    panels = Lead.panels


lead_viewset = LeadViewSet("leads")
