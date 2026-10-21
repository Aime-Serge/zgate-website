from django.apps import AppConfig


class ContentConfig(AppConfig):
    name = "content"
    verbose_name = "Website content"

    def ready(self) -> None:
        from content import signals  # noqa: F401 - registers the receivers
