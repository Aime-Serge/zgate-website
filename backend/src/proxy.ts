/**
 * Runs before every page and API route: serves only the CMS and applies
 * its security headers (see src/lib/hosts.ts for the reasoning).
 *
 * Reads ADMIN_URL straight from the environment instead of src/lib/env.ts,
 * so this stays independent of the CMS and database code (Next.js runs
 * proxy separately from render code).
 */
import { type NextRequest, NextResponse } from "next/server";
import { decideRoute, securityHeaders } from "@/lib/hosts";

const adminOrigin = (process.env["ADMIN_URL"] ?? "http://localhost:3004").replace(/\/$/, "");
const options = {
  dev: process.env["NODE_ENV"] === "development",
  https: adminOrigin.startsWith("https://"),
};

export function proxy(request: NextRequest) {
  const response =
    decideRoute(request.nextUrl.pathname).outcome === "not-found"
      ? new NextResponse("Not found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      : NextResponse.next();

  for (const [name, value] of Object.entries(securityHeaders(options))) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  // Static build assets don't need per-request handling.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
