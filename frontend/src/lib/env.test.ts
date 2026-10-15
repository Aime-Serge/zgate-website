import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = { SITE_URL: "https://www.example.rw/", CMS_URL: "http://website-backend:3004/" };

describe("parseEnv", () => {
  afterEach(() => {
    delete process.env["NEXT_PHASE"];
  });

  it("parses a valid runtime environment and normalises the origins", () => {
    const env = parseEnv(valid);
    expect(env.SITE_URL).toBe("https://www.example.rw");
    expect(env.CMS_URL).toBe("http://website-backend:3004");
    expect(env.TRUSTED_PROXIES).toBe(1);
  });

  it("defaults to the local CMS in development", () => {
    expect(parseEnv({ SITE_URL: valid.SITE_URL }).CMS_URL).toBe("http://localhost:3004");
  });

  it("fails fast at runtime, naming only the variables", () => {
    expect(() => parseEnv({})).toThrow(/SITE_URL/);
    expect(() => parseEnv({ ...valid, LEAD_INTAKE_TOKEN: "short-secret" })).toThrow(
      /LEAD_INTAKE_TOKEN/,
    );
    expect(() => parseEnv({ ...valid, LEAD_INTAKE_TOKEN: "short-secret" })).not.toThrow(
      /short-secret/,
    );
  });

  it("requires both shared secrets in production", () => {
    const prod = {
      ...valid,
      NODE_ENV: "production",
      LEAD_INTAKE_TOKEN: "t".repeat(32),
      REVALIDATE_SECRET: "r".repeat(32),
    };
    expect(() => parseEnv(prod)).not.toThrow();
    expect(() => parseEnv({ ...prod, LEAD_INTAKE_TOKEN: "" })).toThrow(/LEAD_INTAKE_TOKEN/);
    expect(() => parseEnv({ ...prod, REVALIDATE_SECRET: "" })).toThrow(/REVALIDATE_SECRET/);
  });

  it("accepts the documented .env.example as-is", () => {
    const text = readFileSync(
      fileURLToPath(new URL("../../../.env.example", import.meta.url)),
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
    expect(() =>
      parseEnv({ NODE_ENV: "production", SITE_URL: "", CMS_URL: "", LEAD_INTAKE_TOKEN: "" }),
    ).not.toThrow();
  });
});
