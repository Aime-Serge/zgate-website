# Runbook: Deploying the Z-GATE website

**Applies to:** `website/frontend` (public site, Next.js) and `website/backend` (CMS, Payload).
**Files:** `infra/proxy/compose.production.yml`, `infra/proxy/Caddyfile`, `infra/proxy/*.env.example`.
**Audience:** whoever deploys or operates the website. Read it once end to end before the first deployment.

## 1. What runs where

| Component | Where | Notes |
|---|---|---|
| Caddy (TLS, HSTS, IP allowlist for the CMS) | Web VM, ports 80/443 | Only thing exposed to the internet |
| Public site container (image `z-gate-website-frontend:<sha>`) | Web VM, port 3002, internal only | No database access. Reads content from the CMS over the internal network |
| CMS container (image `z-gate-website-backend:<sha>`) | Web VM, port 3004, internal only | Admin, REST API, lead intake. The only component with database access |
| PostgreSQL database `zgate_website` | Data host or managed in-country service (ADR-004) | **Separate from the e-learning database** (ADR-007) |
| Uploaded media | Docker volume `website_media` on the web VM | Back it up (§6) until object storage replaces it |

Two hostnames point at the web VM:
- **`www.<domain>`**: the public site.
- **`cms.<domain>`**: the CMS, reachable only from `ADMIN_ALLOWED_IPS`.

The two containers share two secrets: `LEAD_INTAKE_TOKEN` (the public site hands form submissions to the CMS with it) and `REVALIDATE_SECRET` (the CMS signs its "content changed" webhook with it). Both apps refuse to start in production without them.

## 2. First-time setup

1. **DNS:** A/AAAA records for `www`, `cms` and the bare domain, all pointing to the web VM.
2. **Database:** create the database and its user:
   ```sql
   CREATE USER zgate_website WITH PASSWORD '<generated>';
   CREATE DATABASE zgate_website OWNER zgate_website;
   ```
   Require TLS for remote connections (`sslmode=require` in `DATABASE_URL`).
3. **Configuration on the web VM:**
   - Copy `website-backend.env.example` to `/etc/zgate/website-backend.env`, `website-frontend.env.example` to `/etc/zgate/website-frontend.env`, and `edge.env.example` to `/etc/zgate/edge.env`. All owned by root, mode `600`.
   - Fill in real values. Generate `PAYLOAD_SECRET`, `LEAD_INTAKE_TOKEN` and `REVALIDATE_SECRET` with `openssl rand -base64 48`. The last two must be identical in both app files.
4. **Firewall:** allow 80/443 inbound from anywhere. Allow 22 (SSH) only from the admin network. Nothing else.
5. **Migrate, seed once, start:**
   ```bash
   export WEBSITE_TAG=<git sha from CI>
   C="docker compose -f infra/proxy/compose.production.yml --env-file /etc/zgate/edge.env"
   $C run --rm website-migrate
   $C run --rm website-migrate node_modules/.bin/payload run src/seed/run.ts   # first deployment only
   $C up -d --wait
   ```
6. **First CMS account:** from an allowlisted IP, open `https://cms.<domain>/admin` and create the first user, with role **admin**.
   - Add the publisher account (Marketing lead).
   - Give every other person **editor** only.

## 3. Before going public (content and legal gates)

- [ ] **Privacy notice** written by legal counsel / the DPO and **published** in the CMS (Pages > `privacy`). The contact and waitlist forms stay hidden until this is done.
- [ ] Site settings > Privacy: **notice version** set (e.g. `2026-11-01`). It's stored with every consent.
- [ ] Site settings > Contact: **response-time commitment** and **lead notification email** filled in.
- [ ] SMTP settings in `website-backend.env`. Send a test enquiry and confirm the staff email arrives.
- [ ] Audience line, course outcomes, syllabus and intake dates reviewed by the business. Nothing is invented by the seed.
- [ ] Decision D4 (production domain) made, and `SITE_URL` / `ADMIN_URL` / Caddy hosts set accordingly.

## 4. Routine deployment

CI builds, scans and publishes the images (`z-gate-website-frontend`, `z-gate-website-backend` and `z-gate-website-migrate`) on every merge to `main`, tagged with the commit SHA. All three always deploy together, at the same SHA. Then:

1. Confirm the commit's CI run is green, including **"Website - browser checks"**.
2. On the VM:
   ```bash
   export WEBSITE_TAG=<new sha>
   $C pull
   $C run --rm website-migrate      # applies pending migrations; no-op if none
   $C up -d --wait website-backend website-frontend   # rolls both; waits for their healthchecks
   ```
3. Smoke test from outside:
   ```bash
   curl -sI https://www.<domain>/ | grep -i content-security-policy
   curl -s  https://www.<domain>/api/ready        # {"status":"ready",...} - the CMS is reachable too
   curl -s -o /dev/null -w '%{http_code}\n' https://www.<domain>/admin   # 404 - CMS never on the public host
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.<domain>/api/revalidate   # 404 - webhook is internal only
   ```
4. Open the home page, one course page and the contact page in a browser.

**Migrations must be backward-compatible with the previous release** (expand, then contract: `docs/platform-v2/06-DEVOPS-RELIABILITY.md` §3). This is what makes rollback safe.

## 5. Rollback

```bash
export WEBSITE_TAG=<previous good sha>
$C up -d --wait website-backend website-frontend
```

Don't run `migrate:down` in production unless a migration is the cause *and* its `down` has been reviewed. The audit-log migration's `down` preserves data; generated `down` steps don't always.

## 6. Backups (required before real leads are collected)

The website database holds **leads and consent records (personal data)** and the **audit log**. Until a managed service with point-in-time recovery is chosen (ADR-004):

- **Nightly logical backup** from the data host, encrypted, copied to a second Rwandan location:
  ```bash
  pg_dump -Fc -d zgate_website | age -r <backup-public-key> > website-$(date +%F).dump.age
  ```
- **Media volume:** a nightly tar of the `website_media` volume, to the same location.
- **Keep 30 days.**
- **Test a restore every quarter** into a scratch database (Data Privacy Policy §7). A backup that has never been restored doesn't count.

## 7. Operating notes

| Situation | Action |
|---|---|
| Staff can't reach the CMS | Check their IP is in `ADMIN_ALLOWED_IPS` (`edge.env`), then `$C restart caddy` |
| A form says "several messages from this connection" | That visitor hit the rate limit (5 per 10 minutes). It clears by itself. |
| Published change not visible | Pages refresh on publish (the CMS sends a signed webhook to the public site). Failing that, they refresh within an hour. Check `$C logs website-backend` for "Site revalidation failed" or "skipped": usually `REVALIDATE_URL` or a `REVALIDATE_SECRET` that differs between the two env files. |
| Forms say "something went wrong on our side" | The public site couldn't hand the lead to the CMS. Check `$C logs website-frontend` for "Lead submission failed" and that `LEAD_INTAKE_TOKEN` matches in both env files. |
| Public site errors on pages not yet cached | The CMS is down or unreachable: cached pages keep working, new ones can't render. `$C ps`, then `$C logs website-backend`. |
| Suspected compromised CMS account | Admin sets a new password and changes the role. Rotating `PAYLOAD_SECRET` signs everyone out. Review the audit log for leads access. |
| Rotating the shared secrets | Change `LEAD_INTAKE_TOKEN` / `REVALIDATE_SECRET` in both env files, then `$C up -d --wait website-backend website-frontend`. Forms and refresh-on-publish fail between the two restarts, so do it in a quiet hour. |
| Certificate problems | `docker compose logs caddy`. Caddy renews automatically, so check DNS and port 80 reachability. |

## 8. Known limits (tracked)

- **No second factor for CMS logins.** The IP allowlist is the compensating control.
- **Media on local disk.** It must be backed up separately (§6) until object storage (ADR-P7).
- **Form rate limiting is per instance, in memory.** That's fine for one container; it needs a shared store before scaling out.
