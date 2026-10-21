"""
The Editors and Publishers groups and their permissions, kept in step
after every migration (idempotent). Admins are Django superusers.

Wagtail's own migrations create "Editors" and "Moderators" with page
permissions; "Moderators" is renamed to "Publishers" here, the name staff
know from the onboarding guide.
"""

from __future__ import annotations

from typing import Any

from django.apps import apps as global_apps
from django.contrib.auth.management import create_permissions
from django.contrib.auth.models import Group, Permission

EDITORS = "Editors"
PUBLISHERS = "Publishers"

# Codenames per role, beyond Wagtail's page permissions.
EDITOR_PERMISSIONS = [
    ("wagtailadmin", "access_admin"),
    ("content", "change_division"),
    ("content", "add_course"),
    ("content", "change_course"),
    ("content", "add_article"),
    ("content", "change_article"),
    ("wagtailimages", "add_image"),
    ("wagtailimages", "change_image"),
    ("wagtailimages", "choose_image"),
    ("wagtaildocs", "add_document"),
    ("wagtaildocs", "change_document"),
    ("wagtaildocs", "choose_document"),
]
PUBLISHER_PERMISSIONS = [
    *EDITOR_PERMISSIONS,
    ("content", "publish_division"),
    ("content", "publish_course"),
    ("content", "delete_course"),
    ("content", "publish_article"),
    ("content", "delete_article"),
    ("content", "add_redirect"),
    ("content", "change_redirect"),
    ("content", "delete_redirect"),
    ("content", "change_sitesettings"),
    ("leads", "view_lead"),
    ("leads", "change_lead"),
]
PAGE_PERMISSIONS = {
    EDITORS: ["add_page", "change_page"],
    PUBLISHERS: ["add_page", "change_page", "publish_page", "lock_page", "unlock_page"],
}


def _permissions(pairs: list[tuple[str, str]]) -> list[Permission]:
    found = []
    for app_label, codename in pairs:
        permission = Permission.objects.filter(
            content_type__app_label=app_label, codename=codename
        ).first()
        if permission is None:
            raise RuntimeError(f"Missing permission {app_label}.{codename}")
        found.append(permission)
    return found


def ensure_roles(**_kwargs: Any) -> None:
    # Permissions are normally created at the end of `migrate`; create them
    # now so they exist whichever app's signal runs first.
    for config in global_apps.get_app_configs():
        create_permissions(config, verbosity=0)
    # Snippet "publish"/"lock" permissions come from Wagtail's own handler.
    from wagtail.snippets.models import create_extra_permissions

    create_extra_permissions(global_apps.get_app_config("wagtailsnippets"))

    from wagtail.models import Collection, GroupCollectionPermission, GroupPagePermission, Page

    moderators = Group.objects.filter(name="Moderators").first()
    if moderators and not Group.objects.filter(name=PUBLISHERS).exists():
        moderators.name = PUBLISHERS
        moderators.save(update_fields=["name"])

    roots = Page.get_first_root_node()
    root_collection = Collection.get_first_root_node()
    for name, pairs in ((EDITORS, EDITOR_PERMISSIONS), (PUBLISHERS, PUBLISHER_PERMISSIONS)):
        group, _ = Group.objects.get_or_create(name=name)
        group.permissions.set(_permissions(pairs))
        if roots is not None:
            wanted = PAGE_PERMISSIONS[name]
            GroupPagePermission.objects.filter(group=group).exclude(
                permission__codename__in=wanted
            ).delete()
            for codename in wanted:
                GroupPagePermission.objects.get_or_create(
                    group=group,
                    page=roots,
                    permission=Permission.objects.get(
                        content_type__app_label="wagtailcore", codename=codename
                    ),
                )
        if root_collection is not None:
            for app_label, model in (("wagtailimages", "image"), ("wagtaildocs", "document")):
                for action in ("add", "change", "choose"):
                    GroupCollectionPermission.objects.get_or_create(
                        group=group,
                        collection=root_collection,
                        permission=Permission.objects.get(
                            content_type__app_label=app_label, codename=f"{action}_{model}"
                        ),
                    )
