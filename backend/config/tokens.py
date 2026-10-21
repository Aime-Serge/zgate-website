"""Server-to-server bearer tokens shared with the website frontend (config/env.py)."""

import hmac


def bearer_matches(header: str | None, token: str) -> bool:
    """Constant-time `Bearer <token>` check."""
    presented = header[7:] if header and header.startswith("Bearer ") else ""
    return hmac.compare_digest(presented.encode(), token.encode())
