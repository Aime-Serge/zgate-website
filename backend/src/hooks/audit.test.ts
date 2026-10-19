import { describe, expect, it } from "vitest";
import { changedFields } from "./audit";

describe("changedFields", () => {
  it("names the fields that changed, ignoring save bookkeeping", () => {
    expect(
      changedFields(
        { id: 1, status: "new", name: "A", updatedAt: "t1" },
        { id: 1, status: "contacted", name: "A", updatedAt: "t2" },
      ),
    ).toEqual(["status"]);
  });

  it("compares groups and lists by value, not identity", () => {
    const doc = { roles: ["editor"], consent: { a: true } };
    expect(changedFields(doc, structuredClone(doc))).toEqual([]);
    expect(changedFields({ roles: ["editor"] }, { roles: ["publisher"] })).toEqual(["roles"]);
  });

  it("notices a field that was cleared", () => {
    expect(changedFields({ staffNotes: "x" }, {})).toEqual(["staffNotes"]);
  });

  it("reports a new password hash as 'password', and Payload's auth bookkeeping not at all", () => {
    expect(
      changedFields(
        { email: "a@b.c", hash: "h1", salt: "s1" },
        { email: "a@b.c", hash: "h2", salt: "s2", loginAttempts: 0, lockUntil: null },
      ),
    ).toEqual(["password"]);
  });
});
