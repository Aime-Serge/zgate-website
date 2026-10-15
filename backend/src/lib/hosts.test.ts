import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, decideRoute, securityHeaders } from "./hosts";

describe("decideRoute", () => {
  it("serves the admin, the REST API, build assets and robots.txt", () => {
    for (const path of [
      "/admin",
      "/admin/collections/leads",
      "/api/pages",
      "/api/lead-intake",
      "/api/health",
      "/_next/static/chunk.js",
      "/robots.txt",
    ]) {
      expect(decideRoute(path), path).toEqual({ outcome: "next" });
    }
  });

  it("never serves public pages - they live in the website frontend", () => {
    for (const path of ["/", "/about", "/academy/courses/x", "/sitemap.xml", "/administrator"]) {
      expect(decideRoute(path), path).toEqual({ outcome: "not-found" });
    }
  });
});

describe("contentSecurityPolicy", () => {
  const prod = { dev: false, https: true };

  it("locks the admin to its own origin", () => {
    const csp = contentSecurityPolicy(prod);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/https?:\/\//);
  });

  it("only relaxes for local hot reloading", () => {
    expect(contentSecurityPolicy({ dev: true, https: false })).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy({ dev: false, https: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("keeps the CMS out of search engines", () => {
    expect(securityHeaders(prod)["X-Robots-Tag"]).toBe("noindex, nofollow");
  });
});
