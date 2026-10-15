import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  PAYLOAD_SECRET: "x".repeat(32),
  ADMIN_URL: "https://cms.example.rw/",
};

const production = {
  ...valid,
  NODE_ENV: "production",
  LEAD_INTAKE_TOKEN: "t".repeat(32),
  REVALIDATE_URL: "http://website-frontend:3002/api/revalidate",
  REVALIDATE_SECRET: "r".repeat(32),
};

describe("parseEnv", () => {
  afterEach(() => {
    delete process.env["NEXT_PHASE"];
  });

  it("parses a valid runtime environment and normalises ADMIN_URL", () => {
    const env = parseEnv(valid);
    expect(env.ADMIN_URL).toBe("https://cms.example.rw");
    expect(env.MEDIA_DIR).toBe("./media");
  });

  it("defaults to the local CMS port in development", () => {
    const { ADMIN_URL: _unused, ...rest } = valid;
    expect(parseEnv(rest).ADMIN_URL).toBe("http://localhost:3004");
  });

  it("fails fast at runtime when secrets are missing, naming only the variables", () => {
    expect(() => parseEnv({ ...valid, PAYLOAD_SECRET: "short" })).toThrow(/PAYLOAD_SECRET/);
    expect(() => parseEnv({ ...valid, PAYLOAD_SECRET: "short" })).not.toThrow(/short/);
    expect(() => parseEnv({ PAYLOAD_SECRET: valid.PAYLOAD_SECRET })).toThrow(/DATABASE_URL/);
  });

  it("treats empty optional values copied from .env.example as unset", () => {
    const env = parseEnv({ ...valid, SMTP_HOST: "", LEAD_INTAKE_TOKEN: "", REVALIDATE_URL: "" });
    expect(env.SMTP_HOST).toBeUndefined();
    expect(env.LEAD_INTAKE_TOKEN).toBeUndefined();
    expect(env.REVALIDATE_URL).toBeUndefined();
  });

  it("needs a signing secret whenever the webhook is configured", () => {
    expect(() => parseEnv({ ...valid, REVALIDATE_URL: production.REVALIDATE_URL })).toThrow(
      /REVALIDATE_SECRET is required/,
    );
    expect(() => parseEnv({ ...valid, REVALIDATE_SECRET: "short" })).toThrow(/32 characters/);
  });

  it("requires lead intake and the revalidation webhook in production", () => {
    expect(() => parseEnv(production)).not.toThrow();
    for (const name of ["LEAD_INTAKE_TOKEN", "REVALIDATE_URL", "REVALIDATE_SECRET"] as const) {
      const { [name]: _removed, ...rest } = production;
      expect(() => parseEnv(rest), name).toThrow(new RegExp(name));
    }
  });

  it("accepts the documented .env.example as-is", () => {
    const text = readFileSync(
      fileURLToPath(new URL("../../../deploy/env/dev.env.example", import.meta.url)),
      "utf8",
    );
    const fromFile = Object.fromEntries(
      text
        .split(/\r?\n/)
        .filter((line) => /^[A-Z_]+=/.test(line))
        .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
    );
    expect(() => parseEnv(fromFile)).not.toThrow();
  });

  it("tolerates a missing environment only during `next build`", () => {
    process.env["NEXT_PHASE"] = "phase-production-build";
    expect(() => parseEnv({})).not.toThrow();
    // CI blanks the values on purpose; blanks must not defeat the
    // placeholders, and production-only requirements wait for runtime.
    expect(() =>
      parseEnv({ NODE_ENV: "production", DATABASE_URL: "", ADMIN_URL: "", PAYLOAD_SECRET: "" }),
    ).not.toThrow();
  });
});
