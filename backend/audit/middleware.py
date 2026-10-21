"""Makes the signed-in staff member available to the audit signal handlers."""

from __future__ import annotations

from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

from audit.record import reset_current_user, set_current_user


class CurrentUserMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        token = set_current_user(getattr(request, "user", None))
        try:
            return self.get_response(request)
        finally:
            reset_current_user(token)
