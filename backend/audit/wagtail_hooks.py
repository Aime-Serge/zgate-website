from wagtail import hooks
from wagtail.permissions import register_permission_policy

from audit.models import AuditLog
from audit.viewsets import AdminsViewOnly, audit_log_viewset

register_permission_policy(AuditLog, AdminsViewOnly(AuditLog))


@hooks.register("register_admin_viewset")
def register_audit_log() -> object:
    return audit_log_viewset
