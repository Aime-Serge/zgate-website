/**
 * What the CMS serves, and its security headers. Used by src/proxy.ts;
 * kept free of framework and database imports so it runs on every request
 * cheaply and is unit-testable.
 *
 * This app is the CMS only, on its own host (ADMIN_URL, e.g. cms.): the
 * admin UI, the REST API the website frontend reads, and lead intake.
 * Public pages are a separate app (website/frontend) on the public host,
 * so the CMS login cookie never reaches the public pages' origin, where
 * cached HTML needs 'unsafe-inline' scripts (docs/platform-v2/04-WEBSITE.md §9).
 */

export type RouteDecision = { outcome: "next" } | { outcome: "not-found" };

const isAdminPath = (path: string) => path === "/admin" || path.startsWith("/admin/");
const isApiPath = (path: string) => path === "/api" || path.startsWith("/api/");

export function decideRoute(pathname: string): RouteDecision {
  if (
    isAdminPath(pathname) ||
    isApiPath(pathname) ||
    pathname.startsWith("/_next/") ||
    // Served here too, telling crawlers to stay out of the CMS host.
    pathname === "/robots.txt"
  ) {
    return { outcome: "next" };
  }
  // Anything else - including old public URLs - is a plain 404. Staff only
  // use /admin here.
  return { outcome: "not-found" };
}

const directives = (entries: Record<string, string[]>) =>
  Object.entries(entries)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");

/**
 * Content-Security-Policy for the Payload admin. 'unsafe-inline' scripts
 * are needed by the admin; everything else is locked to this origin: no
 * third-party scripts, frames, plugins or form targets. `dev` adds what
 * next dev's hot reloading needs.
 */
export function contentSecurityPolicy({ dev, https }: { dev: boolean; https: boolean }) {
  const policy = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(dev ? ["ws:"] : [])],
    "worker-src": ["'self'", "blob:"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  return directives(https ? { ...policy, "upgrade-insecure-requests": [] } : policy);
}

export function securityHeaders(options: { dev: boolean; https: boolean }) {
  return {
    "Content-Security-Policy": contentSecurityPolicy(options),
    // The CMS is never something search engines should index.
    "X-Robots-Tag": "noindex, nofollow",
  };
}
