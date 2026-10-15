# Z-GATE corporate website - the public site (Next.js).
#
# Build context is the REPOSITORY ROOT:
#   docker build -f website/frontend/Dockerfile -t zgate-website-frontend .
#
# One image for every environment: no build arguments, and neither the CMS
# nor a database at build time. SITE_URL, CMS_URL and the shared secrets
# are read at runtime (src/lib/env.ts).

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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile --filter "@zgate/website-frontend..."
RUN pnpm --filter @zgate/website-frontend run build

# ---- prod: Next.js standalone output ----
FROM node:22-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 zgate && useradd --uid 1001 --gid zgate --shell /bin/false zgate
COPY --from=build --chown=zgate:zgate /repo/website/frontend/.next/standalone ./
COPY --from=build --chown=zgate:zgate /repo/website/frontend/.next/static ./website/frontend/.next/static
USER zgate
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "website/frontend/server.js"]
