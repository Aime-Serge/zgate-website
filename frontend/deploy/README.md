# Hosting the public site (`frontend/deploy/`)

Everything the public site's host needs, and nothing the CMS host needs. Step by step: [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md), part C.

| File                   | Copy to (on the frontend host)    | What it is                                                         |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `compose.yml`          | stays here                        | Caddy + the public-site container                                  |
| `Caddyfile`            | stays here                        | TLS for `www.` and the bare-domain redirect; the signed webhook in |
| `edge.env.example`     | `/etc/zgate/edge.env`             | Caddy's host names, the webhook allowlist, ACME email              |
| `frontend.env.example` | `/etc/zgate/website-frontend.env` | The site's runtime settings and the three shared secrets           |

The image builds from the repository root, because the site uses the workspace's packages (`docker build -f frontend/Dockerfile .`). It needs no database and nothing from the CMS at build time. A Node platform can run it instead of this folder: set the variables in `frontend.env.example`, and read "Hosting on a platform" in DEPLOYMENT.md first (rate limiting, the page cache, `TRUSTED_PROXIES` and data residency all change there).
