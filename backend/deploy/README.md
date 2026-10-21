# Hosting the CMS (`backend/deploy/`)

Everything the CMS host needs, and nothing the public site's host needs. Step by step: [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md), part B.

| File                   | Copy to (on the CMS host)        | What it is                                                                   |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `compose.yml`          | stays here                       | Caddy + the CMS container + the one-off `website-migrate` job                |
| `Caddyfile`            | stays here                       | TLS for `cms.`; `/api/*` for the public site, everything else office-IP only |
| `edge.env.example`     | `/etc/zgate/edge.env`            | Caddy's host name, IP allowlists, ACME email                                 |
| `backend.env.example`  | `/etc/zgate/website-backend.env` | The CMS's runtime settings and the three shared secrets                      |
| `migrate.env.example`  | `/etc/zgate/website-migrate.env` | The database owner URL, for migrations only                                  |

The image builds from `backend/` alone (`docker build --target prod backend`), so a container platform can also build or run it without this folder: it then needs the variables in `backend.env.example`, a persistent volume at `/data/media`, its own TLS, and `python manage.py migrate --noinput` run before each release.
