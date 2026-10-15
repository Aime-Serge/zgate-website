# Z-GATE website CMS (Payload CMS, headless, in its Next.js shell).
#
# Build context is the REPOSITORY ROOT:
#   docker build -f website/backend/Dockerfile --target prod    -t zgate-website-backend .
#   docker build -f website/backend/Dockerfile --target migrate -t zgate-website-migrate .
#
# One image for every environment: no build arguments, no database at
# build time. DATABASE_URL, PAYLOAD_SECRET, ADMIN_URL, the shared secrets
# and MEDIA_DIR are read at runtime (src/lib/env.ts).
#
# Deploy order (docs/platform-v2/06-DEVOPS-RELIABILITY.md §3): run the
# `migrate` image as a one-off job, then roll out `prod`.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/website-backend..."
RUN pnpm --filter @zgate/website-backend run build

# ---- migrate: Payload CLI + migration files, run once per deploy ----
FROM build AS migrate
WORKDIR /repo/website/backend
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
USER zgate
# Payload's CLI directly, not `pnpm run`: corepack would try to download
# pnpm into a home directory this unprivileged user doesn't have.
# Seed (first deployment only): override the command with
#   node_modules/.bin/payload run src/seed/run.ts
ENV HOME=/tmp
CMD ["node_modules/.bin/payload", "migrate"]

# ---- prod: Next.js standalone output ----
FROM node:22-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/website/backend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/website/backend/.next/static ./website/backend/.next/static
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

CMD ["node", "website/backend/server.js"]
