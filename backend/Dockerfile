# Z-GATE website CMS (Payload CMS, headless, in its Next.js shell).
#
# Build context is the WEBSITE WORKSPACE ROOT (website/):
#   docker build -f website/backend/Dockerfile --target prod    -t zgate-website-backend website
#   docker build -f website/backend/Dockerfile --target migrate -t zgate-website-migrate website
#
# One image for every environment: no build arguments, no database at
# build time. DATABASE_URL, PAYLOAD_SECRET, ADMIN_URL, the shared secrets
# and MEDIA_DIR are read at runtime (src/lib/env.ts).
#
# Payload runs inside a Next.js app, so the runtime image is Next.js's
# standalone output (traced production dependencies only).
#
# Deploy order (docs/WEBSITE_DEPLOY.md): run the `migrate` image as a
# one-off job, then roll out `prod`.

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
    pnpm install --offline --frozen-lockfile --filter "@zgate/website-backend..."
RUN pnpm --filter @zgate/website-backend run build

# ---- migrate: Payload CLI + migration files, run once per deploy ----
FROM build AS migrate
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
WORKDIR /repo/backend
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
USER zgate
# Payload's CLI directly, not `pnpm run`: corepack would try to download
# pnpm into a home directory this unprivileged user doesn't have.
# Seed (first deployment only): override the command with
#   node_modules/.bin/payload run src/seed/run.ts
ENV HOME=/tmp
HEALTHCHECK NONE
CMD ["node_modules/.bin/payload", "migrate"]

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
COPY --from=build --chown=zgate:zgate /repo/backend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/backend/.next/static ./backend/.next/static
# Uploaded media lives on a mounted volume until object storage (ADR-P7).
RUN mkdir -p /data/media && chown zgate:zgate /data/media
ENV MEDIA_DIR=/data/media
VOLUME ["/data/media"]
USER zgate
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3004/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "backend/server.js"]
