# Website

The Z-GATE corporate website. It presents the four divisions and the Academy catalog, collects contact and waitlist requests, and sends learners to the e-learning platform (`../elearning`). It has its own database and runs as two apps:

| Folder      | Package                   | What it is                                                                                                 |
| ----------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `frontend/` | `@zgate/website-frontend` | Next.js 16 public site (`www.`, port 3002). Reads published content over the CMS's REST API; no database   |
| `backend/`  | `@zgate/website-backend`  | Payload CMS 3, headless (`cms.`, port 3004): content admin, REST API, lead intake, lead inbox, staff login |

How they talk (server to server only; the browser never calls the CMS):

- **Content:** the frontend reads published documents anonymously from the CMS's REST API (`frontend/src/lib/cms.ts`).
- **Forms:** the frontend's server action applies the honeypot and rate limits, then posts the submission to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN`. The CMS re-validates, stores the lead and notifies staff.
- **Cache:** on publish, the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to the frontend's `/api/revalidate`, which marks every page stale.
- **Code:** the frontend never imports `backend/`. It uses `@zgate/cms-contracts` (content types, schemas, webhook signing), and `pnpm lint:boundaries` keeps Payload's runtime out of it.

**This folder is a self-contained workspace**: its own `package.json`, `pnpm-workspace.yaml`, lockfile, `.npmrc`, presets (`config/`), database, deploy files and CI workflow (`.github/workflows/website.yml`). Nothing joins it to the e-learning workspace; run every command below **inside `website/`**. Cross-product documentation (architecture, ADRs, low-memory development) is in the repository's `docs/`.

## Layout

| Folder                        | What it holds                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/website-contracts/` | `@zgate/website-contracts`: the lead form, lead intake and lead/waitlist webhook schemas other products rely on                      |
| `packages/brand-ui/`          | `@zgate/brand-ui`: brand tokens (and later components); the e-learning platform links it too                                         |
| `packages/cms-contracts/`     | `@zgate/cms-contracts`, website-only: what the frontend may use from the CMS (content types, division slugs, revalidation webhook)   |
| `config/`                     | `@zgate/config`: TypeScript, ESLint and Prettier presets and the schema-compatibility check                                          |
| `database/`                   | Roles SQL (migration owner + least-privilege app role), Postgres configs, `backup.sh` / `restore.sh`                                 |
| `deploy/`                     | `compose.yml` (local; apps behind profile `full`), `compose.prod.yml` (production stack), `edge/` (Caddy, for both products), `env/` |
| `docs/`                       | Design and scope (`04-WEBSITE.md`), deploy runbook (`WEBSITE_DEPLOY.md`)                                                             |
| `scripts/`                    | `dev.mjs`, `migrate.mjs`, `dev.Dockerfile` (the development image Compose uses)                                                      |

## Run it (hybrid mode: Postgres in Docker, apps native)

```bash
cd website
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

**On an 8 GB machine**, read `../docs/DEVELOPMENT_LOW_MEMORY.md` first, and work on one product at a time. This workspace already applies it: hybrid mode by default, a 1.5 GB Node heap ceiling (`.npmrc`), two test workers, ESLint and TypeScript caches, memory caps in Compose, and VS Code watcher limits (`.vscode/settings.json`).

Checks, one package at a time: `pnpm lint:boundaries`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Contracts

The website and the e-learning platform never import each other's apps. Each **provider owns** its contract package; the other product uses it only in its contract tests:

| Contract                              | Owned by   | Package                                                 | Checked by                  |
| ------------------------------------- | ---------- | ------------------------------------------------------- | --------------------------- |
| Lead/waitlist webhook, lead form      | website    | `@zgate/website-contracts`                              | `elearning/tests/contracts` |
| Brand tokens and components           | website    | `@zgate/brand-ui`                                       | `elearning/tests/contracts` |
| Catalog API (`/api/v1`), enroll links | e-learning | `@zgate/elearning-contracts` (`elearning/packages/...`) | `website/tests/contracts`   |

Breaking changes fail before they merge:

1. **Schema compatibility.** `packages/website-contracts/compat/` fails when a schema other products rely on removes or renames a field or narrows a type, compared with the agreed baseline.
2. **Consumer tests in the provider's CI.** A pull request that changes `packages/website-contracts` or `packages/brand-ui` also runs the e-learning platform's `tests/contracts` against it (`website.yml`, job "Consumer contracts").
3. **Customer journey on staging** (`.github/workflows/journey.yml`, tests in `elearning/e2e/journeys`) and **production synthetic checks** (`synthetic.yml`).

## Releases

**No production deploy of the website happens unless the customer-journey workflow (`.github/workflows/journey.yml`) has passed against staging for the version being deployed**, in addition to this workspace's CI. Staging doesn't exist yet (hosting decision pending), so today the journey's unbuilt steps are marked `fixme`, and the website's own browser checks are the gate in CI. Runbook: `docs/WEBSITE_DEPLOY.md`.

## Boundaries

- `frontend/` never imports `backend/`; `backend/` never imports `frontend/`; `packages/*` and `config/` never import an app; `@zgate/website-contracts` imports no other workspace package. Nothing imports `../elearning` except `tests/contracts`, which may use only `@zgate/elearning-contracts`; nothing imports `../legacy`. Enforced by `pnpm lint:boundaries` in CI.
- Its own Postgres and database (`zgate_website`), roles, volume and env files. Nothing is shared with the e-learning platform.
- Images, built with this folder as the context: `docker build -f website/frontend/Dockerfile website` and `docker build -f website/backend/Dockerfile --target prod website` (the `migrate` target builds the one-shot migration image).

## More

- Deploying: `docs/WEBSITE_DEPLOY.md`.
- Design and scope: `docs/04-WEBSITE.md`; architecture and ADRs: `../docs/`.
