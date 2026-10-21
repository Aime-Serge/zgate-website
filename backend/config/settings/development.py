"""
Local development: `python manage.py runserver` (the default in manage.py).
Reads backend/.env; `runserver` serves the admin's static files itself.
"""

from config import env

env.configure("development")

from config.settings.base import *

DEBUG = True

# runserver starts a thread per request, so persistent connections would
# pile up one per thread (Django's docs say not to enable them here) and
# exhaust the small local Postgres (database/postgresql.dev.conf). The
# image's gunicorn workers keep base.py's 60 seconds.
DATABASES["default"]["CONN_MAX_AGE"] = 0
