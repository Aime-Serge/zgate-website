import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The pnpm workspace root (this repository): dependencies live in its
// node_modules/.pnpm store, so module resolution and standalone tracing
// start there.
const workspaceRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
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
          // No other window can keep a handle on this one (tabnabbing, XS-Leaks).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
