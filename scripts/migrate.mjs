#!/usr/bin/env node
/**
 * Runs the CMS's database migrations as its migration owner role, for
 * local hybrid development:
 *
 *   pnpm db:migrate
 *
 * The CMS connects as a least-privilege role (backend/database/init/), so
 * backend/.env carries a second URL, DATABASE_MIGRATION_URL, for the owner
 * role. This sets DATABASE_URL to it for the migration command only. CI
 * and production pass the owner URL directly instead.
 *
 * Node built-ins only.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { backendDir, backendPython } from "./python.mjs";

const envFile = path.join(backendDir, ".env");
const fromFile = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {};
const migrationUrl = process.env["DATABASE_MIGRATION_URL"] ?? fromFile["DATABASE_MIGRATION_URL"];
if (!migrationUrl) {
  console.error("DATABASE_MIGRATION_URL is not set (environment or backend/.env).");
  process.exit(1);
}

const result = spawnSync(backendPython(), ["manage.py", "migrate"], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: migrationUrl },
});
process.exit(result.status ?? 1);
