# Website

The Z-GATE corporate website. It presents the four divisions and the Academy catalog, collects contact and waitlist requests, and sends learners to the e-learning platform. It has its own database (ADR-007) and runs as two apps:

| Folder      | Package                   | What it is                                                                                                 |
| ----------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `frontend/` | `@zgate/website-frontend` | Next.js 16 public site (`www.`, port 3002). Reads published content over the CMS's REST API; no database   |
| `backend/`  | `@zgate/website-backend`  | Payload CMS 3, headless (`cms.`, port 3004): content admin, REST API, lead intake, lead inbox, staff login |

How they talk (server to server only; the browser never calls the CMS):

- **Content:** the frontend reads published documents anonymously from the CMS's REST API (`frontend/src/lib/cms.ts`).
- **Forms:** the frontend's server action applies the honeypot and rate limits, then posts the submission to `POST /api/lead-intake` with `LEAD_INTAKE_TOKEN`. The CMS re-validates, stores the lead and notifies staff.
- **Cache:** on publish, the CMS sends an HMAC-signed webhook (`REVALIDATE_SECRET`) to the frontend's `/api/revalidate`, which marks every page stale.
- **Code:** the frontend may import only `@zgate/website-backend/contracts` (types, schemas, webhook signing). `pnpm lint:boundaries` enforces this and keeps Payload's runtime out of the frontend.

## Run it

```bash
docker compose -f infra/compose/website.yml up
# -> public site http://localhost:3002, CMS http://localhost:3004/admin
```

Or on the host, with a Postgres you provide in `DATABASE_URL`:

```bash
cp website/.env.example website/backend/.env
cp website/.env.example website/frontend/.env
pnpm --filter @zgate/website-backend migrate
pnpm --filter @zgate/website-backend seed   # approved copy; never overwrites CMS edits
pnpm --filter @zgate/website-backend dev    # http://localhost:3004/admin
pnpm --filter @zgate/website-frontend dev   # http://localhost:3002
```

## Boundaries

- Imports only from `shared/`. Never from `elearning/` or `legacy/` (`pnpm lint:boundaries`).
- Its own database (`zgate_website`) and DB user, used by the CMS only. Integration with the LMS goes through `@zgate/contracts`.
- CI: `.github/workflows/website.yml`, triggered by changes under `website/`, `shared/` or root config. Its browser checks run against both apps.
- Images, built from the repository root: `docker build -f website/frontend/Dockerfile .` and `docker build -f website/backend/Dockerfile --target prod .` (the `migrate` target builds the one-shot migration image).

## More

- Working on it day to day: `docs/DEVELOPER_GUIDE.md` (section "Website").
- Deploying: `website/docs/WEBSITE_DEPLOY.md`.
- Design and scope: `website/docs/04-WEBSITE.md`; why two apps: ADR-007, second amendment.
