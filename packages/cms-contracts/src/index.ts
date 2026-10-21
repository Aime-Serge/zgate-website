/**
 * Everything the website frontend may import about the CMS
 * (`@zgate/cms-contracts`). The CMS is the Django + Wagtail app in
 * backend/ (ADR-012); the frontend talks to it over HTTP only. Content
 * types are types only, matching the CMS's JSON API (content-types.ts).
 *
 * Internal to the website: no other product uses it. The lead/waitlist
 * contract other Z-GATE products may rely on lives in
 * `@zgate/website-contracts`, re-exported here.
 *
 * Client components import `@zgate/website-contracts/constants`
 * instead, which has no dependencies (this module pulls in zod and
 * node:crypto).
 */
export type * from "./content-types.ts";
export * from "./divisions.ts";
export * from "./slug.ts";
export * from "@zgate/website-contracts";
export * from "./webhook.ts";
