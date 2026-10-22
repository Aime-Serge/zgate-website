"""
Runtime configuration for the website CMS, read from the environment and
validated once per process.

Each settings module (config/settings/development.py, test.py,
production.py) calls `configure()` with its own name before importing
base.py; base.py reads the result with `current()`. Which one runs is
chosen the standard Django way, by DJANGO_SETTINGS_MODULE.

The same image runs in every environment, so nothing here is baked in at
build time. Building the image (collectstatic) imports the settings
without a database or secrets: DJANGO_BUILD=1 substitutes inert
placeholders for that step only.

Problems are reported by variable name, never by value - secrets must not
reach logs.
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

ENVIRONMENTS = ("development", "test", "production")

# Shared with the website frontend; the same length floor everywhere.
SECRET_MIN_LENGTH = 32

BUILD_PLACEHOLDERS = {
    "DJANGO_SECRET_KEY": "build-phase-placeholder-never-used-at-runtime-0123456789",
    "DATABASE_URL": "postgres://build:build@127.0.0.1:1/build",
}

# Tests never read backend/.env, so they can't touch a developer's database.
# CI sets DATABASE_URL to its own Postgres; locally they use in-memory SQLite.
TEST_DEFAULTS = {
    "DJANGO_SECRET_KEY": "local-test-secret-key-not-a-real-secret-0123",
    "DATABASE_URL": "sqlite://:memory:",
}


class ConfigError(ImproperlyConfigured):
    """The environment is missing or has invalid settings."""


@dataclass(frozen=True)
class Config:
    environment: str
    secret_key: str
    database_url: str
    # This CMS's own origin, e.g. https://cms.example.rw. Never the public
    # site's host: the CMS login cookie stays off the public origin.
    admin_url: str
    allowed_hosts: tuple[str, ...]
    media_dir: str
    # Presented by the frontend on every content API read. Unset (local
    # development, tests): the API is open, as on a private network.
    cms_api_token: str | None
    lead_intake_token: str | None
    revalidate_url: str | None
    revalidate_secret: str | None
    smtp_host: str | None
    smtp_port: int
    smtp_user: str | None
    smtp_pass: str | None
    email_from: str

    @property
    def https(self) -> bool:
        return self.admin_url.startswith("https://")

    @property
    def admin_host(self) -> str:
        return urlparse(self.admin_url).hostname or ""


def _value(source: Mapping[str, str], name: str) -> str | None:
    # `SMTP_HOST=` in an env file means "not set", not "an empty host".
    value = source.get(name, "").strip()
    return value or None


def load(source: Mapping[str, str], *, environment: str) -> Config:
    """Validates `source`; raises ConfigError listing every problem."""
    if environment not in ENVIRONMENTS:
        raise ConfigError(f"Unknown environment {environment!r}")
    env = dict(source)
    building = env.get("DJANGO_BUILD") == "1"
    if building:
        env = {**BUILD_PLACEHOLDERS, **{k: v for k, v in env.items() if v}}
    problems: list[str] = []

    secret_key = _value(env, "DJANGO_SECRET_KEY") or ""
    if len(secret_key) < SECRET_MIN_LENGTH:
        problems.append(f"DJANGO_SECRET_KEY: must be at least {SECRET_MIN_LENGTH} characters")

    database_url = _value(env, "DATABASE_URL") or ""
    if not database_url.startswith(("postgres://", "postgresql://", "sqlite://")):
        problems.append("DATABASE_URL: must be a postgres:// or sqlite:// URL")

    admin_url = (_value(env, "ADMIN_URL") or "http://localhost:3004").rstrip("/")
    admin = urlparse(admin_url)
    if admin.scheme not in ("http", "https") or not admin.hostname:
        problems.append("ADMIN_URL: must be an absolute http(s) URL")

    # The CMS's own host (which is also how a separately hosted frontend
    # reaches it, CMS_URL=https://cms.<domain>), plus the Compose service
    # name for local containers, and the platform address Render sets
    # (RENDER_EXTERNAL_HOSTNAME, <service>.onrender.com): its health checks
    # use it until a custom domain is verified. Any other name:
    # DJANGO_ALLOWED_HOSTS.
    extra_hosts = [
        *(h.strip() for h in (_value(env, "DJANGO_ALLOWED_HOSTS") or "").split(",")),
        _value(env, "RENDER_EXTERNAL_HOSTNAME") or "",
    ]
    allowed_hosts = tuple(
        dict.fromkeys(
            h
            for h in [
                admin.hostname or "",
                "localhost",
                "127.0.0.1",
                "website-backend",
                *extra_hosts,
            ]
            if h
        )
    )

    def shared_secret(name: str) -> str | None:
        value = _value(env, name)
        if value is not None and len(value) < SECRET_MIN_LENGTH:
            problems.append(f"{name}: must be at least {SECRET_MIN_LENGTH} characters")
        return value

    cms_api_token = shared_secret("CMS_API_TOKEN")
    lead_intake_token = shared_secret("LEAD_INTAKE_TOKEN")
    revalidate_secret = shared_secret("REVALIDATE_SECRET")
    revalidate_url = _value(env, "REVALIDATE_URL")
    if revalidate_url and not urlparse(revalidate_url).scheme.startswith("http"):
        problems.append("REVALIDATE_URL: must be an absolute URL")
    if revalidate_url and not revalidate_secret:
        problems.append("REVALIDATE_SECRET: required when REVALIDATE_URL is set")
    # Not while building the image: collectstatic runs with the production
    # settings, but long before any secret exists.
    if environment == "production" and not building:
        for name, value in (
            # The content API is on the internet once the two apps are
            # hosted apart (docs/DEPLOYMENT.md).
            ("CMS_API_TOKEN", cms_api_token),
            ("LEAD_INTAKE_TOKEN", lead_intake_token),
            ("REVALIDATE_URL", revalidate_url),
            ("REVALIDATE_SECRET", revalidate_secret),
        ):
            if not value:
                problems.append(f"{name}: required in production")
        if not admin_url.startswith("https://"):
            problems.append("ADMIN_URL: must be https:// in production")
        # SQLite is for local development only: no roles, no audit triggers
        # owned by another role, and one file inside the container.
        if not database_url.startswith(("postgres://", "postgresql://")):
            problems.append("DATABASE_URL: must be a postgres:// URL in production")

    smtp_port_raw = _value(env, "SMTP_PORT") or "587"
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 0
    if not 0 < smtp_port < 65536:
        problems.append("SMTP_PORT: must be a port number")

    if problems:
        raise ConfigError("Invalid website CMS configuration:\n  " + "\n  ".join(problems))

    return Config(
        environment=environment,
        secret_key=secret_key,
        database_url=database_url,
        admin_url=admin_url,
        allowed_hosts=allowed_hosts,
        media_dir=_value(env, "MEDIA_DIR") or "./media",
        cms_api_token=cms_api_token,
        lead_intake_token=lead_intake_token,
        revalidate_url=revalidate_url,
        revalidate_secret=revalidate_secret,
        smtp_host=_value(env, "SMTP_HOST"),
        smtp_port=smtp_port,
        smtp_user=_value(env, "SMTP_USER"),
        smtp_pass=_value(env, "SMTP_PASS"),
        email_from=_value(env, "EMAIL_FROM") or "no-reply@example.com",
    )


def read_dotenv(path: Path) -> dict[str, str]:
    """
    backend/.env, read by the development settings only (standard library,
    no extra dependency). Variables already set in the environment win.
    """
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().removeprefix("export ").strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


_current: Config | None = None


def configure(environment: str) -> Config:
    """Reads and validates the environment for the settings module named `environment`."""
    global _current  # set once per process, by the settings module
    if environment == "development":
        source = {**read_dotenv(BASE_DIR / ".env"), **os.environ}
    elif environment == "test":
        source = {**TEST_DEFAULTS, **{k: v for k, v in os.environ.items() if v}}
    else:
        # Containers get their variables from the deployment (env_file),
        # never from a file inside the image.
        source = dict(os.environ)
    _current = load(source, environment=environment)
    return _current


def current() -> Config:
    if _current is None:
        raise ImproperlyConfigured(
            "Set DJANGO_SETTINGS_MODULE to config.settings.development, .test or .production"
        )
    return _current
