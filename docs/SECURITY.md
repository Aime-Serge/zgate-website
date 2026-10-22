# Security and Personal Data

How the website protects visitors, leads and staff accounts, what risks are accepted on purpose, and what is still open before launch. Engineers: read this before touching forms, the CMS, headers or deployment.

## What we protect

| Data                                                                                                                                                | Where                           | Who can see it                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| **Leads**: name, optional business name, contact and reply preference, selected service areas/course, message, consent record, campaign attribution | CMS database (`leads_lead`)     | Publishers and admins, in the CMS; every read is logged |
| **Staff accounts**: email, password hash, roles, sign-ins                                                                                           | CMS database                    | Admins                                                  |
| **Audit log**                                                                                                                                       | CMS database (`audit_auditlog`) | Admins, read-only                                       |
| Published content                                                                                                                                   | CMS → public site               | Everyone (it's public)                                  |

Personal data is stored in Rwanda by default (Law N° 058/2021). The hosting region is still an open decision ([ADR-004](adr/ADR-004-data-residency-hosting-region.md)).

## How the system is shaped

- **Two hosts, two apps** ([ADR-013](adr/ADR-013-independent-hosting.md)). The public site (`www.`) has no login, no database and no CMS login: it reads published content from the CMS's read-only API. On the CMS host (`cms.`), only `/api/*` is reachable from the internet; the admin and everything else only from `ADMIN_ALLOWED_IPS` (`backend/deploy/Caddyfile`). The staff login cookie never reaches the public origin.
- **The browser never talks to the CMS.** The public site calls it server to server over HTTPS with bearer tokens, compared in constant time: `CMS_API_TOKEN` for content reads, `LEAD_INTAKE_TOKEN` for form submissions. Each direction can also be limited to the other host's address (`API_ALLOWED_IPS`, `REVALIDATE_ALLOWED_IPS`).
- **Least-privilege database roles.** Migrations run as the owner role; the running CMS can only read and write rows (`backend/database/init/01-roles.sql`).

## Controls

**Public site (`frontend/`)**

- Headers on every response: Content-Security-Policy locked to this origin (no third-party scripts, frames or form targets, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `nosniff`, a strict referrer policy, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, no `X-Powered-By`. HSTS is set at Caddy.
- **Forms:** the server action re-validates everything (anyone can post to it directly), with a honeypot, a per-visitor limit (5 per 10 minutes) and a site-wide limit (300 per hour). The visitor's address is read from `X-Forwarded-For` only as far as `TRUSTED_PROXIES` allows, so it can't be spoofed. No form is shown until a privacy notice is published.
- **Cache webhook** (`/api/revalidate`): HMAC-signed with a timestamp (a signature older than 5 minutes is refused). It comes from the CMS host over the internet, so the signature is the control; Caddy caps its body at 4 KB and can restrict it to the CMS host's address.
- **Errors:** visitors see a plain message and the phone number; details go to the server log only.

**CMS (`backend/`)**

- Serves only `/admin`, `/api`, its static files, documents and media; everything else is a 404 (`backend/config/middleware.py`). Every response is `noindex`.
- **Content API:** published content only, GET only, and in production only with `CMS_API_TOKEN` (`backend/content/views.py`). Without it every path answers 401, so nobody can probe which pages exist. Caddy caps `/api/*` request bodies at 256 KB.
- **Sign-in:** 5 wrong passwords lock that account for 15 minutes (django-axes); passwords of at least 12 characters, checked against common passwords; sessions end after 8 hours; secure, `SameSite=Lax` cookies over HTTPS.
- **Roles:** Editors draft; Publishers publish and work leads; admins (superusers, two people at most) manage accounts, see the audit log and own the Academy enrollment switch.
- **Leads:** nobody can add one by hand; only admins delete; consent and attribution can't be edited after submission, and the database refuses it too (a trigger), whatever writes. No lead can be stored without contact consent (a CHECK constraint).
- **Audit log:** append-only, even for admins, and enforced by the database (no delete, no rewrite), not only by the application. It records every staff read of a lead, every change (field names only, never values), deletions, role grants, password changes and sign-ins, and keeps the actor's email after their account is deleted.
- **Content:** rich text is sanitized with an allowlist before it leaves the CMS; links must be site paths or `https://`; no raw HTML blocks.
- **Configuration** is validated at start-up; production refuses to start without its secrets and an `https://` admin address. Problems are reported by variable name, never by value.

**Delivery**

- Secrets (≥ 32 random characters) live only in server env files (`/etc/zgate/*.env`, mode 600), never in the repository. CI scans the full git history for secrets (gitleaks).
- Container images run as a non-root user, with no package manager, and are scanned (Trivy) before they're published. GitHub Actions are pinned by commit SHA, with read-only permissions by default.
- Local development binds every port to `127.0.0.1` only.

## Dependencies

- **14-day rule:** no package version younger than 14 days is ever installed: `minimumReleaseAge` in `pnpm-workspace.yaml`, and `--uploaded-prior-to=P14D` when locking Python (`backend/scripts/lock.sh`). Most malicious releases are caught and pulled within that window.
- Exact pins and full lockfiles on both sides; the CMS image installs its lock with `--no-deps`.
- CI fails on any high or critical advisory (`pnpm audit`, `pip-audit`). Forced fixes (`overrides`) and accepted advisories (`auditConfig.ignoreGhsas`, `backend/requirements/accepted-advisories.txt`, `.trivyignore`) each carry a reason and a removal condition. A fix younger than 14 days is normally not installed early: its advisory is accepted until the fix can be locked. The exception is a security fix approved for early locking, listed with its reason and removal date in `backend/requirements/age-exceptions.txt` (`scripts/lock.sh` installs it after resolving within the rule).

## The website assistant

The round button at the bottom right (`frontend/src/components/site/Assistant.tsx`, endpoint `frontend/src/app/api/assistant/route.ts`).

- **Guided mode (default, no `ANTHROPIC_API_KEY`):** questions are matched against the site's own published pages on this server. Nothing leaves it.
- **AI mode (`ANTHROPIC_API_KEY` set):** each question, with the last few turns, is sent to Anthropic's API (processed outside Rwanda) and answered only from the site's published content. **Do not set the key until the privacy notice covers this transfer** (Law N° 058/2021). The panel tells visitors so, and asks them not to share passwords, tax IDs or client records.
- **Both modes:** nothing a visitor types is stored or logged (errors log status codes only); same-origin requests only (403 otherwise); 20 questions per visitor per 10 minutes and 600 per hour site-wide (429), which also caps AI spend; messages are capped at 1,000 characters and 12 turns. Model: `ASSISTANT_MODEL` (default `claude-opus-5-5`).

## Risks accepted on purpose

| Risk                                                                                                 | Why it's acceptable today                                                                                   | Revisit when                                                 |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| The public site's CSP allows `'unsafe-inline'` scripts (cached pages can't carry per-request nonces) | No login, session or user-generated content on that origin; every other directive is strict                 | The site gains anything a visitor signs in to                |
| The CMS has no built-in second factor                                                                | Reachable only from the office IP allowlist                                                                 | Staff need remote access: add a VPN or SSO with MFA first    |
| Form rate limits live in one process's memory                                                        | One public-site instance                                                                                    | Running more than one instance (move them to a shared store) |
| The content API is reachable from the internet, behind `CMS_API_TOKEN`                               | It serves only what the public site already shows; the token keeps it from being scraped or loaded directly | The API ever serves anything that isn't public               |

## Open before launch

These are business and legal steps, not code:

- [ ] **Privacy notice** written by legal counsel or the DPO, published, and its version set in Site settings.
- [ ] **NCSA registration** completed and a **DPO** named.
- [ ] **Hosting region** decided ([ADR-004](adr/ADR-004-data-residency-hosting-region.md)).
- [ ] **Production database roles:** separate owner and app roles, as in local development ([DEPLOYMENT.md](DEPLOYMENT.md)).
- [ ] **Backups** running nightly, encrypted, and restored once as a test (`backend/database/README.md`).

## Reporting a problem

Found a vulnerability or a data leak? Tell the Managing Director directly, or email info@zgaterw.com with "Security" in the subject. Don't open a public issue. Staff: if a lead or account may have been exposed, follow "Operating notes" in [DEPLOYMENT.md](DEPLOYMENT.md).
