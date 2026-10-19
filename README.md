# Z-GATE Website

The Z-GATE LTD corporate website ("Where Business Meets Technology"). It presents the four divisions (Advisory, Academy, Tech, Data) and the Academy catalog, collects contact and waitlist requests, and sends learners to the e-learning platform, which is a **separate product in its own repository**. It has its own database and runs as two apps:

| Folder      | Package                   | What it is                                                                                                 |
| ----------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `frontend/` | `@zgate/website-frontend` | Next.js 16 public site (`www.`, port 3002). Reads published content over the CMS's REST API; no database   |
| `backend/`  | `@zgate/website-backend`  | Payload CMS 3, headless (`cms.`, port 3004): content admin, REST API, lead intake, lead inbox, staff login |

How they talk (server to server only; the browser never calls the CMS):

- **Content:** the frontend reads published documents anonymously from the CMS's REST API (`frontend/src/lib/cms.ts`).
- **Forms:** the frontend's server action applies the honeypot and rate limits, then posts the submission to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN`. The CMS re-validates, stores the lead and notifies staff.
- **Cache:** on publish, the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to the frontend's `/api/revalidate`, which marks every page stale.
- **Code:** the frontend never imports `backend/`. It uses `@zgate/cms-contracts` (content types, schemas, webhook signing), and `pnpm lint:boundaries` keeps Payload's runtime out of it.

**This repository is self-contained**: one pnpm workspace with its own lockfile, presets (`config/`), database, deploy files, documentation and CI. It was split out of the z-gate monorepo on 2026-10-19 with its history (`docs/architecture/ADR/ADR-010-separate-repositories.md`).

## Layout

| Folder                        | What it holds                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `packages/website-contracts/` | `@zgate/website-contracts`: the lead form, lead intake and lead/waitlist webhook schemas other products rely on                    |
| `packages/brand-ui/`          | `@zgate/brand-ui`: brand tokens (and later components); the e-learning platform uses a snapshot of it                              |
| `packages/cms-contracts/`     | `@zgate/cms-contracts`, website-only: what the frontend may use from the CMS (content types, division slugs, revalidation webhook) |
| `config/`                     | `@zgate/config`: TypeScript, ESLint and Prettier presets and the schema-compatibility check                                        |
| `tests/contracts/`            | `@zgate/website-contract-tests`: proves the website works with the e-learning platform's contract                                  |
| `vendor/`                     | A checksummed snapshot of that contract (`@zgate/elearning-contracts`). Never edited by hand (`vendor/README.md`)                  |
| `database/`                   | Roles SQL (migration owner + least-privilege app role), Postgres configs, `backup.sh` / `restore.sh`                               |
| `deploy/`                     | `compose.yml` (local; apps behind profile `full`), `compose.prod.yml` (production stack), `edge/` (Caddy, for the website), `env/` |
| `docs/`                       | Scope (`04-WEBSITE.md`), deploy runbook (`WEBSITE_DEPLOY.md`), developer guides, ADRs, the platform-v2 plan, marketing and design  |
| `scripts/`                    | `dev.mjs`, `migrate.mjs`, `sync-contracts.mjs`, `dev.Dockerfile` (the development image Compose uses)                              |

## Run it (hybrid mode: Postgres in Docker, apps native)

```bash
corepack enable                                   # once; the pnpm version comes from package.json
pnpm install
docker compose -f deploy/compose.yml up -d        # Postgres on localhost:5432
cp deploy/env/dev.env.example backend/.env
cp deploy/env/dev.env.example frontend/.env
pnpm db:migrate                                   # as the owner role
pnpm --filter @zgate/website-backend seed         # approved copy; never overwrites CMS edits
pnpm dev                                          # CMS http://localhost:3004/admin, site http://localhost:3002
```

Everything in containers instead: `docker compose -f deploy/compose.yml --profile full up`. On the first page load after starting, the CMS may still be compiling; reload if you get a 500.

**On an 8 GB machine**, read `docs/DEVELOPMENT_LOW_MEMORY.md` first. This repository already applies it: hybrid mode by default, a 1.5 GB Node heap ceiling (`.npmrc`), two test workers, ESLint and TypeScript caches, memory caps in Compose, and VS Code watcher limits (`.vscode/settings.json`).

Checks, one package at a time: `pnpm lint:boundaries`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Full orientation: `docs/DEVELOPER_GUIDE.md`.

## Contracts

The website and the e-learning platform live in separate repositories and never import each other's apps. Each **provider owns** its contract package; the other product checks itself against a **snapshot** of it:

| Contract                              | Owned by   | Package                      | Checked by                                                                |
| ------------------------------------- | ---------- | ---------------------------- | ------------------------------------------------------------------------- |
| Lead/waitlist webhook, lead form      | website    | `@zgate/website-contracts`   | e-learning repository, `tests/contracts` (against its `vendor/`)          |
| Brand tokens and components           | website    | `@zgate/brand-ui`            | e-learning repository, `tests/contracts` (against its `vendor/`)          |
| Catalog API (`/api/v1`), enroll links | e-learning | `@zgate/elearning-contracts` | this repository, `tests/contracts` (against `vendor/elearning-contracts`) |

Breaking changes fail before they reach the other product:

1. **Schema compatibility in the provider.** `packages/website-contracts/compat/` fails when a schema other products rely on removes or renames a field or narrows a type, compared with the agreed baseline. The e-learning repository does the same for its contract, plus `oasdiff breaking` on `/api/v1`.
2. **Consumer tests on every snapshot update.** A provider change reaches the consumer only through `node scripts/sync-contracts.mjs --from <other checkout>`, in a pull request in the consumer's repository, where its contract tests run against it. CI rejects a hand-edited `vendor/` (`--check`).
3. **Customer journey on staging** and **production synthetic checks**: the e-learning repository's `journey.yml` and `synthetic.yml` (tests in its `e2e/journeys`), which drive both products together. They gate website releases again once course buttons link to the platform (see "Releases").

**Changing a contract this repository owns:** additive changes only (see `packages/website-contracts/README.md`). Once merged, open a pull request in the e-learning repository that syncs the new snapshot, so its contract tests run against it.

## Releases

The website is developed first; the e-learning platform is parked until later, and course pages collect a **waitlist** (CMS: Site settings > Academy > Enrollment mode). While that is so, the release gate is (`docs/architecture/ADR/ADR-011-website-release-gate.md`):

- this repository's CI green for the commit, including "Website / Browser checks"; and
- the **website smoke check** passed on staging with that commit deployed (`docs/WEBSITE_DEPLOY.md` §4).

**The full customer-journey gate returns the day the enrollment mode is switched to the e-learning platform on staging** (e-learning repository, Actions, "Customer journey"); it must pass there before the same switch in production. Only an admin can make that switch. Staging doesn't exist yet (hosting decision pending, ADR-004). Runbook: `docs/WEBSITE_DEPLOY.md`.

## Boundaries

- `frontend/` never imports `backend/`; `backend/` never imports `frontend/`; `packages/*` and `config/` never import an app; `@zgate/website-contracts` imports no other workspace package. Only `tests/contracts` uses the e-learning platform, and only `@zgate/elearning-contracts`. Enforced by `pnpm lint:boundaries` in CI.
- Its own Postgres and database (`zgate_website`), roles, volume, env files and edge proxy. Nothing is shared with the e-learning platform.
- Images, built with the repository root as the context: `docker build -f frontend/Dockerfile .` and `docker build -f backend/Dockerfile --target prod .` (the `migrate` target builds the one-shot migration image). CI publishes them as `ghcr.io/<owner>/z-gate-website-{frontend,backend,migrate}`.

## More

- Deploying: `docs/WEBSITE_DEPLOY.md`. Security: `docs/SECURITY_GUIDE.md`, `docs/platform-v2/05-SECURITY-COMPLIANCE.md`.
- Scope: `docs/04-WEBSITE.md`; plan and decisions: `docs/platform-v2/README.md`, `docs/architecture/ADR/`; roadmap: `docs/ROADMAP.md`.
- Marketing and design: `docs/marketing/`, `docs/design/`.
- v1 was never deployed to production; its open release blockers are tracked in the e-learning repository (`docs/HANDOVER.md`), which inherited the v1 API and portal.
