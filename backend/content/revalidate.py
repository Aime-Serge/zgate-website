"""
The "content changed" webhook to the website frontend, which marks every
cached public page stale (frontend/src/app/api/revalidate/route.ts). The
site is small, so any published change clears everything rather than
tracking which pages show which object.

Signature: HMAC-SHA256 over "<unix seconds>.<body>", sent as
`x-zgate-signature: t=<seconds>,v1=<hex>` - the format the frontend
verifies (packages/cms-contracts/src/webhook.ts). The timestamp bounds
replay to five minutes there.

Sent after the transaction commits, from a background thread: an
unreachable frontend must never block or fail an editor's save. The
frontend's hourly revalidation is the safety net if a webhook is lost.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import threading
import time
import urllib.request
from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar

from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)

SIGNATURE_HEADER = "x-zgate-signature"
_suspended: ContextVar[bool] = ContextVar("revalidation_suspended", default=False)


def sign(body: str, secret: str, now: float | None = None) -> str:
    timestamp = int(time.time() if now is None else now)
    digest = hmac.new(secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={digest}"


@contextmanager
def suspended() -> Iterator[None]:
    """For scripts (seed, migrations) that change content in bulk."""
    token = _suspended.set(True)
    try:
        yield
    finally:
        _suspended.reset(token)


def _send(url: str, body: str, signature: str) -> None:
    request = urllib.request.Request(  # noqa: S310 - URL comes from validated config
        url,
        data=body.encode(),
        method="POST",
        headers={"Content-Type": "application/json", SIGNATURE_HEADER: signature},
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:  # noqa: S310
            if response.status >= 300:
                logger.warning("Site revalidation failed: HTTP %s", response.status)
    except Exception as error:
        logger.warning("Site revalidation failed: %s", error)


def revalidate_site(source: str) -> None:
    """Tell the frontend that published content changed (`source` is only logged)."""
    if _suspended.get():
        return
    config = settings.CONFIG
    if not config.revalidate_url or not config.revalidate_secret:
        logger.warning("Site revalidation skipped: REVALIDATE_URL is not set")
        return
    body = json.dumps({"event": "content-changed", "source": source}, separators=(",", ":"))
    signature = sign(body, config.revalidate_secret)
    url = config.revalidate_url

    def start() -> None:
        threading.Thread(target=_send, args=(url, body, signature), daemon=True).start()

    transaction.on_commit(start)
