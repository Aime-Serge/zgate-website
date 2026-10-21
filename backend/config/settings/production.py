"""
Staging and production: the image's default (backend/Dockerfile). Refuses
to start without the shared secrets and an https ADMIN_URL (config/env.py).
"""

from config import env

env.configure("production")

from config.settings.base import *

# The collected, hashed files from `collectstatic` in the image, served by
# WhiteNoise right after SecurityMiddleware.
MIDDLEWARE.insert(
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
STORAGES["staticfiles"] = {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"}

# TLS ends at the CMS host's own proxy (backend/deploy/Caddyfile, or a
# platform's load balancer), which sets X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
# The proxy redirects to HTTPS. Redirecting here too would break the
# container's own plain-HTTP health check (backend/Dockerfile).
SECURE_SSL_REDIRECT = False
