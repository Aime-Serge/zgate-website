/**
 * Runtime configuration for the public website, validated once per process.
 *
 * The same image runs in every environment (docs/platform-v2/
 * 02-TARGET-ARCHITECTURE.md §1), so nothing here may be baked in at build
 * time. `next build` never calls the CMS (pages render on first request,
 * see src/app/(site)/[[...slug]]/page.tsx), so during the build phase only
 * we substitute inert placeholders instead of failing for missing values.
 */
import { z } from "zod";

const origin = (message: string) =>
  z
    .string()
    .url(message)
    .transform((v) => v.replace(/\/$/, ""));

// Shared with the CMS (backend); `NAME=` in an env file means unset.
const sharedSecret = (name: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(32, `${name} must be at least 32 characters`).optional(),
  );

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // Public origin of this site, e.g. https://www.example.rw - canonical
    // URLs, sitemap, robots.
    SITE_URL: origin("SITE_URL must be an absolute URL"),
    // How this server reaches the CMS - an internal address in production
    // (e.g. http://website-backend:3004), never through the public proxy.
    // Visitors' browsers never talk to the CMS.
    CMS_URL: origin("CMS_URL must be an absolute URL").default("http://localhost:3004"),
    // Presented to the CMS's lead intake; unset = forms fail with a
    // "reach us directly" message.
    LEAD_INTAKE_TOKEN: sharedSecret("LEAD_INTAKE_TOKEN"),
    // Verifies the CMS's "content changed" webhook (src/app/api/revalidate).
    REVALIDATE_SECRET: sharedSecret("REVALIDATE_SECRET"),
    // Reverse proxies in front of the app (production: Caddy = 1). Decides
    // which X-Forwarded-For entry is the real visitor - see
    // src/lib/leads/clientIp.ts. 0 = header ignored entirely.
    TRUSTED_PROXIES: z.coerce.number().int().min(0).max(5).default(1),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;
    for (const name of ["LEAD_INTAKE_TOKEN", "REVALIDATE_SECRET"] as const) {
      if (!value[name]) {
        ctx.addIssue({
          code: "custom",
          path: [name],
          message: `${name} is required in production`,
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

const BUILD_PLACEHOLDERS = { SITE_URL: "http://localhost:3002" } as const;

export function isBuildPhase(): boolean {
  return process.env["NEXT_PHASE"] === "phase-production-build";
}

/** Exported for tests - validates an arbitrary env object. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // During `next build`, blank values count as unset too (CI blanks them
  // explicitly to prove the build doesn't need them), and production-only
  // requirements wait for runtime.
  const set = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const input = isBuildPhase()
    ? { ...BUILD_PLACEHOLDERS, ...set, NODE_ENV: "development" }
    : source;
  const result = schema.safeParse(input);
  if (!result.success) {
    // Names only, never values - secrets must not reach logs.
    const problems = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid website configuration:\n  ${problems.join("\n  ")}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
