/**
 * Real-browser checks against the production build: accessibility (axe),
 * security headers and host separation, forms, and a JavaScript budget.
 *
 * Needs a running site and its database. Two hostnames for one server
 * mirror production's public/admin split:
 *   SITE_URL  = http://localhost:3002   (public)
 *   ADMIN_URL = http://127.0.0.1:3002   (CMS)
 * CI starts the server itself (see .github/workflows/ci.yml); locally,
 * `pnpm build && pnpm start` first, then `pnpm e2e`.
 */
import { defineConfig, devices } from "@playwright/test";

const siteUrl = process.env["E2E_SITE_URL"] ?? "http://localhost:3002";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env["CI"] ? 1 : 0,
  timeout: 60_000,
  reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: siteUrl,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    // Mid-range Android-sized viewport - the site's primary audience.
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
});
