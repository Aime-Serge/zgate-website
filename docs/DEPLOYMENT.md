# Deploying and Operating the Website

**Applies to:** `frontend` (public site, Next.js) and `backend` (CMS, Django + Wagtail, [ADR-012](adr/ADR-012-django-wagtail-cms.md)), each on **its own host** ([ADR-013](adr/ADR-013-independent-hosting.md)).
**Files:** `frontend/deploy/` (the public site's host), `backend/deploy/` (the CMS host), `backend/database/` (the data host).
**Audience:** whoever deploys or operates the website. Read it once end to end before the first deployment, and follow the parts in order.

**Contents:** [1 Architecture](#1-what-runs-where) · [2 Decisions first](#2-decide-before-you-start) · [A Shared preparation](#part-a--shared-preparation-once) · [B CMS host](#part-b--the-cms-host) · [C Frontend host](#part-c--the-frontend-host) · [D End-to-end check](#part-d--end-to-end-check) · [3 Going public](#3-before-going-public-content-and-legal-gates) · [4 Releases](#4-routine-releases) · [5 Rollback](#5-rollback) · [6 Backups](#6-backups-required-before-real-leads-are-collected) · [7 Platforms](#7-hosting-on-a-platform-instead-of-a-vm) · [8 Monitoring](#8-monitoring) · [9 Operating notes](#9-operating-notes) · [10 Secrets](#10-rotating-the-shared-secrets) · [11 Known limits](#11-known-limits-tracked) · [12 Checklist](#12-production-readiness-checklist)

## 1. What runs where

```text
                 visitors (browsers)                      staff (office / VPN IPs only)
                         │ HTTPS                                    │ HTTPS
                         ▼                                          ▼
┌─ Frontend host ───────────────────────┐        ┌─ CMS host ─────────────────────────────┐
│ Caddy :443   www.<domain>, <domain>   │        │ Caddy :443   cms.<domain>              │
│   └─ website-frontend :3002 (Next.js) │──API──▶│   ├─ /api/*  → website-backend :3004   │
│      no database, no CMS login        │◀─hook──│   └─ /admin… → (ADMIN_ALLOWED_IPS)     │
└───────────────────────────────────────┘        │ website_media volume (uploads)         │
                                                  └───────────────┬────────────────────────┘
                                                                  │ TLS, port 5432
                                                  ┌─ Data host ───▼────────────────────────┐
                                                  │ PostgreSQL  zgate_website (ADR-007)    │
                                                  └────────────────────────────────────────┘
```

| Component                                           | Where                                             | Notes                                                                                    |
| --------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Caddy (TLS, HSTS, body limits)                      | **Each** app host, ports 80/443                   | The only thing exposed to the internet on that host                                      |
| Public site (image `z-gate-website-frontend:<sha>`) | Frontend host, port 3002, internal only           | No database access. Reads content from the CMS over HTTPS                                |
| CMS (image `z-gate-website-backend:<sha>`)          | CMS host, port 3004, internal only                | Admin, content API, lead intake. The only component with database access                 |
| PostgreSQL database `zgate_website`                 | Data host or managed in-country service (ADR-004) | **Separate from the e-learning database** (ADR-007). Reachable from the CMS host only    |
| Uploaded media (admin images and PDFs)              | Docker volume `website_media` on the CMS host     | The public site shows none of it today. Back it up (§6) until object storage replaces it |

Three hostnames:

- **`www.<domain>`** → frontend host: the public site. The bare domain redirects here.
- **`cms.<domain>`** → CMS host. `/api/*` is reachable from the internet (the frontend calls it); everything else, the admin included, only from `ADMIN_ALLOWED_IPS`.

### What crosses the internet between the two hosts

| Flow                       | Direction                         | Protected by                                                                                                                |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Content reads (`/api/...`) | frontend → `https://cms.<domain>` | TLS + `CMS_API_TOKEN` (bearer, constant-time compare). Optional: `API_ALLOWED_IPS` = the frontend host's outbound address   |
| Lead intake                | frontend → `https://cms.<domain>` | TLS + `LEAD_INTAKE_TOKEN`; the CMS re-validates every field                                                                 |
| "Content changed" webhook  | CMS → `https://www.<domain>`      | TLS + HMAC-SHA256 signature with `REVALIDATE_SECRET`, refused when older than 5 minutes. Optional: `REVALIDATE_ALLOWED_IPS` |

The **three shared secrets** must be identical on both hosts. Both apps refuse to start in production without them, naming the missing variable.

**Visitors' browsers never talk to the CMS.** The CMS login cookie lives on `cms.` only, so it never reaches the public origin.

## 2. Decide before you start

| Decision                                                                                 | Why it matters                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hosting region** ([ADR-004](adr/ADR-004-data-residency-hosting-region.md), still open) | The database holds leads (personal data, Law N° 058/2021). **The frontend host processes them too**: every form submission passes through it, and its rate limiter holds visitors' IP addresses in memory. It is not "static marketing content". **Recommendation:** keep both app hosts and the data host in Rwanda until ADR-004 is decided. |
| **Where each app runs**                                                                  | Two small VMs with Docker (this guide, parts B and C) is the reference setup and the safest. A platform is possible with care: §7                                                                                                                                                                                                              |
| **Same provider and region for both hosts**                                              | A page not yet cached needs several CMS calls before it renders. Keep the round trip between the hosts short (same data centre or region)                                                                                                                                                                                                      |
| **Production domain** (decision D4)                                                      | Sets `SITE_URL`, `ADMIN_URL`, `CMS_URL`, the Caddy hosts and later the HSTS preload                                                                                                                                                                                                                                                            |
| **Staging**                                                                              | Same shape as production: two hosts (they can be the smallest size), its own database and secrets. It's what proves the cross-host setup before production                                                                                                                                                                                     |

**Sizing that is enough to start:** frontend host 1 vCPU / 1-2 GB RAM; CMS host 1-2 vCPU / 2 GB; data host 1-2 vCPU / 2 GB with SSD and room for 30 days of dumps. Use Ubuntu 24.04 LTS or Debian 12 on each.

## Part A — Shared preparation (once)

### A1. DNS

| Record                | Points to     |
| --------------------- | ------------- |
| `www.<domain>` A/AAAA | frontend host |
| `<domain>` A/AAAA     | frontend host |
| `cms.<domain>` A/AAAA | CMS host      |

Low TTL (300 s) until the launch has settled. Caddy needs these records in place, and port 80 reachable, to get its certificates.

### A2. Generate the secrets

On a trusted machine, never on a shared one:

```bash
for name in DJANGO_SECRET_KEY CMS_API_TOKEN LEAD_INTAKE_TOKEN REVALIDATE_SECRET; do
  echo "$name=$(openssl rand -base64 48)"
done
```

Plus two database passwords (owner and app role). Store them all in the company password manager, one entry per environment. **Staging and production never share a value.**

### A3. Baseline for every host (frontend, CMS, data)

1. OS security updates on, automatically: `apt install unattended-upgrades`.
2. A named admin user with SSH keys; `PasswordAuthentication no` and `PermitRootLogin no` in `sshd_config`.
3. Firewall: SSH (22) only from the admin network; 80 and 443 from anywhere on the **two app hosts**; on the data host, 5432 only from the CMS host's address. Nothing else.
   - **Docker bypasses `ufw` for published ports.** The compose files publish only Caddy's 80/443; never add a `ports:` entry for an app container.
4. Docker Engine and the Compose plugin **2.24 or newer** (`docker compose version`): the CMS stack uses optional env files.
5. Time sync on (`timedatectl`): the webhook signature is refused when the clocks drift more than 5 minutes.
6. If the GHCR packages are private, log in once with a read-only token: `docker login ghcr.io -u <github-user>` (a personal access token with `read:packages` only).
7. Configuration folder: `sudo install -d -m 700 /etc/zgate`.

Copy only that host's folder onto it, nothing else:

```bash
git clone --filter=blob:none --sparse https://github.com/<owner>/<repo>.git /opt/zgate-website
cd /opt/zgate-website && git sparse-checkout set backend/deploy    # CMS host
#                        git sparse-checkout set frontend/deploy   # frontend host
```

### A4. The database (data host)

1. PostgreSQL 16. Apply the server settings from `backend/database/postgresql.conf`.
2. Create the roles and the database with `backend/database/init/01-roles.sql`, **replacing both dev passwords** with the generated ones (psql as a superuser, once).
3. Require TLS for remote connections (`hostssl` lines only in `pg_hba.conf`, for the CMS host's address and these two roles).
4. Check from the CMS host: `psql "postgres://zgate_website_app:…@data-host:5432/zgate_website?sslmode=require" -c 'select 1'`.
5. Set up backups now, not later (§6).

A managed in-country PostgreSQL service is a good alternative (backups and point-in-time recovery included): use the same two roles.

## Part B — The CMS host

From `/opt/zgate-website/backend/deploy`.

### B1. Configuration

```bash
sudo install -m 600 edge.env.example     /etc/zgate/edge.env
sudo install -m 600 backend.env.example  /etc/zgate/website-backend.env
sudo install -m 600 migrate.env.example  /etc/zgate/website-migrate.env
sudoedit /etc/zgate/edge.env /etc/zgate/website-backend.env /etc/zgate/website-migrate.env
```

| File                  | Set                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `edge.env`            | `CMS_HOST=cms.<domain>`, `ADMIN_ALLOWED_IPS` (office/VPN), `ACME_EMAIL`. `API_ALLOWED_IPS` once you know the frontend host's outbound address (`curl -s https://ifconfig.me` from it)         |
| `website-backend.env` | `DATABASE_URL` (**app** role, `sslmode=require`), `DJANGO_SECRET_KEY`, `ADMIN_URL=https://cms.<domain>`, the three shared secrets, `REVALIDATE_URL=https://www.<domain>/api/revalidate`, SMTP |
| `website-migrate.env` | `DATABASE_URL` with the **owner** role                                                                                                                                                        |

### B2. Migrate, seed once, start

```bash
export BACKEND_TAG=<git sha of a green Backend run on main>
C="docker compose -f compose.yml --env-file /etc/zgate/edge.env"
$C pull
$C run --rm website-migrate                                         # schema, as the owner role
$C run --rm website-migrate python manage.py seed_content           # first deployment only: the approved copy
$C run --rm website-migrate python manage.py createsuperuser        # first deployment only: the first admin
$C up -d --wait                                                     # Caddy + the CMS; waits for the healthcheck
```

Until the frontend host is up (part C), the CMS logs "Site revalidation failed" after each publish. That's expected and harmless.

### B3. Check it from outside (a machine not on the allowlist)

```bash
curl -s https://cms.<domain>/api/health                                   # {"status":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' https://cms.<domain>/api/site-settings   # 401: the API needs its token
curl -s -o /dev/null -w '%{http_code}\n' https://cms.<domain>/admin/              # 404: admin hidden off the allowlist
```

From an allowlisted machine, `https://cms.<domain>/admin/` shows the sign-in page.

### B4. Staff accounts

The admin created above signs in at `https://cms.<domain>/admin`. Under Settings > Users: put the publisher (Marketing lead) in **Publishers** and everyone else in **Editors** only. Two admins at most.

## Part C — The frontend host

From `/opt/zgate-website/frontend/deploy`.

### C1. Configuration

```bash
sudo install -m 600 edge.env.example      /etc/zgate/edge.env
sudo install -m 600 frontend.env.example  /etc/zgate/website-frontend.env
sudoedit /etc/zgate/edge.env /etc/zgate/website-frontend.env
```

| File                   | Set                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `edge.env`             | `SITE_HOST=www.<domain>`, `APEX_HOST=<domain>`, `ACME_EMAIL`. `REVALIDATE_ALLOWED_IPS` = the CMS host's outbound address, once known    |
| `website-frontend.env` | `SITE_URL=https://www.<domain>`, `CMS_URL=https://cms.<domain>`, the **same** three shared secrets as the CMS host, `TRUSTED_PROXIES=1` |

### C2. Start

```bash
export FRONTEND_TAG=<git sha of a green Frontend run on main>
F="docker compose -f compose.yml --env-file /etc/zgate/edge.env"
$F pull
$F up -d --wait
```

### C3. Check it from outside

```bash
curl -sI https://www.<domain>/ | grep -i -E 'content-security-policy|strict-transport-security'
curl -s  https://www.<domain>/api/ready                     # {"status":"ready","checks":{"cms":"ok"}}: it reaches the CMS
curl -s -o /dev/null -w '%{http_code}\n' https://www.<domain>/admin                        # 404: no CMS on the public host
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.<domain>/api/revalidate      # 401 (or 404 with an allowlist): unsigned is refused
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/                                 # 301 to www.
```

`/api/ready` answering `not_ready` means the frontend can't reach the CMS: check `CMS_URL`, `API_ALLOWED_IPS` on the CMS host, and that `CMS_API_TOKEN` is identical on both hosts (`$F logs website-frontend` shows HTTP 401s).

## Part D — End-to-end check

This is also the **smoke check** the release gate requires on staging ([ADR-011](adr/ADR-011-website-release-gate.md)):

1. Open the home page, one course page and the contact page in a browser.
2. **Webhook:** in the CMS, change one word on a published page and publish. Within seconds the public page shows it. If not: CMS logs (`$C logs website-backend | grep -i revalidation`).
3. **Lead intake** (once a privacy notice is published, §3): submit the course page's waitlist form as "Release check <sha>". It appears in the CMS under Leads, and the notification email arrives. An admin then deletes it (audit-logged), so test sign-ups never count as demand.

## 3. Before going public (content and legal gates)

- [ ] **Privacy notice** written by legal counsel / the DPO and **published** in the CMS (Pages > `privacy`). The contact and waitlist forms stay hidden until this is done.
- [ ] Site settings > Privacy: **notice version** set (e.g. `2026-11-01`). It's stored with every consent.
- [ ] Site settings > Contact: **response-time commitment** and **lead notification email** filled in.
- [ ] SMTP settings in `website-backend.env`. Send a test enquiry and confirm the staff email arrives.
- [ ] Audience line, division pages, course outcomes, fees and intake dates reviewed by the business against [CONTENT_GUIDE.md](CONTENT_GUIDE.md). Nothing is invented by the seed.
- [ ] Production domain decided, and `SITE_URL` / `ADMIN_URL` / `CMS_URL` / Caddy hosts set accordingly.
- [ ] The other launch gates in [SECURITY.md](SECURITY.md) ("Open before launch") closed.

## 4. Routine releases

### The pipeline

- **Frontend** workflow (`.github/workflows/frontend.yml`): runs when the site, `packages/`, `config/`, `tests/`, `vendor/` or the lockfile change. Builds, tests, runs the browser checks, scans and (on `main`) pushes `z-gate-website-frontend:<sha>`.
- **Backend** workflow (`.github/workflows/backend.yml`): runs when `backend/` changes. Lints, tests, runs Django's deploy checks against the production settings, the browser checks, scans and (on `main`) pushes `z-gate-website-backend:<sha>`.
- Both call the same **Browser checks** (`.github/workflows/e2e.yml`), which run both apps' production builds side by side, so neither app is published without being checked against the other.
- **Repository** workflow: the secrets scan and Prettier, on every change.

Each host therefore has **its own tag** (`FRONTEND_TAG`, `BACKEND_TAG`): a release of one app doesn't touch the other. Keep a deploy log (date, environment, app, SHA, who, the staging smoke result), so you always know which pair is running.

**Branch protection:** path-filtered workflows don't run for unrelated changes, so don't mark their jobs as required checks (a required check that never starts blocks the merge). Require the **Repository** checks, and review that the app workflow(s) for the changed code went green.

### Keep the two apps compatible across releases

CI tests the frontend and the CMS **at the same commit**. In production they may run different commits, so every change must work with the other app's current release:

| Change                                          | Release order                                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New field or endpoint in the content API        | CMS first, then the frontend that uses it                                                                                                                 |
| Removing or renaming a field the frontend reads | Frontend first (stop reading it, tolerate its absence), then the CMS. A rename is "add new" then "remove old"                                             |
| New lead form field                             | CMS first, accepting the field as optional; then the frontend that sends it; make it required only after                                                  |
| New content block type                          | Frontend first (it renders the block), then the CMS that lets editors add it. A block the frontend doesn't know yet is left out of the page, not an error |
| Database migration                              | Backward-compatible with the running CMS release: expand, then contract in a later release                                                                |
| Shared secret                                   | Both hosts in the same window (§10)                                                                                                                       |

When a change needs both apps, release them one after the other in the order above, each through its own gate.

### Releasing one app

1. **Release gate** ([ADR-011](adr/ADR-011-website-release-gate.md)), no production deploy without it:
   - the app's workflow run for that SHA is green, including **Browser checks**; and
   - part D has passed **on staging** with that SHA deployed (and the other app at the version production runs).
   - **Once the enrollment mode is "E-learning platform" on staging:** also the customer-journey test (e-learning repository, "Customer journey") against staging, with its run URL in the deploy log.
2. **CMS host:**
   ```bash
   export BACKEND_TAG=<new sha>
   $C pull
   $C run --rm website-migrate                # pending migrations; no-op if none
   $C up -d --wait website-backend            # waits for the healthcheck
   ```
   **Frontend host:**
   ```bash
   export FRONTEND_TAG=<new sha>
   $F pull && $F up -d --wait website-frontend
   ```
   The restart takes a few seconds; Caddy answers 502 meanwhile. Release in a quiet hour.
3. Run the part C3 / B3 checks, then part D steps 1 and 2.

After a frontend release the page cache starts empty: the first visit to each page renders it again (needs the CMS up).

## 5. Rollback

Each app rolls back on its own, to the previous SHA in the deploy log:

```bash
export BACKEND_TAG=<previous good sha>;  $C up -d --wait website-backend     # CMS host
export FRONTEND_TAG=<previous good sha>; $F up -d --wait website-frontend    # frontend host
```

Don't reverse migrations in production (`manage.py migrate <app> <earlier>`) unless a migration is the cause _and_ its reverse has been reviewed: reversing can drop columns and their data. Rolling the image back is enough when migrations are backward-compatible (§4). Check the compatibility table before rolling one app back past a change the other app now relies on.

## 6. Backups (required before real leads are collected)

The database holds **leads and consent records (personal data)** and the **audit log**. Until a managed service with point-in-time recovery is chosen (ADR-004):

- **Nightly logical backup** from the data host with `backend/database/backup.sh`, encrypted with `age` (`BACKUP_AGE_RECIPIENT`), copied to a **second Rwandan location**. Keep 30 days (`backend/database/README.md`).
- **Media volume** on the CMS host, nightly, to the same location:
  ```bash
  docker run --rm -v zgate-website-backend_website_media:/media:ro -v /var/backups/zgate:/out alpine \
    tar -czf /out/website-media-$(date +%F).tar.gz -C /media .
  ```
- **The `/etc/zgate/*.env` files** of both hosts: in the password manager, not in the backup set.
- **Test a restore every quarter** into a scratch database (`restore.sh`, Data Privacy Policy §7). A backup that has never been restored doesn't count.

Nothing on the frontend host needs a backup: it is rebuilt from its image and its env file.

## 7. Hosting on a platform instead of a VM

Both images are standard containers, so a container platform can run them instead of parts B and C. **Read this whole section first**: several protections live in this repository's Caddy files and in-process code, and a platform changes them. For Vercel and Render specifically, follow [DEPLOY_VERCEL_RENDER.md](DEPLOY_VERCEL_RENDER.md): it applies everything below, with `frontend/vercel.json` and `render.yaml`.

### The public site on a platform

- **Run the published image** (`ghcr.io/<owner>/z-gate-website-frontend:<sha>`, port 3002, health check `/api/health`): it's the one that was scanned. A Node build from source works too: from the repository root, `pnpm install --frozen-lockfile --filter "@zgate/website-frontend..."` then `pnpm --filter @zgate/website-frontend build`, copy `frontend/.next/static` to `frontend/.next/standalone/frontend/.next/static` (the image does this), and start with `node frontend/.next/standalone/frontend/server.js`.
- **Exactly one instance**, unless you first move two things to shared stores: the page cache (the CMS webhook reaches one instance only; the others stay stale for up to an hour) and the form rate limiter (each instance counts on its own). Serverless and "scale to many" modes break both.
- **`TRUSTED_PROXIES`** must match how the platform's proxy writes `X-Forwarded-For`. Check it before launch: submit the form 6 times in 10 minutes from one connection; the 6th must be refused, and a second connection must still get through.
- **HSTS and body-size limits** are set by Caddy here; configure them on the platform (HSTS `max-age=31536000; includeSubDomains`).
- `/api/revalidate` is then protected by its signature only. That is sufficient; an IP allowlist was only an extra.
- **Data residency:** form submissions pass through this host (§2).

### The CMS on a platform

- Image `ghcr.io/<owner>/z-gate-website-backend:<sha>`, port 3004, health check `/api/health`, readiness `/api/ready`. Variables from `backend.env.example`; set `DJANGO_ALLOWED_HOSTS` if the platform's health checks use another host name.
- **A persistent volume at `/data/media`**, or uploads vanish on every restart.
- **Migrations as a release step** before the new version takes traffic, with the owner role: `python manage.py migrate --noinput` and `DATABASE_URL` = the owner URL.
- **The admin must stay behind an IP allowlist** (or a VPN / SSO with MFA). The CMS has no second factor of its own. **Don't host the CMS anywhere that can't restrict `/admin` by source IP** until that changes (§11).
- The platform's proxy must pass `X-Forwarded-Proto` (Django uses it to know the request was HTTPS).

## 8. Monitoring

| Check                                                                                                | From                 | Alert when                                                              |
| ---------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| `https://www.<domain>/api/ready`                                                                     | Outside, every 1 min | Not 200 twice in a row (site down, or can't reach the CMS)              |
| `https://www.<domain>/`                                                                              | Outside              | Not 200, or slower than 3 s                                             |
| `https://cms.<domain>/api/health`                                                                    | Outside              | Not 200 (CMS host down)                                                 |
| TLS certificate expiry, both hosts                                                                   | Outside              | Under 14 days (Caddy renews at 30)                                      |
| Disk use on the CMS and data hosts                                                                   | Host                 | Over 80%                                                                |
| Nightly backup file present and non-empty                                                            | Backup location      | Missing                                                                 |
| `docker compose logs` for "Lead submission failed", "Lead intake failed", "Site revalidation failed" | Host                 | Any (a lead may be lost: the visitor saw an error and the phone number) |

Logs stay on each host (json-file, 5 × 20 MB per container). Ship them to a central store only if it meets the same residency rule: CMS logs contain IP addresses.

## 9. Operating notes

`$C` is the compose command on the CMS host (part B2), `$F` on the frontend host (part C2).

| Situation                                           | Action                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staff can't reach the CMS                           | Their IP must be in `ADMIN_ALLOWED_IPS` (CMS host `edge.env`), then `$C up -d caddy`                                                                                                                                                                                                         |
| A form says "several messages from this connection" | That visitor hit the rate limit (5 per 10 minutes). It clears by itself                                                                                                                                                                                                                      |
| Published change not visible                        | The CMS sends a signed webhook to the public site on publish; failing that, pages refresh within an hour. `$C logs website-backend` for "Site revalidation failed": usually `REVALIDATE_URL`, a differing `REVALIDATE_SECRET`, clock drift, or `REVALIDATE_ALLOWED_IPS` on the frontend host |
| Forms say "something went wrong on our side"        | The public site couldn't hand the lead to the CMS. `$F logs website-frontend` for "Lead submission failed"; check `LEAD_INTAKE_TOKEN` on both hosts and `API_ALLOWED_IPS`                                                                                                                    |
| New pages error, cached pages fine                  | The frontend can't read the CMS: `curl https://www.<domain>/api/ready`. Then the CMS host (`$C ps`, `$C logs website-backend`) and `CMS_API_TOKEN` on both hosts                                                                                                                             |
| Frontend host changed its outbound IP               | Update `API_ALLOWED_IPS` on the CMS host (if set), `$C up -d caddy`                                                                                                                                                                                                                          |
| Suspected compromised CMS account                   | Admin sets a new password and removes the account's groups. Rotating `DJANGO_SECRET_KEY` signs everyone out. Review the audit log (filter by the account) for leads it opened                                                                                                                |
| Leads may have been exposed                         | Contain first (above), then tell the Managing Director the same day: under Law N° 058/2021 the people affected, and the supervisory authority, may need to be notified. The audit log shows who opened which leads and when                                                                  |
| A shared secret may have leaked                     | Rotate it now (§10), whatever the hour                                                                                                                                                                                                                                                       |
| Certificate problems                                | `$C logs caddy` / `$F logs caddy`. Caddy renews automatically: check DNS and that port 80 is reachable                                                                                                                                                                                       |

## 10. Rotating the shared secrets

Rotate yearly, when someone with access leaves, or at once if one may have leaked. Each app accepts one value per secret, so between the two restarts the affected flow fails:

| Secret              | Fails between the restarts                        |
| ------------------- | ------------------------------------------------- |
| `CMS_API_TOKEN`     | Pages not yet cached (cached pages keep working)  |
| `LEAD_INTAKE_TOKEN` | Form submissions (visitors see the phone number)  |
| `REVALIDATE_SECRET` | Refresh-on-publish (the hourly refresh covers it) |

Steps, in a quiet hour: generate the new value (A2); put it in `website-backend.env` **and** `website-frontend.env`; `$C up -d --wait website-backend`, then immediately `$F up -d --wait website-frontend`; run C3 and part D. Update the password manager.

## 11. Known limits (tracked)

- **No second factor for CMS logins.** The IP allowlist is the compensating control. Before staff need remote access, add a VPN or SSO with MFA.
- **Media on local disk** of the CMS host. Backed up separately (§6) until object storage is chosen.
- **The public site runs as one instance.** Its page cache and form rate limiter are in process memory (§7).
- **One value per shared secret.** Rotation has a short failure window (§10); accepting a "next" value alongside the current one would remove it.
- **The content API sends no version.** Compatibility between the two releases is kept by the order rules in §4, not checked at runtime.

## 12. Production readiness checklist

**Infrastructure**

- [ ] ADR-004 decided; hosts and backups placed accordingly
- [ ] Three hosts hardened (A3): updates, SSH keys only, firewall, Compose ≥ 2.24, time sync
- [ ] DNS for `www.`, the bare domain and `cms.`; certificates issued on both app hosts
- [ ] Database: owner and app roles with generated passwords, TLS only, reachable from the CMS host only
- [ ] Secrets generated per environment, in the password manager, files mode 600 under `/etc/zgate`

**Security**

- [ ] `ADMIN_ALLOWED_IPS` = the office/VPN only; admin returns 404 from elsewhere (B3)
- [ ] `/api/site-settings` without the token returns 401 (B3)
- [ ] `API_ALLOWED_IPS` and `REVALIDATE_ALLOWED_IPS` set to the other host's outbound address, if fixed
- [ ] Public host: CSP and HSTS present, `/admin` 404, unsigned `/api/revalidate` refused (C3)
- [ ] Two admins at most; everyone else Editors or Publishers

**Operations**

- [ ] Staging mirrors production (two hosts) and part D passed there
- [ ] Monitoring and alerts from §8 in place
- [ ] Nightly encrypted backups running; one restore tested
- [ ] Deploy log started; rollback (§5) rehearsed once on staging
- [ ] Content and legal gates (§3) closed
