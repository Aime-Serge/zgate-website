"""
What the CMS serves, and its security headers.

This app is the CMS only, on its own host: the Wagtail admin, the JSON API
the website frontend reads, lead intake, and the admin's static files and
uploads. Anything else - including old public URLs - is a plain 404; staff
only use /admin here.
"""

from __future__ import annotations

from collections.abc import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse, HttpResponseNotFound

CMS_PREFIXES = ("/admin/", "/api/", "/static/", "/media/", "/documents/")
CMS_EXACT = ("/admin", "/robots.txt")


def is_cms_path(path: str) -> bool:
    return path in CMS_EXACT or path.startswith(CMS_PREFIXES)


def content_security_policy(*, https: bool) -> str:
    """
    For the Wagtail admin. 'unsafe-inline' is needed by the admin;
    everything else is locked to this origin: no third-party scripts,
    frames, plugins or form targets.
    """
    policy = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-src": ["'self'"],
        "worker-src": ["'self'", "blob:"],
        "frame-ancestors": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "object-src": ["'none'"],
    }
    if https:
        policy["upgrade-insecure-requests"] = []
    return "; ".join(
        f"{name} {' '.join(values)}" if values else name for name, values in policy.items()
    )


class CmsOnlyMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response
        self.csp = content_security_policy(https=settings.CONFIG.https)

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if is_cms_path(request.path):
            response = self.get_response(request)
        else:
            response = HttpResponseNotFound("Not found", content_type="text/plain; charset=utf-8")
        response.setdefault("Content-Security-Policy", self.csp)
        # The CMS is never something search engines should index.
        response["X-Robots-Tag"] = "noindex, nofollow"
        return response
