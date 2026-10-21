"""
pytest (pyproject.toml) and the e2e run in CI. Never reads backend/.env:
the database is in-memory SQLite unless DATABASE_URL is set (CI's
Postgres), so a test run can't touch a developer's data.
"""

from config import env

env.configure("test")

from config.settings.base import *

# Django's test client.
ALLOWED_HOSTS = [*ALLOWED_HOSTS, "testserver"]
