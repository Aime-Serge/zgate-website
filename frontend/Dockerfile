# Z-GATE corporate website - the public site (Next.js).
#
# Build context is the REPOSITORY ROOT (its pnpm lockfile and workspace
# manifest live there):
#   docker build -f frontend/Dockerfile -t zgate-website-frontend .
#
# One image for every environment: no build arguments (the site has no
# NEXT_PUBLIC_* values), and neither the CMS nor a database at build time.
# SITE_URL, CMS_URL and the shared secrets are read at runtime
# (src/lib/env.ts).

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
# package.json too: Corepack reads the pinned pnpm from its "packageManager"
# field. Without it, Corepack downloads the newest pnpm instead.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/website-frontend..."
RUN pnpm --filter @zgate/website-frontend run build

# ---- prod: Next.js standalone output ----
FROM node:22-slim AS prod
# Base-image hardening: Debian security updates, and no package managers
# in the image - it runs with `node` only. (Trivy flagged outdated Debian
# packages and the dependencies of the npm that node:22-slim bundles.)
RUN apt-get update \
 && apt-get upgrade -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm \
      /usr/local/bin/pnpx /opt/yarn-v*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/frontend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/frontend/.next/static ./frontend/.next/static
USER zgate
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "frontend/server.js"]
