# Edge proxy (Caddy)

`Caddyfile` routes `www.` (frontend), `cms.` (backend, admin IP allowlist) and the bare domain, and obtains TLS certificates. `edge.env.example` lists its settings. It runs in the website's production stack (`deploy/compose.prod.yml`); its history comes from `platform/edge/`.

**The website's edge serves the website only** (ADR-010). The e-learning platform runs its own edge for `learn.` (e-learning repository, `deploy/edge/`), so each product deploys without the other. The two edges each bind ports 80 and 443, so they run on separate hosts or IP addresses.
