# ADR-012: The Website CMS Moves to Django + Wagtail

**Status:** Accepted (2026-10-20, direction from Z-GATE leadership)
**Supersedes:** the choice of Payload CMS as the website backend in ADR-007 (its second amendment) and, for `backend/` only, ADR-003 (TypeScript; kept in the e-learning repository, see `README.md` here). The rest of ADR-007 stands: separate products, separate databases, integration through versioned contracts, the website as the gate to the e-learning platform.

## Context

The website's CMS (`backend/`) was Payload CMS 3, a TypeScript CMS running inside a Next.js app. Leadership asked for the backend to become a full Django project in Python. Three choices were settled with the product owner before work began:

1. **Django + Wagtail**, not plain Django admin. Wagtail is a CMS built on Django. Editors keep what they had: page building from blocks, a rich-text editor, drafts, revision history, publish permission, locking, site settings. Plain Django would have meant rebuilding drafts, revisions and approval by hand.
2. **The Next.js frontend stays.** The CMS remains headless: the redesigned public site keeps rendering pages, caching them and calling lead intake. Only its data source changes.
3. **Fresh content from the approved copy.** Nothing is in production yet, so the Django database is seeded from the same approved copy instead of migrating Payload's tables. The one local database that held them had them moved, untouched, into a `payload_archive` schema by a one-off script (in this ADR's git history); Django owns `public`.

## Decision

`backend/` is a Django 5.2 LTS + Wagtail 8.0 project (Python 3.14):

| Concern                      | Before (Payload)                                  | Now (Django + Wagtail)                                                                                                                      |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages                        | Collection with block layouts                     | `SitePage` (Wagtail page) with a StreamField of the same 13 block types (`content/blocks.py`)                                               |
| Divisions, courses, articles | Collections with drafts                           | Snippets with drafts, revisions, locking and a publish permission                                                                           |
| Site settings                | Global                                            | Wagtail site settings; enrollment mode and platform address visible to admins only                                                          |
| Staff roles                  | editor / publisher / admin                        | Editors and Publishers groups (`accounts/roles.py`); admins are superusers                                                                  |
| Leads                        | Collection, created by lead intake only           | `leads_lead` table, Wagtail admin view: no add, delete for admins only, consent and attribution immutable                                   |
| Audit log                    | Collection, append-only                           | `audit_logs` table, append-only; reads, changes (field names only), deletes, role grants, sign-ins, actor email kept after account deletion |
| Public API                   | Payload REST with query language                  | Small read-only JSON API (`content/views.py`) returning the same shapes the frontend already renders; published content only                |
| Rich text                    | Lexical JSON, rendered by a Payload React package | HTML, expanded and sanitized server-side with an allowlist (nh3)                                                                            |
| Login protection             | Payload lockout                                   | django-axes: 5 failures lock that account for 15 minutes                                                                                    |

Unchanged contracts: lead intake (`POST /api/lead-intake`, bearer token, same request and responses), the cache-clearing webhook (same HMAC signature format, checked by a test against the TypeScript signer), ports, hostnames and environment variable names (except `PAYLOAD_SECRET` → `DJANGO_SECRET_KEY`).

Dependencies follow the same supply-chain rule as the Node side: exact pins, a full lock (`backend/requirements/base.txt`) resolved with pip's `--uploaded-prior-to=P14D`, `pip-audit` in CI, and the image installs the lock with `--no-deps`.

**Project layout (amended 2026-10-20): standard Django.** The project package is `config/` with split settings (`config/settings/{base,development,test,production}.py`), chosen by `DJANGO_SETTINGS_MODULE` rather than a custom `DJANGO_ENV` switch; each app keeps its HTTP views in `views.py` + `urls.py`, input validation in `forms.py` (lead intake is a Django `Form`) and its tests in `tests/`; requirements live in `requirements/`. Tables use Django's default names (`<app>_<model>`) in `public`, with no custom schema.

## Consequences

- **Two languages in the repository.** The frontend and packages stay TypeScript; the CMS is Python with its own tooling (ruff, pytest). CI runs both.
- **The frontend no longer depends on Payload at all.** `@zgate/cms-contracts` holds hand-written content types (`content-types.ts`) instead of generated ones, so a field renamed in `content/serializers.py` must be renamed there too; the frontend typecheck then shows every use.
- **Rich text is HTML.** Safer to render than before only because it is sanitized in the CMS; never render CMS HTML that skipped `clean_html`.
- **Editors meet a different admin.** Wagtail's screens and words differ from Payload's ("Snippets", "Publish", "Submit for moderation"). The staff guide is `docs/CONTENT_GUIDE.md` §9.
- **No data migration exists.** If a Payload database with real content ever has to be carried over, that is new work, not a script that exists.
- The e-learning platform is unaffected: it never imported the website CMS.
