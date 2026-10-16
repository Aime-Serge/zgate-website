# @zgate/cms-contracts

What the public site (`frontend/`) may use from the CMS (`backend/`): content types generated from the Payload collections (`src/payload-types.ts`), division slugs, the signed cache-clearing webhook, and the lead-intake contract (re-exported from `@zgate/website-contracts`).

Internal to the website: **no other product uses it**. The frontend imports this package instead of the CMS's source, and `pnpm lint:boundaries` keeps both this package and the frontend free of Payload's runtime (type-only imports are allowed).

`src/payload-types.ts` is generated: after changing a collection, run `pnpm --filter @zgate/website-backend generate:types` (the CMS's `payload.config.ts` writes it here).
