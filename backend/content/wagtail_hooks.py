"""The content snippets in the Wagtail admin menu."""

from typing import Any

from django.contrib import messages
from django.db import models
from django.db.models import ProtectedError
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from wagtail.admin.admin_url_finder import AdminURLFinder
from wagtail.permission_policies.base import ModelPermissionPolicy
from wagtail.permissions import register_permission_policy
from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import (
    DeleteView,
    EditView,
    SnippetViewSet,
    SnippetViewSetGroup,
)

from content.models import Article, Course, Demo, Division, Redirect


def is_protected(instance: models.Model) -> bool:
    """
    Whether other records still hold on to `instance` through an
    on_delete=PROTECT link - a course people are on the waitlist for
    (leads.Lead.course) - so deleting it would fail.
    """
    # include_hidden: Lead.course has no reverse accessor (related_name="+"),
    # and Django's own delete collector counts such links too.
    return any(
        relation.related_model._base_manager.filter(**{relation.field.name: instance}).exists()
        for relation in instance._meta.get_fields(include_hidden=True)
        if relation.auto_created
        and not relation.concrete
        and getattr(relation, "on_delete", None) is models.PROTECT
    )


class ProtectedDeletePolicy(ModelPermissionPolicy):
    """
    No "delete" for an object other records protect: bulk delete skips it.
    The edit page's button (CourseEditView) and the delete URL
    (CourseDeleteView) check the same rule.
    """

    # The per-instance check every other one goes through (the "any" variant
    # calls it once per action).
    def user_has_permission_for_instance(
        self, user: Any, action: str, instance: models.Model
    ) -> bool:
        if action == "delete" and is_protected(instance):
            return False
        return super().user_has_permission_for_instance(user, action, instance)


# Before anything asks for these models' policy (wagtail.permissions).
register_permission_policy(Course, ProtectedDeletePolicy(Course))


class CourseDeleteView(DeleteView):
    protected_message = (
        "People are on this course's waitlist, so it can't be deleted: their sign-ups "
        "keep the course they asked for. Unpublish it to take it off the website."
    )

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if is_protected(self.object):
            return self._refuse(request)
        try:
            return super().dispatch(request, *args, **kwargs)
        except ProtectedError:  # a sign-up arrived after the check above
            return self._refuse(request)

    def _refuse(self, request: HttpRequest) -> HttpResponse:
        messages.error(request, self.protected_message)
        edit_url = AdminURLFinder(request.user).get_edit_url(self.object)
        return redirect(edit_url or reverse(self.index_url_name))


class CourseEditView(EditView):
    def get_delete_url(self) -> str | None:
        # Wagtail decides on the header's Delete button per model, not per course.
        return None if is_protected(self.object) else super().get_delete_url()


class DivisionViewSet(SnippetViewSet):
    model = Division
    icon = "folder-open-inverse"
    list_display = ["name", "slug", "live"]
    menu_order = 100


class CourseViewSet(SnippetViewSet):
    model = Course
    icon = "doc-full"
    list_display = ["title", "slug", "live"]
    search_fields = ["title"]
    edit_view_class = CourseEditView
    delete_view_class = CourseDeleteView


class ArticleViewSet(SnippetViewSet):
    model = Article
    icon = "doc-full-inverse"
    menu_label = "Insights"
    list_display = ["title", "published_on", "live"]
    search_fields = ["title"]


class DemoViewSet(SnippetViewSet):
    model = Demo
    icon = "media"
    menu_label = "Demos"
    list_display = ["title", "division", "format", "live"]
    search_fields = ["title"]


class RedirectViewSet(SnippetViewSet):
    model = Redirect
    icon = "redirect"
    list_display = ["from_path", "to", "permanent"]


class WebsiteContentGroup(SnippetViewSetGroup):
    menu_label = "Website"
    menu_icon = "site"
    menu_order = 150
    items = (DivisionViewSet, CourseViewSet, ArticleViewSet, DemoViewSet, RedirectViewSet)


register_snippet(WebsiteContentGroup)
