import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Articles } from "@/collections/Articles";
import { AuditLogs } from "@/collections/AuditLogs";
import { Courses } from "@/collections/Courses";
import { Divisions } from "@/collections/Divisions";
import { Leads } from "@/collections/Leads";
import { Media } from "@/collections/Media";
import { Pages } from "@/collections/Pages";
import { Redirects } from "@/collections/Redirects";
import { Users } from "@/collections/Users";
import { leadIntakeEndpoint } from "@/endpoints/leadIntake";
import { SiteSettings } from "@/globals/SiteSettings";
import { env } from "@/lib/env";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const config = env();

export default buildConfig({
  secret: config.PAYLOAD_SECRET,
  // The CMS origin. Payload builds password-reset links from this; leaving
  // it unset would make it trust the request's Host header instead
  // (reset-link poisoning). The public site (website/frontend) never links
  // to this host.
  serverURL: config.ADMIN_URL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: " — Z-GATE website" },
    importMap: { baseDir: dirname },
  },
  collections: [Pages, Divisions, Courses, Articles, Media, Leads, Redirects, Users, AuditLogs],
  globals: [SiteSettings],
  // The only write the public site makes (server to server, token-guarded).
  endpoints: [leadIntakeEndpoint],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: config.DATABASE_URL },
    // Schema changes always go through reviewed migration files - never
    // auto-push, not even in development, so dev and production can't drift.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  // Any SMTP provider (provider-neutral on purpose). Without SMTP_HOST,
  // Payload writes emails to the log instead of sending them.
  ...(config.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: config.EMAIL_FROM,
          defaultFromName: "Z-GATE website",
          transportOptions: {
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_PORT === 465,
            ...(config.SMTP_USER
              ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
              : {}),
          },
        }),
      }
    : {}),
  sharp,
  // REST only. GraphQL would add a second, unused query surface to secure.
  graphQL: { disable: true },
  // Only the CMS's own origin may make cookie-authenticated API calls.
  cors: [],
  csrf: [config.ADMIN_URL],
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
