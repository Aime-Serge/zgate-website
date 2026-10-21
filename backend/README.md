# Website CMS (`backend/`)

Django 5.2 LTS + Wagtail 8.0, headless (ADR-012). The CMS host (`cms.`, port 3004) serves only:

- `/admin/`: the Wagtail admin for staff (pages, divisions, courses, insights, redirects, site settings, leads, audit log)
- `/api/...`: the read-only JSON API the public site reads, published content only, with `CMS_API_TOKEN` in production (`content/views.py`)
- `/api/lead-intake`: the only write the public site makes, server to server with a bearer token (`leads/views.py`)
- `/api/health`, `/api/ready`, `/robots.txt`

Everything else answers 404. Public pages are the Next.js app in `../frontend`.

## Layout

A standard Django project: the project package `config/` next to `manage.py`, one folder per app.

```
backend/
├── manage.py                 # defaults to config.settings.development
├── config/                   # the project package
│   ├── settings/
│   │   ├── base.py           # shared by every environment
│   │   ├── development.py    # runserver; reads backend/.env
│   │   ├── test.py           # pytest and CI's e2e run; never reads .env
│   │   └── production.py     # the image's default: WhiteNoise, HSTS, required secrets
│   ├── env.py                # reads and validates the environment (by name, never by value)
│   ├── middleware.py         # CMS-only paths and security headers
│   ├── urls.py               # includes each app's urls.py
│   ├── views.py              # health, readiness, robots.txt
│   ├── wsgi.py / asgi.py
│   └── tests/
├── accounts/                 # staff accounts (email login); Editors / Publishers roles (roles.py)
├── content/                  # pages + blocks, divisions, courses, articles, redirects, site settings;
│                             #   JSON API (views.py, urls.py, serializers.py), webhook (revalidate.py),
│                             #   `seed_content` (management/commands/)
├── leads/                    # lead intake (views.py, urls.py, forms.py) and the admin inbox (viewsets.py)
├── audit/                    # append-only audit log and what writes to it
├── conftest.py               # fixtures shared by every app's tests
├── requirements/
│   ├── base.in               # direct runtime pins
│   ├── base.txt              # the full lock (scripts/lock.sh); the image installs only this
│   └── development.txt       # base.txt + test and lint tools
└── pyproject.toml            # pytest and ruff settings
```

Each app follows Django's conventions: `models.py`, `views.py` + `urls.py` for HTTP, `forms.py` for input, `migrations/`, `tests/`, `signals.py` connected in `apps.py`. Wagtail admin screens are in `viewsets.py` (or `wagtail_hooks.py` for snippets), registered from `wagtail_hooks.py`; there is no `django.contrib.admin`.

The settings module is chosen the standard way, with `DJANGO_SETTINGS_MODULE`: `manage.py` defaults to development, `pytest` to test (`pyproject.toml`), and the image and `wsgi.py` to production.

## Database

Postgres, schema `public`, Django's default table names (`leads_lead`, `accounts_user`, `wagtailcore_page`, ...). Every schema change is a migration in its app's `migrations/` folder. Roles, server settings and backups are in `database/`.

## Run it

From `backend/`, with Python 3.14:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements/development.txt   # Windows; .venv/bin/python elsewhere
cp .env.example .env                                                  # then fill in DJANGO_SECRET_KEY
python manage.py migrate        # or `pnpm db:migrate` from website/ (runs as the owner role)
python manage.py seed_content   # approved copy; never overwrites CMS edits
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:3004   # or `pnpm dev` from website/, with the public site
```

## Host it

This folder is self-contained: the image builds from it alone (`docker build --target prod .` here; `.dockerignore` keeps `.env`, `.venv`, `deploy/` and `database/` out of it), and `deploy/` holds everything the CMS host needs (Caddy, compose, env templates). The public site runs on another host and reaches this one over HTTPS. Step by step: [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md), part B.

## Check it

```bash
pytest                      # in-memory SQLite locally; CI sets DATABASE_URL to its Postgres
ruff check . && ruff format --check .
python manage.py makemigrations --check --dry-run
pip-audit -r requirements/base.txt
```

## Rules

- **No invented proof.** There are no testimonial, rating or logo blocks; a market figure can't be saved without its source; commitments always say they are not past results (`content/blocks.py`).
- **Published only.** The API reads `live` rows; drafts live in revisions and never leave the CMS.
- **Rich text is sanitized** with an allowlist before it leaves (`content/serializers.py`).
- **Dependencies:** edit `requirements/base.in`, then regenerate the lock with `sh scripts/lock.sh` (nothing published in the last 14 days is ever resolved).
- **Schema changes** go through migration files (`makemigrations`), reviewed like code.
- **Integrity rules live in the database too:** CHECK and UNIQUE constraints in `Meta.constraints`, and triggers that keep lead submissions and the audit log unchangeable (`database/README.md`). Each request is one transaction (`ATOMIC_REQUESTS`).
