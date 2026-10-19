/**
 * Who may switch course buttons from the waitlist to the e-learning
 * platform (ADR-011). Checks the field access rules directly, so it needs
 * no database.
 */
import type { Field, FieldAccess, PayloadRequest } from "payload";
import { describe, expect, it } from "vitest";
import { SiteSettings } from "./SiteSettings";

function findField(fields: Field[], name: string): Field | undefined {
  for (const field of fields) {
    if ("name" in field && field.name === name) return field;
    const nested =
      field.type === "tabs"
        ? field.tabs.flatMap((tab) => tab.fields)
        : "fields" in field
          ? field.fields
          : [];
    const found = findField(nested, name);
    if (found) return found;
  }
  return undefined;
}

const as = (role: "admin" | "publisher" | "editor" | null) =>
  ({
    req: { user: role ? { roles: [role] } : null } as unknown as PayloadRequest,
  }) as Parameters<FieldAccess>[0];

describe.each(["enrollmentMode", "lmsBaseUrl"])("site settings: %s", (name) => {
  const update = (() => {
    const field = findField(SiteSettings.fields, name);
    const access = field && "access" in field ? field.access?.update : undefined;
    if (!access) throw new Error(`${name} has no update access rule`);
    return access;
  })();

  it("can be changed by an admin", async () => {
    expect(await update(as("admin"))).toBe(true);
  });

  it.each(["publisher", "editor", null] as const)("can't be changed by %s", async (role) => {
    expect(await update(as(role))).toBe(false);
  });
});
