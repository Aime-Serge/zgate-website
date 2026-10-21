"""
What tells the public site to refresh: publishing or unpublishing a page
or snippet, deleting one, and any change to site settings or redirects.
Draft saves don't change what visitors see, so they send nothing.
"""

from __future__ import annotations

from typing import Any

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from wagtail.signals import page_published, page_unpublished, published, unpublished

from content.models import Article, Course, Demo, Division, Redirect, SitePage, SiteSettings
from content.revalidate import revalidate_site

SNIPPETS = (Division, Course, Article, Demo)


@receiver(page_published)
@receiver(page_unpublished)
def _page_changed(sender: type, instance: Any, **_kwargs: Any) -> None:
    revalidate_site("pages")


@receiver(published)
@receiver(unpublished)
def _snippet_changed(sender: type, instance: Any, **_kwargs: Any) -> None:
    if isinstance(instance, SNIPPETS):
        revalidate_site(instance._meta.model_name)


@receiver(post_delete)
def _deleted(sender: type, instance: Any, **_kwargs: Any) -> None:
    if isinstance(instance, (SitePage, Redirect, *SNIPPETS)):
        revalidate_site(instance._meta.model_name)


@receiver(post_save, sender=SiteSettings)
@receiver(post_save, sender=Redirect)
def _saved(sender: type, instance: Any, **_kwargs: Any) -> None:
    revalidate_site(instance._meta.model_name)
