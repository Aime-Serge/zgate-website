/**
 * Runtime configuration for the website, validated once per process.
 *
 * The same image runs in every environment (docs/platform-v2/
 * 02-TARGET-ARCHITECTURE.md §1), so nothing here may be baked in at build
 * time. `next build` imports the Payload config to collect route data but
 * never connects to the database (CMS pages render on first request, see
 * src/app/(site)/[[...slug]]/page.tsx), so during the build phase only we
 * substitute inert placeholders instead of failing for missing secrets.
 */
import { z } from "zod";

// `SMTP_HOST=` in an env file means "not set", not "an empty host".
const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const origin = (message: string) =>
  z
    .string()
    .url(message)
    .transform((v) => v.replace(/\/$/, ""));

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url("DATABASE_URL must be a postgres:// URL"),
    // Signs Payload auth tokens. Same length floor as the API's SESSION_SECRET.
    PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be at least 32 characters"),
    // Public origin of this site, e.g. https://www.example.rw - canonical
    // URLs, sitemap, robots.
    SITE_URL: origin("SITE_URL must be an absolute URL"),
    // Origin the CMS admin is served on, e.g. https://cms.example.rw - must
    // be a different host from SITE_URL so the CMS login cookie never reaches
    // the public pages' origin (src/lib/hosts.ts). Required in production;
    // optional locally (single-host mode).
    ADMIN_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      origin("ADMIN_URL must be an absolute URL").optional(),
    ),
    // Uploaded media on local disk until object storage is wired in
    // (docs/platform-v2/02-TARGET-ARCHITECTURE.md §7, ADR-P7).
    MEDIA_DIR: z.string().min(1).default("./media"),
    // Reverse proxies in front of the app (production: Caddy = 1). Decides
    // which X-Forwarded-For entry is the real visitor - see
    // src/lib/leads/clientIp.ts. 0 = header ignored entirely.
    TRUSTED_PROXIES: z.coerce.number().int().min(0).max(5).default(1),
    // Staff notifications. Without SMTP_HOST, emails are written to the log
    // instead of sent - the site still works.
    SMTP_HOST: optional,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optional,
    SMTP_PASS: optional,
    EMAIL_FROM: z.string().email().default("no-reply@example.com"),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;
    if (!value.ADMIN_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["ADMIN_URL"],
        message: "ADMIN_URL is required in production (the CMS must run on its own host)",
      });
    } else if (new URL(value.ADMIN_URL).host === new URL(value.SITE_URL).host) {
      ctx.addIssue({
        code: "custom",
        path: ["ADMIN_URL"],
        message: "ADMIN_URL must be a different host from SITE_URL",
      });
    }
  });

export type Env = z.infer<typeof schema>;

const BUILD_PLACEHOLDERS = {
  DATABASE_URL: "postgres://build:build@127.0.0.1:1/build",
  PAYLOAD_SECRET: "build-phase-placeholder-never-used-at-runtime",
  SITE_URL: "http://localhost:3002",
  ADMIN_URL: "http://127.0.0.1:3002",
} as const;

/** Where the CMS lives: its own host in production, the site itself locally. */
export const adminOrigin = (config: Env): string => config.ADMIN_URL ?? config.SITE_URL;

export function isBuildPhase(): boolean {
  return process.env["NEXT_PHASE"] === "phase-production-build";
}

/** Exported for tests - validates an arbitrary env object. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // During `next build`, blank values count as unset too (CI blanks them
  // explicitly to prove the build doesn't need them).
  const set = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const input = isBuildPhase() ? { ...BUILD_PLACEHOLDERS, ...set } : source;
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
