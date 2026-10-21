from wagtail import hooks
from wagtail.permissions import register_permission_policy

from leads.models import Lead
from leads.viewsets import LeadPermissionPolicy, lead_viewset

register_permission_policy(Lead, LeadPermissionPolicy(Lead))


@hooks.register("register_admin_viewset")
def register_leads() -> object:
    return lead_viewset
