import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./security";

describe("contentSecurityPolicy", () => {
  const prod = { dev: false, https: true };

  it("locks the public site to its own origin", () => {
    const csp = contentSecurityPolicy(prod);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
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
});
