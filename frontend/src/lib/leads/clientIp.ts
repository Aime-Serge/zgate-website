/**
 * The visitor's IP for rate limiting, read so that it can't be spoofed.
 *
 * X-Forwarded-For is a list: the client can put anything at its left end,
 * and each reverse proxy appends the address it received the request from.
 * Next.js itself does NOT append - it only fills the header in when it's
 * absent (`??=` in next/dist/server/base-server.js) - so with `trustedProxies`
 * proxies in front of the app, the real client is the entry that many places
 * from the right. With no trusted proxy the header is entirely
 * client-controlled and is ignored: everyone shares one "unknown" bucket,
 * which is safe (can't be spoofed) but strict.
 */
export function clientIp(forwardedFor: string | null, trustedProxies: number): string {
  if (trustedProxies < 1 || !forwardedFor) return "unknown";
  const chain = forwardedFor
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length === 0) return "unknown";
  const index = Math.max(0, chain.length - trustedProxies);
  return chain[index] ?? "unknown";
}
