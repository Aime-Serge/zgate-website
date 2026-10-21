from django.apps import AppConfig


class AuditConfig(AppConfig):
    name = "audit"
    verbose_name = "Audit log"

    def ready(self) -> None:
        from audit import signals  # noqa: F401 - registers the receivers
