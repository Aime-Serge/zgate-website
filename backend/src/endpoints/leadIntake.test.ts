/**
 * The refusal paths of lead intake. None of them may touch the database,
 * so the Payload instance here throws if used. Storing a lead is covered
 * against a real database in tests/int/leads.test.ts.
 */
import type { Payload } from "payload";
import { describe, expect, it } from "vitest";
import { bearerMatches, handleLeadIntake } from "./leadIntake";

const token = "t".repeat(32);
const untouchable = new Proxy({} as Payload, {
  get() {
    throw new Error("the database must not be reached");
  },
});
const config = { token, adminUrl: "http://localhost:3004" };
const request = (authorization: string | null, body: unknown = { form: {} }) => ({
  authorization,
  readBody: async () => body,
});

describe("bearerMatches", () => {
  it("accepts only the exact bearer token", () => {
    expect(bearerMatches(`Bearer ${token}`, token)).toBe(true);
    expect(bearerMatches(`Bearer ${token}x`, token)).toBe(false);
    expect(bearerMatches(token, token)).toBe(false);
    expect(bearerMatches(null, token)).toBe(false);
  });
});

describe("handleLeadIntake", () => {
  it("is closed until a token is configured", async () => {
    const result = await handleLeadIntake(untouchable, request(`Bearer ${token}`), {
      ...config,
      token: undefined,
    });
    expect(result.status).toBe(503);
  });

  it("rejects callers without the token, before reading the body", async () => {
    let read = false;
    const result = await handleLeadIntake(
      untouchable,
      {
        authorization: "Bearer wrong",
        readBody: async () => {
          read = true;
          return {};
        },
      },
      config,
    );
    expect(result.status).toBe(401);
    expect(read).toBe(false);
  });

  it("rejects a body that isn't a form", async () => {
    for (const body of [null, "text", { form: "x" }, { form: [] }]) {
      expect(
        (await handleLeadIntake(untouchable, request(`Bearer ${token}`, body), config)).status,
      ).toBe(400);
    }
  });

  it("re-validates the form and returns field errors", async () => {
    const result = await handleLeadIntake(
      untouchable,
      request(`Bearer ${token}`, { form: { kind: "contact", name: "", contact: "" } }),
      config,
    );
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({
      ok: false,
      reason: "invalid",
      fieldErrors: { name: "Enter your name.", consentContact: expect.any(String) },
    });
  });
});
