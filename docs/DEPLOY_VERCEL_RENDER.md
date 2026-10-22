# Deploying on Vercel (public site) and Render (CMS)

**Audience:** whoever deploys the website. Follow the steps in order; each ends with a check.
**Only trying it out, at no cost?** Use [Free demo](#free-demo-no-cost) at the end instead of steps 0-7.
**Files:** `frontend/vercel.json` (Vercel), `render.yaml` (Render Blueprint; `render.free.yaml` for the free demo). The self-hosted alternative (your own servers with Docker and Caddy) is [DEPLOYMENT.md](DEPLOYMENT.md); its sections on releases, backups and operating notes apply here too.

```text
 visitors ──▶ Vercel  www.<domain>      (frontend/, Next.js, region fra1)
                 │  ▲
     content API │  │ "content changed" webhook        all HTTPS, three shared secrets
     lead intake ▼  │
 staff ─────▶ Render  cms.<domain>      (backend/, Django + Wagtail, Frankfurt)
                 │
                 ▼
             Render Postgres  zgate_website   (Frankfurt, private network only)
```

## 0. Before you start

| You need                                   | Why                                                                                                                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A Vercel Pro team**                      | Vercel's Hobby plan is for non-commercial personal use only; a company website must be on Pro                                                                                 |
| **A Render workspace with billing**        | The free tiers can't run this: a free web service sleeps after 15 idle minutes (the site then waits about a minute for content), and a free database is deleted after 30 days |
| Admin access to the GitHub repository      | Both platforms deploy from it                                                                                                                                                 |
| Control of the domain's DNS                | For `www.`, the bare domain and `cms.`                                                                                                                                        |
| A Cloudflare account (free) for the domain | To put the CMS admin behind a login (step 6). Render can't restrict one path by IP address                                                                                    |
| An SMTP provider                           | Staff notification emails for new leads                                                                                                                                       |
| **A decision on data residency (ADR-004)** | See below                                                                                                                                                                     |

> **Data residency.** Render has no region in Africa; Frankfurt is the nearest. With this setup, **leads (personal data) are stored in Germany**, and every form submission passes through Vercel's Frankfurt region. The company's own policy and Law N° 058/2021 require personal data to stay in Rwanda unless the NCSA has authorised the transfer and clients are told first ([ADR-004](adr/ADR-004-data-residency-hosting-region.md), still open). **Use this setup for staging now. Use it for production only after the Managing Director and legal counsel have decided ADR-004 in its favour.** Until then, production belongs on in-country servers ([DEPLOYMENT.md](DEPLOYMENT.md)).

## 1. Generate the three shared secrets

The site and the CMS must hold **identical** values. On your own machine:

```bash
for name in CMS_API_TOKEN LEAD_INTAKE_TOKEN REVALIDATE_SECRET; do echo "$name=$(openssl rand -base64 48)"; done
```

Save them in the company password manager (one entry per environment). Staging and production never share a value.

## 2. The CMS on Render (first: the site needs its address)

1. **Render → New → Blueprint**, connect the GitHub repository, branch `main`. Render reads `render.yaml` and shows one database (`zgate-website-db`) and one web service (`zgate-website-cms`), both in Frankfurt.
2. Fill in the values it asks for:

   | Variable                                                  | First deploy                                                                                                      |
   | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
   | `ADMIN_URL`                                               | `https://zgate-website-cms.onrender.com` (the service's own address; it becomes `https://cms.<domain>` in step 5) |
   | `CMS_API_TOKEN`, `LEAD_INTAKE_TOKEN`, `REVALIDATE_SECRET` | The values from step 1                                                                                            |
   | `REVALIDATE_URL`                                          | `https://<vercel-project>.vercel.app/api/revalidate`. You'll know the exact name in step 3; a guess is fine now   |
   | `EMAIL_FROM`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`       | From your SMTP provider (leave `SMTP_HOST` empty to skip emails for now)                                          |

   `DATABASE_URL` and `DJANGO_SECRET_KEY` fill themselves in.

3. **Apply.** Render creates the database, builds the image from `backend/`, runs `python manage.py migrate` before the service takes traffic, and waits for `/api/health`. The first build takes a few minutes.
4. In the service's **Shell** tab, once:
   ```bash
   python manage.py seed_content      # the approved copy
   python manage.py createsuperuser   # the first admin (use a real, named email)
   ```
5. **Check** from your machine:
   ```bash
   curl -s https://zgate-website-cms.onrender.com/api/health                       # {"status":"ok"}
   curl -s -o /dev/null -w '%{http_code}\n' https://zgate-website-cms.onrender.com/api/site-settings   # 401: the API needs its token
   curl -s -H "Authorization: Bearer <CMS_API_TOKEN>" https://zgate-website-cms.onrender.com/api/site-settings | head -c 120   # JSON
   ```
   Open `https://zgate-website-cms.onrender.com/admin/` and sign in.

## 3. The public site on Vercel

1. **Vercel → Add New → Project**, import the repository, in the Pro team.
2. **Root Directory: `frontend`.** Vercel detects Next.js and pnpm. Leave the build and install commands at their defaults, and keep "Include files outside the root directory" on (the site uses `packages/`).
3. **Settings → General → Node.js Version: 22.x** (what CI tests).
4. **Environment Variables**, scope **Production** only:

   | Name                                                      | Value                                                                                    |
   | --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
   | `ENABLE_EXPERIMENTAL_COREPACK`                            | `1`: builds with the exact pnpm in `package.json` (10.34.6) instead of Vercel's guess    |
   | `SITE_URL`                                                | `https://<vercel-project>.vercel.app` (becomes `https://www.<domain>` in step 5)         |
   | `CMS_URL`                                                 | `https://zgate-website-cms.onrender.com`                                                 |
   | `CMS_API_TOKEN`, `LEAD_INTAKE_TOKEN`, `REVALIDATE_SECRET` | The same values as on Render. Mark them **Sensitive**                                    |
   | `TRUSTED_PROXIES`                                         | `1` (Vercel replaces the visitor-IP header itself, so it can't be spoofed)               |
   | `ANTHROPIC_API_KEY`                                       | Leave unset unless the privacy notice already covers the AI assistant (docs/SECURITY.md) |

5. **Deploy.** `frontend/vercel.json` runs the site's server code in Frankfurt (`fra1`), next to the CMS: a page that isn't cached yet makes several calls to the CMS, and Vercel's default region is Washington D.C. Cached pages are served from Vercel's edge nearest the visitor either way.
6. **Check:**
   ```bash
   curl -s https://<vercel-project>.vercel.app/api/ready            # {"status":"ready","checks":{"cms":"ok"}}
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<vercel-project>.vercel.app/api/revalidate   # 401: unsigned is refused
   ```
   Open the home page, a division page and a course page.

## 4. Connect the two

1. If the Vercel address differs from your guess in step 2, correct `REVALIDATE_URL` on Render (service → Environment) and save; Render redeploys.
2. **Test the webhook:** in the CMS, change one word on a published page and publish. Reload the page on Vercel: it shows the change within seconds. If not, the CMS logs say why (search for "revalidation").
3. **Test a lead** (once a privacy notice is published, [DEPLOYMENT.md §3](DEPLOYMENT.md#3-before-going-public-content-and-legal-gates)): submit the contact form, then find it in the CMS under Leads. Delete it afterwards.

## 5. Custom domains

Do it in this order, so that nothing points at an address that isn't ready:

1. **Render:** service → Settings → Custom Domains → add `cms.<domain>`, create the DNS record Render shows, wait for "Verified" and the certificate.
2. **Vercel:** project → Settings → Domains → add `www.<domain>` and `<domain>`, set the bare domain to redirect to `www`, create the DNS records Vercel shows.
3. **Update the addresses:**
   - Render: `ADMIN_URL=https://cms.<domain>`, `REVALIDATE_URL=https://www.<domain>/api/revalidate`
   - Vercel: `SITE_URL=https://www.<domain>`, `CMS_URL=https://cms.<domain>`, then **Redeploy** (Vercel reads variables at deploy time)
4. Repeat the checks of steps 2.5, 3.6 and 4.2 on the new addresses.

From now on **the admin answers only at `https://cms.<domain>/admin`**. The `onrender.com` address still serves the API and health checks, but no admin pages, so it can't be used to get around step 6.

## 6. Protect the CMS admin (before anyone but you has an account)

The CMS has no second factor, and on Render the admin is reachable from the whole internet. (The self-hosted setup limits it to office IP addresses; Render offers IP rules only on its Scale plan, for a whole service, and they'd block the site itself, because Vercel has no fixed outgoing addresses.)

Put a login in front of the admin with **Cloudflare Access** (Zero Trust, free for up to 50 users):

1. Move the domain's DNS to Cloudflare (or just the `cms` record, on a paid plan). Keep the `cms` record **DNS only** until Render shows the domain as Verified with its certificate, then switch it to **Proxied** and set SSL/TLS mode to **Full (strict)**.
2. Zero Trust → Access → Applications → **Self-hosted**: domain `cms.<domain>`, path `admin`. Policy: **Allow** → emails ending in the company domain, or a list of named staff. Login method: one-time PIN by email (or the company's Google/Microsoft accounts).
3. Leave `/api/*` **without** an Access policy: the site calls it. If Cloudflare's bot protection is on, add a WAF skip rule for `cms.<domain>/api/*`, so it never challenges Vercel's server calls.
4. **Check:** a private browser window on `https://cms.<domain>/admin/` shows Cloudflare's login first; `https://www.<domain>/` still loads new pages.

## 7. Releasing and rolling back

- **CMS:** `render.yaml` sets `autoDeployTrigger: checksPass`: a push to `main` that changes `backend/` deploys only after its GitHub checks (the Backend workflow, browser checks included) pass. Migrations run before the new version takes traffic. Rollback: service → Events → pick the previous deploy → **Rollback**. Migrations aren't reversed, so they must stay backward-compatible ([DEPLOYMENT.md §4](DEPLOYMENT.md#4-routine-releases)).
- **Site:** every push to `main` deploys to production. To keep CI as the gate, use **Settings → Git → Ignored Build Step** or turn on Vercel's deployment checks for the Frontend workflow, if your plan has them. Rollback: Deployments → the previous production deployment → **Instant Rollback**.
- **Both apps change:** release in the order [DEPLOYMENT.md §4](DEPLOYMENT.md#keep-the-two-apps-compatible-across-releases) gives (usually the CMS first).
- **Preview deployments** have none of the Production variables, so their pages can't load content. That's deliberate: give previews their own staging CMS before you rely on them.

## What was checked, and what it means for you

| Check                                                    | Result                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `render.yaml` against Render's published schema          | Valid. A deliberately broken copy is rejected, so the check is real                                                                                                |
| CMS image builds from `backend/` alone                   | Yes: what Render's `dockerContext: ./backend` needs                                                                                                                |
| CMS port                                                 | gunicorn listens on 3004; `PORT=3004` tells Render                                                                                                                 |
| Render health checks                                     | They use `onrender.com` until a custom domain is verified; the CMS now allows that address automatically (`RENDER_EXTERNAL_HOSTNAME`)                              |
| Render's internal database URL (`postgresql://`, no TLS) | Accepted by the settings; the database refuses all connections from outside Render (`ipAllowList: []`)                                                             |
| Migrations                                               | `preDeployCommand`, on separate compute before traffic switches                                                                                                    |
| Uploaded media                                           | No public page uses it, so there's no disk (a disk would also end zero-downtime deploys). **Admin uploads disappear on each deploy** until object storage is added |
| Site build on Vercel                                     | Needs no CMS, database or secrets at build time (pages render on first visit), as CI proves                                                                        |
| Visitor IP for the form's rate limit                     | Vercel overwrites `X-Forwarded-For` with the real visitor address, so `TRUSTED_PROXIES=1` is correct                                                               |
| Refresh on publish                                       | Vercel's page cache is shared by all its instances, so one webhook refreshes the whole site                                                                        |
| HSTS                                                     | Vercel sends it for custom domains; Django sends it for the CMS                                                                                                    |
| Form rate limit                                          | **Weaker on Vercel:** it lives in each function instance's memory, and Vercel runs many. Add a Vercel Firewall rate-limit rule (below)                             |
| CMS admin exposure                                       | **Open to the internet on Render** unless step 6 is done                                                                                                           |

## Recommendations, most important first

1. **Settle ADR-004 before production.** Until it allows storing leads in Frankfurt, run staging on Vercel and Render and production in-country.
2. **Do step 6 before creating any staff account but your own.** Later, add a real second factor to the CMS itself, so the admin no longer depends on Cloudflare alone.
3. **Add a Vercel Firewall rate-limit rule** for `POST` requests to `/contact` and the course pages (for example 10 per minute per IP), to stand in for the per-instance limiter.
4. **Use the CMS's own least-privilege role on Render** if your database plan lets you create roles: run `backend/database/init/01-roles.sql` (with generated passwords) and point `DATABASE_URL` at the app role, keeping the owner for the pre-deploy migration. If it doesn't, record the single role as an accepted risk in docs/SECURITY.md.
5. **Backups:** paid Render Postgres includes point-in-time recovery. Also export a logical backup weekly to company storage, and test a restore every quarter ([DEPLOYMENT.md §6](DEPLOYMENT.md#6-backups-required-before-real-leads-are-collected)).
6. **Watch memory on the CMS** (Render → Metrics) for the first weeks. Two workers fit 512 MB; move to the 1 CPU / 2 GB plan if it climbs past 80%, before raising `WEB_CONCURRENCY`.
7. **Uptime checks** on `https://www.<domain>/api/ready` and `https://cms.<domain>/api/health` (Render and Vercel both alert on failures; an external checker also catches DNS and certificate problems).
8. **Object storage** (an S3-compatible bucket) before editors start uploading images or PDFs in the admin.
9. **A staging pair** (a second Vercel environment and a second Render Blueprint with its own database and secrets), so the release gate in [ADR-011](adr/ADR-011-website-release-gate.md) has somewhere to run.

## Free demo (no cost)

To see the site online before anyone pays: Vercel's free Hobby plan for the site, Render's free tier for the CMS and its database (`render.free.yaml`). **A demo, not staging:** test data only, never real leads.

| Free-tier limit                                                                 | What it means here                                                                                                                           |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| The CMS sleeps after 15 minutes without traffic, and takes ~1 min to wake       | The first uncached page after a quiet spell shows an error once (the site waits 10 s for the CMS); reload a minute later. Optional fix below |
| The database is **deleted 30 days after creation** (14 days' grace), no backups | Everything entered in the CMS is lost then. Recreate the Blueprint to start over                                                             |
| No pre-deploy command, no shell                                                 | The start command migrates, seeds the approved copy and creates the first admin itself (`backend/scripts/start-free-tier.sh`)                |
| Outgoing SMTP ports are blocked                                                 | No lead notification emails                                                                                                                  |
| Vercel Hobby is for non-commercial use                                          | Fine for a private demo; the company's live site needs Vercel Pro (step 0)                                                                   |

1. **Secrets.** Generate the three shared values (step 1). On Windows, in PowerShell:
   ```powershell
   foreach ($n in "CMS_API_TOKEN","LEAD_INTAKE_TOKEN","REVALIDATE_SECRET") { $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); "$n=" + [Convert]::ToBase64String($b) }
   ```
2. **Render → New → Blueprint**, connect the repository, branch `main`, **Blueprint Path: `render.free.yaml`**. Fill in:

   | Variable                                                  | Value                                                                                                                       |
   | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
   | `ADMIN_URL`                                               | `https://zgate-website-cms-demo.onrender.com`. If Render gives the service another address, correct it once it's created    |
   | `CMS_API_TOKEN`, `LEAD_INTAKE_TOKEN`, `REVALIDATE_SECRET` | From step 1                                                                                                                 |
   | `REVALIDATE_URL`                                          | `https://<vercel-project>.vercel.app/api/revalidate`                                                                        |
   | `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`     | Your admin login: 12+ characters, not a common password. Created on first start; **delete both variables after signing in** |

   **Apply.** The first start takes several minutes on the free CPU (build, then every migration).

3. **Check:** `https://zgate-website-cms-demo.onrender.com/api/health` answers `{"status":"ok"}`, and `/admin/` lets you sign in. If the deploy fails, the service's **Logs** say why (a weak admin password is refused there by name).
4. **Vercel → your project → Settings → Environment Variables** (Production): `SITE_URL` (your `.vercel.app` address), `CMS_URL=https://zgate-website-cms-demo.onrender.com`, the three secrets (same values, **Sensitive**), `TRUSTED_PROXIES=1`, `ENABLE_EXPERIMENTAL_COREPACK=1`. Then **Deployments → ⋯ → Redeploy**.
5. **Check:** `https://<vercel-project>.vercel.app/api/ready` answers `{"status":"ready",…}`, then open the home page.
6. **Optional: keep the CMS awake** so visitors never meet a sleeping CMS. A free uptime monitor (UptimeRobot, Better Stack, cron-job.org) requesting `https://zgate-website-cms-demo.onrender.com/api/health` every 10 minutes does it. One always-awake service uses at most 744 of the workspace's 750 free hours a month, so don't run a second free service beside it.

Moving on to real staging: create a new Blueprint from `render.yaml` (paid plans) and follow steps 0-7. The demo's database can't be upgraded in place before it expires; content entered there would have to be re-entered.

## Troubleshooting

| Symptom                                                        | Look at                                                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Render deploy stuck, health check failing                      | Service logs. A `DisallowedHost` error means the address isn't in `ADMIN_URL` or `DJANGO_ALLOWED_HOSTS`               |
| The CMS refuses to start ("Invalid website CMS configuration") | The log names the variable: usually a secret shorter than 32 characters, or `ADMIN_URL` without `https://`            |
| `/api/ready` on the site says `not_ready`                      | `CMS_URL` on Vercel, and `CMS_API_TOKEN` identical on both sides (the CMS answers 401 otherwise)                      |
| Publishing doesn't refresh the site                            | `REVALIDATE_URL` and `REVALIDATE_SECRET` on Render; the CMS log line "Site revalidation failed" gives the HTTP status |
| Forms say "something went wrong"                               | `LEAD_INTAKE_TOKEN` identical on both sides; Vercel function logs for "Lead submission failed"                        |
| Admin answers 404                                              | You're on the `onrender.com` address: the admin only answers at `ADMIN_URL`                                           |
| Vercel build uses the wrong pnpm                               | `ENABLE_EXPERIMENTAL_COREPACK=1` is missing (the build log names the pnpm version)                                    |
