# Website

The Z-GATE corporate website. It presents the four divisions and the Academy catalog, collects contact and waitlist requests, and sends learners to the e-learning platform. It is one full-stack deployable with its own database (ADR-007).

| Folder | Package          | What it is                                                                                   |
| ------ | ---------------- | -------------------------------------------------------------------------------------------- |
| `app/` | `@zgate/website` | Next.js 16 with Payload CMS 3 embedded: public pages, content admin, lead inbox, staff login |

## Run it

```bash
cp website/.env.example website/app/.env
docker compose -f infra/compose/base.yml -f infra/compose/website.yml up
# -> http://localhost:3002 (CMS at /admin)
```

Or on the host, with a Postgres you provide in `DATABASE_URL`:

```bash
pnpm --filter @zgate/website migrate
pnpm --filter @zgate/website seed      # approved copy; never overwrites CMS edits
pnpm --filter @zgate/website dev
```

## Boundaries

- Imports only from `shared/`. Never from `elearning/` or `legacy/` (`pnpm lint:boundaries`).
- Its own database (`zgate_website`) and DB user. It never reads the e-learning database; integration with the LMS goes through `@zgate/contracts`.
- CI: `.github/workflows/website.yml`, triggered by changes under `website/`, `shared/` or root config.
- Image: `docker build -f website/app/Dockerfile .` (repository root as context). The `migrate` target builds the one-shot migration image.

## More

- Working on it day to day: `docs/DEVELOPER_GUIDE.md` (section "Website").
- Deploying: `docs/runbooks/WEBSITE_DEPLOY.md`.
- Design and scope: `docs/platform-v2/04-WEBSITE.md`.
