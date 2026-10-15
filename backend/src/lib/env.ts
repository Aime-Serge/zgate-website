/**
 * Runtime configuration for the website CMS, validated once per process.
 *
 * The same image runs in every environment (docs/platform-v2/
 * 02-TARGET-ARCHITECTURE.md §1), so nothing here may be baked in at build
 * time. `next build` imports the Payload config to collect route data but
 * never connects to the database, so during the build phase only we
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

// Shared with the website frontend; same length floor as PAYLOAD_SECRET.
const sharedSecret = (name: string) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(32, `${name} must be at least 32 characters`).optional(),
  );

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url("DATABASE_URL must be a postgres:// URL"),
    // Signs Payload auth tokens. Same length floor as the API's SESSION_SECRET.
    PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be at least 32 characters"),
    // This CMS's own public origin, e.g. https://cms.example.rw. Payload
    // builds password-reset and notification links from it, and only this
    // origin may make cookie-authenticated API calls. It must never be the
    // public site's host: the CMS login cookie stays off the public origin
    // (docs/platform-v2/04-WEBSITE.md §9).
    ADMIN_URL: origin("ADMIN_URL must be an absolute URL").default("http://localhost:3004"),
    // Uploaded media on local disk until object storage is wired in
    // (docs/platform-v2/02-TARGET-ARCHITECTURE.md §7, ADR-P7).
    MEDIA_DIR: z.string().min(1).default("./media"),
    // Bearer token the website frontend presents to POST /api/lead-intake
    // (src/endpoints/leadIntake.ts). Unset = lead intake refused (503).
    LEAD_INTAKE_TOKEN: sharedSecret("LEAD_INTAKE_TOKEN"),
    // The frontend's cache-clearing webhook (POST, HMAC-signed with
    // REVALIDATE_SECRET), e.g. http://website-frontend:3002/api/revalidate.
    // Unset = publishing still works, but the public site only picks the
    // change up at its hourly safety-net revalidation.
    REVALIDATE_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url("REVALIDATE_URL must be an absolute URL").optional(),
    ),
    REVALIDATE_SECRET: sharedSecret("REVALIDATE_SECRET"),
    // Staff notifications. Without SMTP_HOST, emails are written to the log
    // instead of sent - the site still works.
    SMTP_HOST: optional,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: optional,
    SMTP_PASS: optional,
    EMAIL_FROM: z.string().email().default("no-reply@example.com"),
  })
  .superRefine((value, ctx) => {
    if (value.REVALIDATE_URL && !value.REVALIDATE_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["REVALIDATE_SECRET"],
        message: "REVALIDATE_SECRET is required when REVALIDATE_URL is set",
      });
    }
    if (value.NODE_ENV !== "production") return;
    for (const name of ["LEAD_INTAKE_TOKEN", "REVALIDATE_URL", "REVALIDATE_SECRET"] as const) {
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

const BUILD_PLACEHOLDERS = {
  DATABASE_URL: "postgres://build:build@127.0.0.1:1/build",
  PAYLOAD_SECRET: "build-phase-placeholder-never-used-at-runtime",
  ADMIN_URL: "http://localhost:3004",
} as const;

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
    throw new Error(`Invalid website CMS configuration:\n  ${problems.join("\n  ")}`);
  }
  return result.data;
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
