"""
The read-only JSON API the public site reads (frontend/src/lib/cms.ts).

Every endpoint is GET-only and returns published content only (`live`
rows, which hold the published version; drafts live in revisions), so a
draft can't leak through a missed filter.

With CMS_API_TOKEN set (required in production), every read must present
it as `Authorization: Bearer <token>`. The frontend and the CMS can then
be hosted apart, the API reachable over the internet, without anyone else
reading it directly - bypassing the public site's page cache to load the
CMS, or scraping it.
"""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import Any

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET

from config.tokens import bearer_matches
from content import serializers
from content.models import Article, Course, Demo, Division, Redirect, SitePage, SiteSettings
from content.validators import DIVISION_SLUGS

View = Callable[..., JsonResponse]


def _json(data: Any, status: int = 200) -> JsonResponse:
    response = JsonResponse(data, status=status, safe=False)
    # Fresh on every request: the frontend caches pages itself and is told
    # when content changes (content/revalidate.py).
    response["Cache-Control"] = "no-store"
    return response


def api(view: View) -> View:
    """A content API endpoint: GET only, and the API token when one is configured."""

    @wraps(view)
    def guarded(request: HttpRequest, *args: Any, **kwargs: Any) -> JsonResponse:
        token = settings.CONFIG.cms_api_token
        if token and not bearer_matches(request.headers.get("Authorization"), token):
            return _json({"error": "unauthorized"}, status=401)
        return view(request, *args, **kwargs)

    return require_GET(guarded)


def _not_found() -> JsonResponse:
    return _json({"error": "not found"}, status=404)


def _limit(request: HttpRequest, default: int, maximum: int) -> int:
    try:
        return max(1, min(int(request.GET.get("limit", default)), maximum))
    except ValueError:
        return default


def _live_pages():
    return SitePage.objects.live().specific()


@api
def site_settings(_request: HttpRequest) -> JsonResponse:
    return _json(serializers.serialize_settings(SiteSettings.load()))


@api
def pages(_request: HttpRequest) -> JsonResponse:
    docs = [serializers.serialize_page(p, with_layout=False) for p in _live_pages()]
    return _json({"docs": docs})


@api
def page(_request: HttpRequest, slug: str) -> JsonResponse:
    found = _live_pages().filter(slug=slug).first()
    return _json(serializers.serialize_page(found)) if found else _not_found()


def _divisions():
    return Division.objects.filter(live=True).prefetch_related(
        "included_items", "commitment_items", "faq_items"
    )


@api
def divisions(_request: HttpRequest) -> JsonResponse:
    return _json({"docs": [serializers.serialize_division(d) for d in _divisions()]})


@api
def division(_request: HttpRequest, slug: str) -> JsonResponse:
    if slug not in DIVISION_SLUGS:
        return _not_found()
    found = _divisions().filter(slug=slug).first()
    return _json(serializers.serialize_division(found)) if found else _not_found()


def _courses():
    return Course.objects.filter(live=True).prefetch_related(
        "outcome_items", "module_items", "intake_items"
    )


@api
def courses(request: HttpRequest) -> JsonResponse:
    docs = [serializers.serialize_course(c) for c in _courses()[: _limit(request, 50, 200)]]
    return _json({"docs": docs})


@api
def course(_request: HttpRequest, slug: str) -> JsonResponse:
    found = _courses().filter(slug=slug).first()
    return _json(serializers.serialize_course(found)) if found else _not_found()


@api
def articles(request: HttpRequest) -> JsonResponse:
    found = Article.objects.filter(live=True)[: _limit(request, 50, 200)]
    return _json({"docs": [serializers.serialize_article(a) for a in found]})


@api
def article(_request: HttpRequest, slug: str) -> JsonResponse:
    found = Article.objects.filter(live=True, slug=slug).first()
    return _json(serializers.serialize_article(found)) if found else _not_found()


@api
def demos(request: HttpRequest) -> JsonResponse:
    live = Demo.objects.filter(live=True).prefetch_related("audiences")
    found = live[: _limit(request, 100, 200)]
    return _json({"docs": [serializers.serialize_demo(d) for d in found]})


@api
def redirect(request: HttpRequest) -> JsonResponse:
    path = request.GET.get("from", "")
    found = Redirect.objects.filter(from_path=path).first() if path else None
    return _json(serializers.serialize_redirect(found)) if found else _not_found()
