"""/api/... - the public site's read API (content/views.py)."""

from django.urls import path

from content import views

app_name = "content_api"

urlpatterns = [
    path("site-settings", views.site_settings, name="site-settings"),
    path("pages", views.pages, name="pages"),
    path("pages/<slug:slug>", views.page, name="page"),
    path("divisions", views.divisions, name="divisions"),
    path("divisions/<slug:slug>", views.division, name="division"),
    path("courses", views.courses, name="courses"),
    path("courses/<slug:slug>", views.course, name="course"),
    path("articles", views.articles, name="articles"),
    path("articles/<slug:slug>", views.article, name="article"),
    path("demos", views.demos, name="demos"),
    path("redirects", views.redirect, name="redirect"),
]
