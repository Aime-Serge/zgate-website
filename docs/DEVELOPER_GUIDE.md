# Developer Guide

Your first day on the website's code. What the site must do for visitors: [WEBSITE.md](WEBSITE.md). Why it's built this way: [adr/](adr/).

## Layout

```text
frontend/            public site: Next.js 16 + Tailwind CSS v4 (www., port 3002). No database
  deploy/            its host: compose.yml, Caddyfile, env templates
backend/             CMS: Django 5.2 + Wagtail 8, headless (cms., port 3004). See backend/README.md
  deploy/            its host: compose.yml, Caddyfile, env templates
  database/          Postgres roles, configs, backup.sh / restore.sh
packages/
  cms-contracts/     what the frontend may use from the CMS: content types, slugs, webhook signing
  website-contracts/ the lead form and lead intake schemas; also a contract the e-learning platform relies on
config/              Prettier, TypeScript and ESLint presets; schema-compatibility check
tests/contracts/     proves the website works with the e-learning platform's contract
vendor/              checksummed snapshot of that contract (never edited by hand)
compose.yml          local development only (Postgres; --profile full for everything)
scripts/             dev, migrate, contract-sync helpers; the local dev image
docs/                this guide, WEBSITE, CONTENT_GUIDE, SECURITY, DEPLOYMENT, adr/
```

The e-learning platform (courses, enrollment, certificates) is a **separate repository** ([ADR-010](adr/ADR-010-separate-repositories.md)). This repository only links to it.

**Boundaries, checked by `pnpm lint:boundaries` in CI:** `frontend/` never imports `backend/` (it's Python, reached over HTTP); `packages/*` and `config/` never import an app; `@zgate/website-contracts` imports no other workspace package; only `tests/contracts` touches the e-learning contract.

## Get running

Needs Node.js ≥ 22.12 (pnpm comes from `packageManager` through corepack: run `corepack enable` once), Python 3.14 and Docker.

```bash
pnpm install
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements/development.txt   # bin/python on Linux/macOS
docker compose up -d                                # Postgres only, on 127.0.0.1:5432
cp backend/.env.example backend/.env                # set DJANGO_SECRET_KEY
cp frontend/.env.example frontend/.env
pnpm db:migrate                                     # as the database owner role
(cd backend && .venv/Scripts/python manage.py seed_content)      # the approved copy, once
(cd backend && .venv/Scripts/python manage.py createsuperuser)   # your admin login
pnpm dev                                            # CMS http://localhost:3004/admin, site http://localhost:3002
```

- The apps connect as the least-privilege app role; `pnpm db:migrate` swaps in the owner role from `DATABASE_MIGRATION_URL`.
- Everything in containers instead (heavier): `docker compose --profile full up`.
- The three shared secrets (`CMS_API_TOKEN`, `LEAD_INTAKE_TOKEN`, `REVALIDATE_SECRET`) must match in both `.env` files. A `.env` made before 2026-10-21 has no `CMS_API_TOKEN`: add it to both, or to neither (the CMS then serves its API without one).
- First page after a cold start may return a 500 while the CMS warms up. Reload once http://localhost:3004/api/ready answers.

## How the two apps work together

Server to server only; the browser never calls the CMS. In production the two apps run on separate hosts and these calls go over HTTPS ([ADR-013](adr/ADR-013-independent-hosting.md)), so **a change to one side must keep working with the other side's current release**: the order rules are in [DEPLOYMENT.md](DEPLOYMENT.md) §4.

| Flow    | How                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content | The frontend reads **published** content from the CMS's JSON API (`frontend/src/lib/cms.ts` → `backend/content/views.py`) with the read token `CMS_API_TOKEN`. It holds no CMS login or database credentials                               |
| Forms   | One server action (`frontend/src/app/(site)/actions.ts`) checks the honeypot, rate limits and schema, then posts to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN` (`backend/leads/views.py`), which validates again and stores the lead |
| Cache   | Pages render on first visit and stay cached. On publish, the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to `/api/revalidate`, which marks every page stale                                                                     |
| Types   | `@zgate/cms-contracts` mirrors the API's JSON shapes. Rename a field in `backend/content/serializers.py` and in `packages/cms-contracts/src/content-types.ts` together; the frontend typecheck shows every use                             |

**Every public URL goes through `frontend/src/app/(site)/[[...slug]]`** (router: `frontend/src/lib/routes.ts`). Besides pages, divisions, courses and articles, it routes `/solutions/<slug>` (pages of type "solution", which have no other address) and `/search`. A new top-level route needs its slug added to `RESERVED_PAGE_SLUGS` in `backend/content/validators.py`, so no CMS page can take it. Don't add plain routes like `app/(site)/foo/page.tsx` for content: Next.js would prerender them at build time, and the build would then need the CMS.

**Forms appear only once a privacy notice (page slug `privacy`) is published.** Until then visitors see WhatsApp, phone and email.

## Changing things

| Task                  | Where                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A page's text         | The CMS, not code ([CONTENT_GUIDE.md](CONTENT_GUIDE.md)). `backend/content/seed/` only fills an empty CMS                                                                                                                                                          |
| A new content block   | `backend/content/blocks.py` (+ `PAGE_BLOCKS`), its serializer, its type in `content-types.ts`, its renderer in `frontend/src/components/blocks/RenderBlocks.tsx`                                                                                                   |
| A model               | `backend/<app>/models.py`, then `python manage.py makemigrations` and commit the migration. CI fails on a model change without one                                                                                                                                 |
| Lead form fields      | `packages/website-contracts/src/leads/schema.ts` **and** `backend/leads/forms.py` (same rules, same messages). A new field fixed at submission also goes in `IMMUTABLE_FIELDS` and the trigger (`backend/database/README.md`, "What the database itself enforces") |
| A rule data must keep | Validate it in the form or `clean()` for the message, **and** as a `Meta.constraints` entry so the database keeps it whatever writes. Add a test that writes around the model                                                                                      |
| Security headers      | `frontend/src/lib/security.ts` (CSP), `frontend/next.config.ts` (the rest), `backend/config/middleware.py` (CMS)                                                                                                                                                   |

## Styling (Tailwind CSS v4)

The public site is styled only with Tailwind utility classes; there is no component CSS.

- **Tokens:** `frontend/src/app/(site)/globals.css` holds the brand tokens in `@theme` (colours, radii, the `xs` 480 / `nav` 900 / `wide` 1080 breakpoints), which become utilities such as `bg-ink`, `text-paper-dim`, `border-line`. The base layer only sets heading type, the focus ring and reduced motion.
- **Type scale** (`globals.css`): headings and figures use the fluid steps `text-display` (hero h1, 36→56px), `text-headline` (division/course h1, 32→48px), `text-title` (section h2, 28→40px), `text-subtitle` (large h3, 22→28px), `text-figure` / `text-figure-lg` and `text-lede` (intro paragraphs). Everything else uses Tailwind's standard steps: `text-base` (16px) for body copy, `text-sm` (14px) for supporting copy and controls, `text-xs` (12px) for mono labels, nothing smaller. Form fields stay at 16px at least (iOS zooms into smaller ones). Don't add one-off `text-[clamp(…)]` or `text-[…rem]` sizes.
- **Shared class strings:** `frontend/src/components/ui/styles.ts`, joined with `cx()`.
- **Division colour:** `tone("advisory")` (`components/ui/tone.ts`) on a wrapper sets `--accent` / `--glow`; inside it, use `text-accent`, `bg-accent`, `border-accent`.
- **Rules:** write every class in full (never `` `text-${x}` ``, which Tailwind can't find); never put two utilities for the same property on one element (CSS order wins, not class order: add a complete variant to `styles.ts`, or write the string out in full); avoid arbitrary `min-[…px]:` breakpoints.
- **Design language:** pill buttons, `rounded-2xl` cards (`card`, `cardLink`), mono chips, an indigo band (`band`, `bg-ink-3`) for figures and pillars, and inline SVG icons from `components/ui/icons.tsx` (no icon font or library).

## Interactive components

Each one works without JavaScript and needs no extra request:

| Component                                       | Where                                                                                                                                     | Without JavaScript                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `MegaNav` (`components/site/MegaNav.tsx`)       | Header: Services, Solutions, Academy and Company panels, the search panel; the phone drawer                                               | Triggers are plain links (`data-no-js-only`); the phone menu stays open             |
| `Tabs` (`components/ui/Tabs.tsx`)               | Services console, "who we work with"                                                                                                      | Every panel shows under its own label                                               |
| `Marquee` (`components/ui/Marquee.tsx`)         | "Situations we handle": a looping row with no scrollbar or controls that pauses on hover; pure CSS (`globals.css`), no JavaScript         | Moves the same (CSS only). With reduced motion: all cards, still, wrapped into rows |
| `SiteSearch` (`components/site/SiteSearch.tsx`) | `/search`: filters the index (`lib/search.ts`) as the visitor types                                                                       | The form submits; the page lists everything on the site                             |
| `Assistant` (`components/site/Assistant.tsx`)   | The round button and chat panel; asks `POST /api/assistant` (guided answers, or Claude when `ANTHROPIC_API_KEY` is set: docs/SECURITY.md) | Hidden (it needs a script); the contact pills and bottom bar remain                 |

An inline script in `app/(site)/layout.tsx` sets `class="js"` on `<html>` before first paint. The fallbacks in `globals.css` key off it, so the scripted layout never jumps on hydration. Homepage sections live one per file in `components/blocks/`; `RenderBlocks.tsx` dispatches to them.

**Keep pages cached:** don't read `searchParams` or headers in a page; it makes every visit render on the server. Read the address in the browser instead, as `LeadForm` does for `?service=` and `SiteSearch` for `?q=`.

**Structured data** comes from `lib/structuredData.ts` through `components/site/JsonLd.tsx` (which escapes `<`). Use only facts Site settings already publish: no ratings, reviews or opening hours.

## Checks

| Command                                                     | What it does                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` | Each task in every package, one at a time                                                                                                                                                                                                                                                   |
| `pnpm lint:boundaries`                                      | The import boundaries above                                                                                                                                                                                                                                                                 |
| `pnpm format` / `pnpm format:write`                         | Prettier check / fix (the CMS uses ruff instead)                                                                                                                                                                                                                                            |
| `cd backend && pytest`                                      | CMS tests: in-memory SQLite locally, Postgres in CI                                                                                                                                                                                                                                         |
| `cd backend && ruff check . && ruff format --check .`       | CMS lint and format                                                                                                                                                                                                                                                                         |
| `pnpm --filter @zgate/website-frontend e2e`                 | Browser checks: accessibility (axe), headers and CSP, the forms end to end, the JavaScript budget. Needs both apps' production builds running, `DATABASE_URL` and `E2E_ADMIN_URL=http://localhost:3004`. First run `pnpm --filter @zgate/website-frontend exec playwright install chromium` |

**Run lint, typecheck, test and build before every commit.** CI runs exactly these, plus the browser checks and image scans.

## Contracts with the e-learning platform

- **We provide** `@zgate/website-contracts`. Additive changes only: `packages/website-contracts/compat/` fails on a removed or renamed field or a narrowed type. After a change merges, the e-learning repository syncs its snapshot (`node scripts/sync-contracts.mjs --from <website checkout>`) so its tests run against it.
- **We consume** `@zgate/elearning-contracts` (catalog API, enroll links) from `vendor/`. Update it with `node scripts/sync-contracts.mjs --from <e-learning checkout>`, then `pnpm install` and `pnpm --filter @zgate/website-contract-tests test`, in one pull request. CI's `--check` fails on a hand-edited `vendor/`.

## Dependencies

No version younger than 14 days is ever installed (pnpm `minimumReleaseAge`; pip `--uploaded-prior-to=P14D` in `backend/scripts/lock.sh`). Forced transitive fixes (`overrides`) and accepted advisories (`auditConfig.ignoreGhsas`) each carry a reason and a removal condition. Details: [SECURITY.md](SECURITY.md).

## Conventions

- **No fabrication, anywhere:** no invented metric, testimonial or claim in content, code comments or commit messages.
- **Comments explain why, not what.**
- **Never show a visitor a stack trace or database error.** Log it on the server; show a plain message and the phone number.
- **Every staff read or change of a lead is audit-logged** (`backend/audit/`). Keep it that way when adding admin screens.
- **One focused commit per concern.**

## Low-memory machines (8 GB)

The repository is already tuned for small laptops: Postgres-only Docker by default (hybrid mode), a 1.5 GB Node heap ceiling (`.npmrc`, local only), two test workers (`vitest.config.ts`, local only), one package at a time in workspace scripts, ESLint and TypeScript caches, memory caps in Compose (`--profile full`), and VS Code watcher exclusions (`.vscode/settings.json`). On top of that, if you can:

- **Keep the repository out of OneDrive** (e.g. `C:\dev\z-gate\website`): syncing `node_modules` and `.next` costs CPU and locks files mid-build.
- **Cap Docker's WSL 2 VM** in `%UserProfile%\.wslconfig` (`[wsl2]`, `memory=2560MB`, `processors=2`, `swap=2GB`), then `wsl --shutdown`.
- **Exclude the project folder (only) from Microsoft Defender** if IT allows it.
- **Work on one product at a time.** The e-learning repository's Postgres uses port 5433, so both can run, but rarely need to.
- **Leftover processes on Windows:** stop dev servers with `Ctrl+C` in their terminal. Otherwise free a port with `netstat -ano | findstr :3002`, then `taskkill /PID <pid> /T /F`.

## Containers and deploying

Images take no build arguments. The frontend builds from the repository root (it uses the workspace's packages): `docker build -f frontend/Dockerfile .`. The CMS builds from its own folder: `docker build --target prod backend`. CI has one workflow per app (`.github/workflows/frontend.yml` and `backend.yml`, path-filtered, both calling `e2e.yml`); each scans its image and pushes `ghcr.io/<owner>/z-gate-website-<app>` from `main` only. Deploying and operating: [DEPLOYMENT.md](DEPLOYMENT.md).
