import { describe, expect, it } from "vitest";
import { REVALIDATE_MAX_AGE_SECONDS, signRevalidation, verifyRevalidation } from "./webhook";

const secret = "s".repeat(32);
const body = JSON.stringify({ event: "content-changed", source: "pages" });
const now = Date.UTC(2026, 9, 15, 9, 0, 0);

describe("revalidation webhook signature", () => {
  it("accepts what it signed", () => {
    expect(verifyRevalidation(body, signRevalidation(body, secret, now), secret, now)).toBe(true);
  });

  it("rejects a different body, secret or a missing header", () => {
    const signature = signRevalidation(body, secret, now);
    expect(verifyRevalidation(`${body} `, signature, secret, now)).toBe(false);
    expect(verifyRevalidation(body, signature, "x".repeat(32), now)).toBe(false);
    expect(verifyRevalidation(body, null, secret, now)).toBe(false);
    expect(verifyRevalidation(body, "t=abc,v1=00", secret, now)).toBe(false);
    expect(verifyRevalidation(body, "garbage", secret, now)).toBe(false);
  });

  it("rejects a replay outside the allowed window", () => {
    const signature = signRevalidation(body, secret, now);
    const late = now + (REVALIDATE_MAX_AGE_SECONDS + 1) * 1000;
    expect(verifyRevalidation(body, signature, secret, late)).toBe(false);
    expect(verifyRevalidation(body, signature, secret, now + 60_000)).toBe(true);
  });
});
