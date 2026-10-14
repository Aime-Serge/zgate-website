import { describe, expect, it } from "vitest";
import { clientIp } from "./clientIp";
import { RateLimiter } from "./rateLimit";
import { leadFormSchema } from "./schema";

describe("clientIp", () => {
  it("takes the address the single trusted proxy appended", () => {
    // Visitor forged "1.1.1.1"; Caddy appended the real client.
    expect(clientIp("1.1.1.1, 198.51.100.7", 1)).toBe("198.51.100.7");
  });

  it("skips past each trusted proxy (CDN -> Caddy -> app)", () => {
    // CDN appended the client; Caddy appended the CDN edge.
    expect(clientIp("1.1.1.1, 198.51.100.7, 203.0.113.50", 2)).toBe("198.51.100.7");
  });

  it("uses the socket address Next.js filled in when there was no header", () => {
    expect(clientIp("198.51.100.7", 1)).toBe("198.51.100.7");
  });

  it("never trusts the header when no proxy is configured", () => {
    expect(clientIp("1.1.1.1", 0)).toBe("unknown");
  });

  it("never walks past the start of the chain", () => {
    expect(clientIp("198.51.100.7", 3)).toBe("198.51.100.7");
  });

  it("handles a missing header", () => {
    expect(clientIp(null, 1)).toBe("unknown");
  });
});

describe("RateLimiter", () => {
  it("allows up to the limit per window, then blocks, then resets", () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.attempt("a", 0)).toBe(true);
    expect(limiter.attempt("a", 10)).toBe(true);
    expect(limiter.attempt("a", 20)).toBe(false);
    expect(limiter.attempt("b", 20)).toBe(true);
    expect(limiter.attempt("a", 1000)).toBe(true);
  });

  it("keeps memory bounded", () => {
    const limiter = new RateLimiter(1, 60_000, 3);
    for (const key of ["a", "b", "c", "d", "e"]) limiter.attempt(key, 0);
    expect((limiter as unknown as { hits: Map<string, unknown> }).hits.size).toBeLessThanOrEqual(3);
  });
});

describe("leadFormSchema", () => {
  const base = {
    kind: "contact",
    name: "  Solange  ",
    contact: "+250 788 000 000",
    message: "",
    consentContact: "on",
  };

  it("accepts a minimal contact enquiry and trims input", () => {
    const result = leadFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Solange");
    expect(result.data?.consentMarketing).toBe(false);
  });

  it("requires contact consent, with a plain-language reason", () => {
    const result = leadFormSchema.safeParse({ ...base, consentContact: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/agree/);
  });

  it("requires a course on the waitlist form", () => {
    expect(leadFormSchema.safeParse({ ...base, kind: "waitlist" }).success).toBe(false);
    expect(leadFormSchema.safeParse({ ...base, kind: "waitlist", courseId: "3" }).success).toBe(
      true,
    );
  });

  it("rejects oversized input", () => {
    expect(leadFormSchema.safeParse({ ...base, name: "x".repeat(201) }).success).toBe(false);
  });

  it("ignores an unknown interest instead of failing the form", () => {
    expect(
      leadFormSchema.safeParse({ ...base, interest: "hacking" }).data?.interest,
    ).toBeUndefined();
  });
});
