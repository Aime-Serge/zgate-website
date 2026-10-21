"""
Settings shared by every environment of the Z-GATE website CMS (Wagtail,
headless). Not used directly: DJANGO_SETTINGS_MODULE names one of
config.settings.development, .test or .production, which validates the
environment (config/env.py) and then imports this.

This app is the CMS only, on its own host (ADMIN_URL, e.g. cms.): the
Wagtail admin, the read-only JSON API the public site reads, and lead
intake. Public pages are the separate Next.js app (frontend/), so the
CMS login cookie never reaches the public origin (docs/SECURITY.md).

Everything that differs between deployments comes from config.env,
validated once at startup.
"""

from datetime import timedelta
from pathlib import Path

import dj_database_url

from config import env

BASE_DIR = env.BASE_DIR
CONFIG = env.current()

SECRET_KEY = CONFIG.secret_key
DEBUG = False
ALLOWED_HOSTS = list(CONFIG.allowed_hosts)
# Only the CMS's own origin may make cookie-authenticated (admin) requests.
CSRF_TRUSTED_ORIGINS = [CONFIG.admin_url]

INSTALLED_APPS = [
    # Z-GATE apps first, so their templates and signals take precedence.
    "accounts",
    "content",
    "leads",
    "audit",
    # Wagtail
    "wagtail.contrib.settings",
    "wagtail.sites",
    "wagtail.users",
    "wagtail.snippets",
    "wagtail.documents",
    "wagtail.images",
    "wagtail.search",
    "wagtail.admin",
    "wagtail",
    "modelcluster",
    "taggit",
    # Login lockout after repeated failures.
    "axes",
    # Django. No django.contrib.admin: Wagtail's is the only admin, so there
    # is one login surface to secure.
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    # First: refuse everything that isn't the CMS, add the security headers.
    "config.middleware.CmsOnlyMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Who is acting, for the audit log's signal handlers.
    "audit.middleware.CurrentUserMiddleware",
    # Last, as django-axes requires.
    "axes.middleware.AxesMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# The website's own database (ADR-007: separate from the e-learning
# platform's). The app connects as a least-privilege role; migrations run
# as the owner role (scripts/migrate.mjs, DATABASE_MIGRATION_URL).
DATABASES = {
    "default": {
        **dj_database_url.parse(CONFIG.database_url, conn_max_age=60, conn_health_checks=True),
        # One transaction per request: a change and its audit entry (written
        # by signal handlers, after the save) commit together or not at all,
        # and webhooks and emails queued with on_commit wait for the commit.
        # Health checks opt out (config/views.py).
        "ATOMIC_REQUESTS": True,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# 5 wrong passwords lock that account for 15 minutes (as before).
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_LOCKOUT_PARAMETERS = ["username"]
AXES_RESET_ON_SUCCESS = True
# Per account only, on purpose: behind the Caddy proxy every request has
# Caddy's address, so an IP lockout would lock out all staff at once.
SILENCED_SYSTEM_CHECKS = ["axes.W006"]

# Privileged sessions: a working day, not a week.
SESSION_COOKIE_AGE = 8 * 60 * 60
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = CONFIG.https
CSRF_COOKIE_SECURE = CONFIG.https
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
# Wagtail's admin previews in a same-origin frame; nothing else may frame it.
X_FRAME_OPTIONS = "SAMEORIGIN"

LANGUAGE_CODE = "en"
TIME_ZONE = "Africa/Kigali"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_ROOT = Path(CONFIG.media_dir).resolve()
MEDIA_URL = "/media/"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # production.py swaps in WhiteNoise's hashed, compressed files.
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# Staff notifications through any SMTP provider. Without SMTP_HOST, emails
# are written to the log instead of sent - the site still works.
DEFAULT_FROM_EMAIL = CONFIG.email_from
if CONFIG.smtp_host:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = CONFIG.smtp_host
    EMAIL_PORT = CONFIG.smtp_port
    EMAIL_HOST_USER = CONFIG.smtp_user or ""
    EMAIL_HOST_PASSWORD = CONFIG.smtp_pass or ""
    EMAIL_USE_SSL = CONFIG.smtp_port == 465
    EMAIL_USE_TLS = not EMAIL_USE_SSL
    EMAIL_TIMEOUT = 10
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Wagtail
WAGTAIL_SITE_NAME = "Z-GATE website"
WAGTAILADMIN_BASE_URL = CONFIG.admin_url
# No calls home and no third-party requests from the admin.
WAGTAIL_ENABLE_UPDATE_CHECK = False
WAGTAIL_GRAVATAR_PROVIDER_URL = None
WAGTAILADMIN_COMMENTS_ENABLED = True
WAGTAIL_PASSWORD_RESET_ENABLED = bool(CONFIG.smtp_host)
WAGTAILIMAGES_EXTENSIONS = ["png", "jpg", "jpeg", "webp"]
WAGTAILDOCS_EXTENSIONS = ["pdf"]
WAGTAILSEARCH_BACKENDS = {"default": {"BACKEND": "wagtail.search.backends.database"}}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"level": "WARNING"},
        # Routine background-task and edit messages; Wagtail keeps its own
        # history of every edit in the database.
        "django_tasks": {"level": "WARNING"},
        "wagtail": {"level": "WARNING"},
        "axes": {"level": "WARNING"},
    },
}
