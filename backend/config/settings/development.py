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

# Local SQLite (DATABASE_URL=sqlite:///db.sqlite3): runserver's threads, the
# site's page builds and the seed command write at the same time. WAL lets
# reads run beside a write, IMMEDIATE takes the write lock up front instead
# of failing a transaction halfway with "database is locked", and the
# timeout waits for it.
if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    DATABASES["default"]["OPTIONS"] = {
        "transaction_mode": "IMMEDIATE",
        "timeout": 20,
        "init_command": "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;",
    }
