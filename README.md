# Z-GATE Website

The public website of **Z-GATE LTD** — _Where Business Meets Technology_. It shows business owners in Kigali how Z-GATE's four divisions (Advisory, Academy, Tech, Data) solve their tax, skills, systems and data problems under one roof, and turns a visit into a conversation with a real person: by form, WhatsApp, phone or email. Course pages are the gate to Z-GATE Academy's learning platform, a separate product in its own repository.

What the site is for and the rules it keeps: [docs/WEBSITE.md](docs/WEBSITE.md).

## How it's built

| Folder                         | What it is                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/`                    | The public site: Next.js 16 + Tailwind CSS v4 (`www.`). No database, no logins, no third-party scripts. Its host's files: `frontend/deploy/`                                                    |
| `backend/`                     | The CMS: Django 5.2 + Wagtail 8, headless (`cms.`). Content, lead inbox, audit log ([backend/README.md](backend/README.md)). Its host's files: `backend/deploy/`; database: `backend/database/` |
| `packages/`                    | Typed contracts between the two apps (`cms-contracts`) and with other systems (`website-contracts`)                                                                                             |
| `config/`, `tests/`, `vendor/` | Shared presets; contract tests against the learning platform's snapshot                                                                                                                         |
| `compose.yml`, `scripts/`      | Local development only                                                                                                                                                                          |
| `docs/`                        | [Documentation](docs/README.md)                                                                                                                                                                 |

**Each app runs on its own host and is released on its own** ([ADR-013](docs/adr/ADR-013-independent-hosting.md)). The browser only ever talks to the public site. The public site reads published content from the CMS's API over HTTPS with a read token, hands form submissions to it with another, and refreshes its cached pages within seconds of a publish, when the CMS sends it a signed webhook.

## Run it locally

Needs Node.js ≥ 22.12, Python 3.14 and Docker.

```bash
corepack enable && pnpm install
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements/development.txt   # bin/python on Linux/macOS
docker compose up -d                              # Postgres on 127.0.0.1:5432
cp backend/.env.example backend/.env              # set DJANGO_SECRET_KEY
cp frontend/.env.example frontend/.env
pnpm db:migrate
(cd backend && .venv/Scripts/python manage.py seed_content && .venv/Scripts/python manage.py createsuperuser)
pnpm dev                                          # site http://localhost:3002 · CMS http://localhost:3004/admin
```

Everything else (checks, styling, contracts, small machines): [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Documentation

| Read                                                    | When                                                      |
| ------------------------------------------------------- | --------------------------------------------------------- |
| [WEBSITE.md](docs/WEBSITE.md)                           | What the site does for visitors, its pages and rules      |
| [CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)               | Writing and editing content; the CMS for staff            |
| [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)           | Changing the code                                         |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)                     | Deploying, operating, incidents                           |
| [DEPLOY_VERCEL_RENDER.md](docs/DEPLOY_VERCEL_RENDER.md) | Deploying on Vercel (site) and Render (CMS), step by step |
| [SECURITY.md](docs/SECURITY.md)                         | Security, personal data, launch gates                     |
| [adr/](docs/adr/README.md)                              | Why it's built this way                                   |

## Releasing

Every merge to `main` builds, tests and scans the image of each app it changed (the `Frontend` and `Backend` workflows, both running the browser checks against the other app). An app goes to production only after its CI run is green and the same commit has passed the smoke check on staging ([ADR-011](docs/adr/ADR-011-website-release-gate.md), [ADR-013](docs/adr/ADR-013-independent-hosting.md), [DEPLOYMENT.md](docs/DEPLOYMENT.md)).
