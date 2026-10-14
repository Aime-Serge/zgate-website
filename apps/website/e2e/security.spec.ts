/**
 * Host separation and security headers (src/lib/hosts.ts), checked in a
 * real browser so CSP violations surface the way users would hit them.
 */
import { expect, type Page, test } from "@playwright/test";

const siteUrl = process.env["E2E_SITE_URL"] ?? "http://localhost:3002";
const adminUrl = process.env["E2E_ADMIN_URL"] ?? "http://127.0.0.1:3002";

/** Collects CSP violations reported by the browser while a page loads. */
async function cspViolations(page: Page, url: string): Promise<string[]> {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  return violations;
}

test.describe("public host", () => {
  test("never exposes the CMS", async ({ request }) => {
    for (const path of [
      "/admin",
      "/admin/login",
      "/api/leads",
      "/api/users/me",
      "/api/audit-logs",
    ]) {
      const response = await request.get(`${siteUrl}${path}`, { maxRedirects: 0 });
      expect(response.status(), path).toBe(404);
    }
  });

  test("sends a CSP with no third-party sources, and no framework fingerprint", async ({
    request,
  }) => {
    const response = await request.get(`${siteUrl}/`);
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).not.toMatch(/https?:\/\//);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("pages load without CSP violations", async ({ page }) => {
    for (const path of ["/", "/contact", "/academy/courses/tax-bookkeeping-fundamentals"]) {
      expect(await cspViolations(page, `${siteUrl}${path}`), path).toEqual([]);
    }
  });

  test("robots.txt and sitemap.xml use the real site URL", async ({ request }) => {
    const robots = await (await request.get(`${siteUrl}/robots.txt`)).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    const sitemap = await (await request.get(`${siteUrl}/sitemap.xml`)).text();
    expect(sitemap).toContain(`<loc>${siteUrl}/</loc>`);
    expect(sitemap).toContain(`<loc>${siteUrl}/academy/courses/tax-bookkeeping-fundamentals</loc>`);
    // The homepage is listed once, as "/", never under its CMS slug.
    expect(sitemap).not.toContain(`${siteUrl}/home</loc>`);
  });
});

test.describe("admin host", () => {
  test("serves the CMS with noindex, and blocks crawlers entirely", async ({ request }) => {
    const response = await request.get(`${adminUrl}/admin`, { maxRedirects: 0 });
    expect([200, 307, 308]).toContain(response.status());
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(await (await request.get(`${adminUrl}/robots.txt`)).text()).toContain("Disallow: /\n");
  });

  test("never serves public pages, only the CMS", async ({ request }) => {
    const response = await request.get(`${adminUrl}/about`, { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test("the CMS loads without CSP violations or third-party requests", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (req) => {
      if (!req.url().startsWith(adminUrl) && !req.url().startsWith("data:"))
        external.push(req.url());
    });
    expect(await cspViolations(page, `${adminUrl}/admin`)).toEqual([]);
    expect(external).toEqual([]);
  });
});
