"""
URL map of the CMS host. Wagtail serves no public pages here (the Next.js
frontend renders them), so there is no wagtail_urls catch-all.
"""

from django.conf import settings
from django.urls import include, path, re_path
from django.views.static import serve
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

from config import views

urlpatterns = [
    path("api/health", views.health),
    path("api/ready", views.ready),
    # Server to server: the only write the public site makes.
    path("api/", include("leads.urls")),
    # The public site's read-only content API.
    path("api/", include("content.urls")),
    path("robots.txt", views.robots),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # Uploaded images for the admin, on the CMS host only (staff behind the
    # allowlist). Local disk until object storage is wired in.
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
