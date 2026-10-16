# Edge proxy (Caddy)

`Caddyfile` routes `www.` (frontend), `cms.` (backend, admin IP allowlist), the bare domain and `learn.` (the e-learning platform), and obtains TLS certificates. `edge.env.example` lists its settings.

**The website owns the edge** for both products. It runs in the website's production stack (`deploy/compose.prod.yml`); its history comes from `platform/edge/`. The e-learning platform has no edge of its own: once deployed, its services are reached by this Caddy over a shared Docker network. A routing change for `learn.` is therefore a change here, reviewed with the e-learning team.

Before the e-learning platform goes live, the `learn.` block needs the e-learning services on a network this stack can reach, and the API must trust exactly one proxy hop (finding N-1). See the comments in `Caddyfile`.
