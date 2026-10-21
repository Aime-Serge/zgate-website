"""Liveness, readiness and robots.txt for the CMS host."""

from django.db import connection, transaction
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.http import require_GET


# Outside the per-request transaction (ATOMIC_REQUESTS): opening it needs
# the database, and these must answer - 200 or 503 - when it is down.
@transaction.non_atomic_requests
@require_GET
def health(_request: HttpRequest) -> JsonResponse:
    """Liveness: the process answers. No dependencies checked."""
    return JsonResponse({"status": "ok"})


@transaction.non_atomic_requests
@require_GET
def ready(_request: HttpRequest) -> JsonResponse:
    """Readiness: the database answers too."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


@require_GET
def robots(_request: HttpRequest) -> HttpResponse:
    """Crawlers stay out of the CMS host entirely."""
    return HttpResponse("User-agent: *\nDisallow: /\n", content_type="text/plain")
