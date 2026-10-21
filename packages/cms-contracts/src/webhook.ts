/**
 * The "content changed" webhook the CMS sends the website frontend so it
 * clears its page cache (backend/content/revalidate.py -> the frontend's
 * src/app/api/revalidate/route.ts).
 *
 * HMAC-SHA256 over `<unix seconds>.<body>`, in the same shape as common
 * webhook providers: `x-zgate-signature: t=<seconds>,v1=<hex>`. The
 * timestamp bounds replay to MAX_AGE_SECONDS; the secret
 * (REVALIDATE_SECRET) is shared by the two services only. Server-only
 * (node:crypto).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const REVALIDATE_SIGNATURE_HEADER = "x-zgate-signature";
export const REVALIDATE_MAX_AGE_SECONDS = 300;

export type RevalidationEvent = {
  event: "content-changed";
  /** Collection or global slug that changed - logged, not acted on. */
  source: string;
};

const mac = (secret: string, timestamp: number, body: string) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export function signRevalidation(body: string, secret: string, now = Date.now()): string {
  const timestamp = Math.floor(now / 1000);
  return `t=${timestamp},v1=${mac(secret, timestamp, body)}`;
}

export function verifyRevalidation(
  body: string,
  header: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=");
      return [key, value.join("=")];
    }),
  );
  const timestamp = Number(parts["t"]);
  const presented = parts["v1"];
  if (!Number.isInteger(timestamp) || !presented) return false;
  if (Math.abs(Math.floor(now / 1000) - timestamp) > REVALIDATE_MAX_AGE_SECONDS) return false;

  const expected = Buffer.from(mac(secret, timestamp, body), "hex");
  const actual = Buffer.from(presented, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
