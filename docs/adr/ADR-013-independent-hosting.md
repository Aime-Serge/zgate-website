# ADR-013: The Public Site and the CMS Are Hosted and Released Independently

**Status:** Accepted (2026-10-21)
**Builds on:** ADR-007 (the website has its own backend and database), ADR-010 (one repository per product), ADR-012 (the CMS is Django + Wagtail). It replaces the single-VM production stack (`deploy/compose.prod.yml`) and amends ADR-011's release gate as described in decision 5.

## Context

Until now both apps ran on one VM behind one Caddy, released together at the same commit: three images (frontend, backend, migrate) built only when both apps passed, the frontend reaching the CMS on the Docker network (`http://website-backend:3004`), and the CMS's webhook reaching the frontend the same way. The CMS host (`cms.`) was entirely IP-allowlisted, which only worked because the frontend never came through it.

That ties the two together in ways the code doesn't need. The frontend was already reading the CMS only through `CMS_URL` and a small JSON contract, but it couldn't move to another host or provider: the CMS's API was unreachable from outside the office allowlist, the webhook route was blocked at the public edge, and the CMS image needed the whole repository as its build context. A change to either app also rebuilt and redeployed both.

## Decision

1. **Each app has a host of its own** with its own edge, compose stack and env templates: `frontend/deploy/` and `backend/deploy/`. Copying that one folder onto a host is enough to run it. The repository root keeps only the local development `compose.yml`. The database files move to `backend/database/`: only the CMS uses the database.
2. **The two hosts talk over HTTPS only:** the frontend reads `https://cms.<domain>/api/...` and posts lead intake there; the CMS posts its signed webhook to `https://www.<domain>/api/revalidate`. On the CMS host, `/api/*` is reachable from the internet; everything else (admin, static files, media, documents) stays behind `ADMIN_ALLOWED_IPS`.
3. **The content API requires a token in production** (`CMS_API_TOKEN`, a third shared secret beside `LEAD_INTAKE_TOKEN` and `REVALIDATE_SECRET`), now that it is on the internet. Both apps refuse to start in production without it. Optional IP allowlists (`API_ALLOWED_IPS`, `REVALIDATE_ALLOWED_IPS`) narrow each direction further when the other host has a fixed address.
4. **Each app builds, is tested and is published on its own:** `frontend.yml` and `backend.yml`, path-filtered, each pushing one image tagged with the commit SHA. Both call the same browser checks (`e2e.yml`), which run the two apps side by side. The CMS image builds from `backend/` alone; the separate `migrate` image is gone, the CMS image runs `manage.py migrate` as a one-off with the owner role (`website-migrate.env`).
5. **Release gate (amends ADR-011):** an app's release needs its own workflow run green (including the browser checks) and the staging smoke check passed with that SHA and the other app at its production version. Changes that span both apps follow the compatibility order in `docs/DEPLOYMENT.md` §4.

## Consequences

- Either app can move to another provider, size or platform without touching the other. `docs/DEPLOYMENT.md` §7 lists what a platform must provide (one frontend instance, a persistent media volume, an admin IP allowlist).
- Production can run a frontend and a CMS from different commits. CI tests only same-commit pairs, so compatibility is a release rule (expand then contract, additive API changes first). The frontend skips block types it doesn't know instead of failing the page, which makes a CMS-first release of a new block safe.
- The content API is now internet-facing. Its exposure is limited to published content behind a token; a stolen token reads what the public site already shows.
- Two edges, two certificates, two sets of server hardening to keep up. The staging environment needs two hosts too, so it proves the cross-host setup.
- Rotating `CMS_API_TOKEN` briefly stops uncached pages from rendering (one value per secret on each side); see `docs/DEPLOYMENT.md` §10.
