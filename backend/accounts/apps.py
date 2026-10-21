from django.apps import AppConfig
from django.db.models.signals import post_migrate


class AccountsConfig(AppConfig):
    name = "accounts"
    verbose_name = "Staff accounts"

    def ready(self) -> None:
        from accounts.roles import ensure_roles

        post_migrate.connect(ensure_roles, sender=self)
