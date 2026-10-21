/**
 * Real-browser checks against the production build: accessibility (axe),
 * security headers and host separation, forms, and a JavaScript budget.
 *
 * Needs both website apps running (production builds) and the website
 * database, mirroring production's public/CMS split:
 *   E2E_SITE_URL  = http://localhost:3002   (frontend, public)
 *   E2E_ADMIN_URL = http://localhost:3004   (backend, CMS)
 * CI starts both itself (.github/workflows/e2e.yml); locally, build
 * and `start` both packages first, then `pnpm e2e` here with DATABASE_URL.
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
