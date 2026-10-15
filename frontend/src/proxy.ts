/**
 * Runs before every page and route: applies the public site's security
 * headers (src/lib/security.ts).
 *
 * Reads SITE_URL straight from the environment instead of src/lib/env.ts
 * (Next.js runs proxy separately from render code).
 */
import { NextResponse } from "next/server";
import { securityHeaders } from "@/lib/security";

const siteOrigin = (process.env["SITE_URL"] ?? "http://localhost:3002").replace(/\/$/, "");
const options = {
  dev: process.env["NODE_ENV"] === "development",
  https: siteOrigin.startsWith("https://"),
};

export function proxy() {
  const response = NextResponse.next();
  for (const [name, value] of Object.entries(securityHeaders(options))) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  // Static build assets don't need per-request handling.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
