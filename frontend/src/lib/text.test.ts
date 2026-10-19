import { describe, expect, it } from "vitest";
import { shortDescription } from "./text";

describe("shortDescription", () => {
  it("keeps a short text as it is", () => {
    expect(shortDescription("One gate. Four rooms.")).toBe("One gate. Four rooms.");
  });

  it("keeps whole leading sentences within the limit", () => {
    const pitch =
      "Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately — and spend half their time translating between them. Z-GATE Solution puts all four under one roof.";
    const out = shortDescription(pitch);
    expect(out).toBe(
      "Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately — and spend half their time translating between them.",
    );
    expect(out.length).toBeLessThanOrEqual(160);
  });

  it("cuts a single over-long sentence with an ellipsis", () => {
    const out = shortDescription("a".repeat(200), 20);
    expect(out).toHaveLength(20);
    expect(out.endsWith("…")).toBe(true);
  });
});
