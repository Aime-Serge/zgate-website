"""WSGI entry point: `gunicorn config.wsgi` in the image."""

import os

from django.core.wsgi import get_wsgi_application

# A server started without DJANGO_SETTINGS_MODULE gets the strict settings.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
application = get_wsgi_application()
