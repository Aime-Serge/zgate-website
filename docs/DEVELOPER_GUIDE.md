# Z-GATE Website — Developer Guide

**Orientation for a new engineer's first day.** Architecture and plans for the current re-platform live in `docs/platform-v2/`; read its `README.md` first. The product split is recorded in `docs/architecture/ADR/ADR-007-separate-product-backends.md`, the self-contained products in `ADR-008-self-contained-products.md`, the independent workspaces in `ADR-009-independent-workspaces.md`, and this repository's split from the e-learning platform in `ADR-010-separate-repositories.md`. On an 8 GB machine, read `docs/DEVELOPMENT_LOW_MEMORY.md` too.

## Repository layout (one pnpm workspace)

```text
package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .npmrc, .dependency-cruiser.cjs
frontend/              Next.js public site: reads content from the CMS over REST, no database
backend/               Payload CMS (headless): admin, REST API, lead intake; migrations in src/migrations
packages/              website-contracts (lead webhook schemas), brand-ui (tokens), cms-contracts (website-only)
config/                TypeScript/ESLint/Prettier presets + schema-compatibility check
tests/contracts/       proves the website works with e-learning's contract
vendor/                checksummed snapshot of that contract (scripts/sync-contracts.mjs; never edited by hand)
database/              roles SQL, Postgres configs (prod + small dev), backup.sh / restore.sh
deploy/                compose.yml (dev: Postgres; apps under --profile full), compose.prod.yml, edge/ (Caddy), env/
docs/                  scope, deploy runbook, guides, ADRs, platform-v2 plan, marketing, design, business, product, UX
scripts/               dev/migrate helpers, contract snapshot sync, dev image
.github/workflows/     website.yml (verify, browser checks, images), repository.yml (secrets scan)
```

The e-learning platform (API, LMS frontend, worker, the frozen v1 ops portal, the customer-journey tests and the v1 platform documentation) is a **separate repository**.

Documents written before 2026-10-19 use the monorepo's paths: read `website/X` as `X` here, and `elearning/X` or `legacy/ops` as the e-learning repository (ADR-010 §7). Older documents use older paths still: `backend/` and `frontend/` (v1), then `apps/website` (briefly `website/app`), which became `frontend/` + `backend/` here; `shared/ui` became `packages/brand-ui`, `platform/edge` became `deploy/edge`, `platform/scripts` became `scripts/`. The monorepo's last state is its tag `monorepo-final`.

## Boundaries (enforced)

- `frontend/` never imports `backend/`; it uses `@zgate/cms-contracts` instead of the CMS's source and never loads Payload at runtime. `backend/` never imports `frontend/`. `packages/*` and `config/` never import an app; `@zgate/website-contracts` imports no other workspace package.
- The e-learning platform is used **only** by `tests/contracts`, and only through `@zgate/elearning-contracts` (the snapshot in `vendor/`).

`pnpm lint:boundaries` (dependency-cruiser, `.dependency-cruiser.cjs`) checks this, and CI runs it.

## Get running

**Requirements:** Node.js 22.12 or later and corepack (bundled with Node). pnpm itself is pinned by `package.json` (`packageManager`), so don't install it globally. Run `corepack enable` once, or prefix commands with `corepack pnpm`.

**Hybrid mode (the default, and the one for small machines):** Postgres runs in Docker; the apps run natively.

```bash
pnpm install
docker compose -f deploy/compose.yml up -d          # Postgres on localhost:5432
cp deploy/env/dev.env.example backend/.env
cp deploy/env/dev.env.example frontend/.env
pnpm db:migrate                    # as the owner role (DATABASE_MIGRATION_URL)
pnpm --filter @zgate/website-backend seed   # once: the approved copy
pnpm dev                           # CMS http://localhost:3004/admin, site http://localhost:3002
```

- The apps connect as the database's least-privilege app role; `pnpm db:migrate` swaps in the owner role from `DATABASE_MIGRATION_URL` (`scripts/migrate.mjs`). Roles, configs and backups: `database/README.md`.
- **Everything in containers (heavier):** `docker compose -f deploy/compose.yml --profile full up`. Containers have memory caps (Postgres 256m, Node services 512m, Next.js apps 1g).
- The e-learning platform's Postgres uses port 5433, so both products can run on one machine; on 8 GB, run one at a time.

## The website (`frontend/` + `backend/`)

Two apps (ADR-007, second amendment): the **public site** (`frontend/`, `@zgate/website-frontend`, port 3002) and the **CMS** (`backend/`, `@zgate/website-backend`, Payload, port 3004). Only the CMS touches the database. Copy `deploy/env/dev.env.example` to both `backend/.env` and `frontend/.env`; each app reads only its own variables, and the two shared secrets must match.

| Task | Command (`pnpm --filter @zgate/website-backend …`) |
|---|---|
| Apply migrations | `migrate` |
| Load the approved copy (only creates missing items, never overwrites CMS edits) | `seed` |
| After changing a collection, block or global | `generate:types`, then `migrate:create <name>`, then commit the new files in `src/migrations/` |
| After adding a custom admin component | `generate:importmap` |

- **The schema never auto-syncs** (`push: false`). Every change goes through a reviewed migration file, so dev and production can't drift.
- **Roles:** `editor` saves drafts only; `publisher` can publish and work leads; `admin` has everything plus users and the audit log. The first account is created at `/admin`.
- **How the apps talk** (server to server; the browser never calls the CMS):
  - Content: the frontend reads published documents anonymously over the CMS's REST API (`frontend/src/lib/cms.ts`). It holds no CMS or database credentials.
  - Forms: the frontend posts submissions to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN` (`backend/src/endpoints/leadIntake.ts`).
  - Cache: on publish the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to `frontend/src/app/api/revalidate` (`backend/src/hooks/revalidate.ts`).
  - Shared types and schemas live in `packages/cms-contracts` (content types, webhook signing) and `packages/website-contracts` (lead form and webhook); the frontend never imports the CMS itself.
- **Rendering:** no public page is built at `next build`, so neither image needs the CMS or a database at build time. Pages render on first visit, stay cached, and refresh automatically when content is published (the webhook above).
- **Leads** can't be created over the REST API (only through token-guarded lead intake), and every staff read is audit-logged.
- **Forms (contact, course waitlist)** submit through one server action (`frontend/src/app/(site)/actions.ts`) and work without JavaScript. **They don't appear until a privacy notice page (slug `privacy`) is published.** Until then, pages show phone, WhatsApp and email instead, so no personal data is collected without a notice.
- **Form rate limiting** trusts `X-Forwarded-For` only as far as `TRUSTED_PROXIES` allows (default 1, meaning behind Caddy). Set it to match the real proxy chain, or visitors can spoof their address.
- **Two hostnames in production, one per app.** The public site (`SITE_URL`, e.g. `www.`) has no `/admin` or CMS API at all. The CMS (`ADMIN_URL`, e.g. `cms.`) serves only `/admin`, `/api` and its own `robots.txt` (`backend/src/lib/hosts.ts`). This keeps the CMS login cookie away from the public pages' origin.
- **Browser checks** (`pnpm --filter @zgate/website-frontend e2e`, Playwright) cover WCAG A/AA via axe, CSP and public/CMS separation, the forms through lead intake, and a JavaScript weight budget. They need both production builds running (`build`, then `start`, in each package) plus `DATABASE_URL`, and `E2E_ADMIN_URL=http://localhost:3004`. Run `pnpm --filter @zgate/website-frontend exec playwright install chromium` once beforehand.
- **Deploying:** see `docs/WEBSITE_DEPLOY.md`.
- **All public URLs go through `frontend/src/app/(site)/[[...slug]]`** (router: `frontend/src/lib/routes.ts`). Don't add plain routes such as `app/(site)/foo/page.tsx` for CMS content: Next would prerender them at build time, and the build would need the CMS.

## Styling the public site (Tailwind CSS v4)

The public site (`frontend/`) is styled only with Tailwind utility classes. There is no component CSS.

- **Tokens:** `frontend/src/app/(site)/globals.css` is Tailwind's entry. Its `@theme` holds the brand tokens (colours, radii, the extra `xs`/`nav`/`wide` breakpoints), which become utilities such as `bg-ink`, `text-paper-dim` and `border-line`. The base layer only sets heading type, the focus ring and reduced motion. Don't add component CSS there.
- **Shared class strings:** `frontend/src/components/ui/styles.ts` (buttons, container, section, eyebrow, hero, panel …) and `cx()` to join them.
- **Division colour:** `tone("advisory")` from `components/ui/tone.ts` on a wrapper sets `--accent` / `--glow`; inside it use `text-accent`, `bg-accent`, `border-accent`, `bg-glow`.
- **Two rules:**
  - Write every class out in full, never `` `text-${x}` ``: Tailwind only generates classes it finds in the source.
  - Never put two utilities for the same property on one element (e.g. `justify-center` and `justify-between`): Tailwind's CSS order decides, not the class order. Add a complete variant in `styles.ts` instead.
- **Breakpoints:** Tailwind's `sm` 640, `md` 768, `lg` 1024, plus `xs` 480, `nav` 900 (the menu collapses below it) and `wide` 1080. Avoid arbitrary `min-[…px]:` variants. Tailwind orders them before the named breakpoints, so `md:` would override them.

## Contracts with the e-learning platform

- **What the website owns:** `@zgate/website-contracts` (lead form, lead intake, lead/waitlist webhook) and `@zgate/brand-ui`. Additive changes only; `packages/website-contracts/compat/` fails on a removed or renamed field or a narrowed type. After a change merges, open a pull request in the e-learning repository that runs `node scripts/sync-contracts.mjs --from <website checkout>` there, so its contract tests check the new version.
- **What the website consumes:** `@zgate/elearning-contracts` (catalog API, enroll links), from `vendor/elearning-contracts`. To update it: `node scripts/sync-contracts.mjs --from <e-learning checkout>`, `pnpm install`, `pnpm --filter @zgate/website-contract-tests test`, then commit `vendor/` in one pull request.
- `node scripts/sync-contracts.mjs --check` (run by CI) fails if `vendor/` was edited by hand.

## Commands

| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | Runs the task in every package, one at a time |
| `pnpm lint:boundaries` | Checks the import boundaries above |
| `pnpm dev` | Starts the CMS and the public site |
| `pnpm db:migrate` | Migrates the database as its owner role (local) |
| `pnpm --filter <pkg> <script>` | Runs one package's script |
| `pnpm format` / `pnpm format:write` | Prettier check / fix (rules: `config/prettier.json`) |
| `node scripts/sync-contracts.mjs --check` / `--from <path>` | Verifies / updates the e-learning contract snapshot |

**Run lint, typecheck, test and build before every commit.** CI runs exactly these.

## Dependencies and supply chain

- `pnpm-workspace.yaml` refuses any package version published less than **14 days** ago (`minimumReleaseAge`). Security fixes may be exempted (`minimumReleaseAgeExclude`), each with a dated comment and removed once the version is old enough.
- Transitive security fixes the direct dependency hasn't picked up go in `overrides`, each with its reason and removal condition.
- Install scripts only run for packages listed in `onlyBuiltDependencies`.
- Unfixable advisories are accepted explicitly under `auditConfig.ignoreGhsas`, with a reason. CI fails on any other high or critical advisory.

## Conventions that actually matter here

- **One focused commit per concern.** A security fix, a doc and a refactor touching the same area still get separate commits.
- **No fabrication, anywhere.** No invented metric, testimonial or claim, and no silent "TODO". If something can't be done or verified, say so in the code comment or commit message.
- **Comments explain *why*, not *what*.**
- **Never a raw stack trace or database error to a visitor.** Log it server-side; show a plain message.
- **Every staff read or write of Confidential data is audit-logged** (`backend/src/hooks/audit.ts`; classification in `docs/architecture/DATA_ARCHITECTURE.md`).

## Testing

Vitest everywhere. The CMS's integration tests need `DATABASE_URL` and `PAYLOAD_SECRET`: they skip locally without a database and run for real in CI against Postgres. On a cold or busy machine, running every package's tests in parallel can hit Vitest's 5 s timeout; the workspace scripts already run one package at a time, and CI is the authoritative signal.

## Containers

Production Dockerfiles build with **the repository root as the context**: `docker build -f frontend/Dockerfile .`, `docker build -f backend/Dockerfile --target prod .` (and `--target migrate` for the migration image). Neither takes build arguments: they read everything at runtime. CI builds and Trivy-scans every image on every pull request, and pushes `ghcr.io/<owner>/z-gate-website-*` only from `main`.

## Before you touch production-adjacent code

Read `docs/SECURITY_GUIDE.md` and `docs/platform-v2/05-SECURITY-COMPLIANCE.md` for what is still open.
