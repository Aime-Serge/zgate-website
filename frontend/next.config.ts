import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// pnpm workspace root: dependencies live in the root node_modules/.pnpm
// store, so module resolution and standalone tracing start there.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  poweredByHeader: false,
  // Baseline headers for every response; the CSP is set per request in
  // src/proxy.ts (it depends on the runtime SITE_URL).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
