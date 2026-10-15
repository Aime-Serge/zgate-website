/**
 * Security headers for the public site. Used by src/proxy.ts; kept free of
 * framework imports so it runs on every request cheaply and is
 * unit-testable.
 *
 * Public pages are cached HTML, so they can't carry per-request CSP nonces
 * and need 'unsafe-inline' for Next.js hydration. That is acceptable
 * because this origin has no authenticated surface at all: the CMS is a
 * separate app on its own host (website/backend, ADMIN_URL), so no login
 * cookie ever reaches these pages (docs/platform-v2/04-WEBSITE.md §9).
 */

const directives = (entries: Record<string, string[]>) =>
  Object.entries(entries)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");

/**
 * Everything is locked to this origin: no third-party scripts, frames,
 * plugins or form targets. `dev` adds what next dev's hot reloading needs.
 */
export function contentSecurityPolicy({ dev, https }: { dev: boolean; https: boolean }) {
  const policy = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(dev ? ["ws:"] : [])],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  return directives(https ? { ...policy, "upgrade-insecure-requests": [] } : policy);
}

export function securityHeaders(options: { dev: boolean; https: boolean }) {
  return { "Content-Security-Policy": contentSecurityPolicy(options) };
}
