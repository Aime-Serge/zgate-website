import { describe, expect, it } from "vitest";
import { colors, contrastRatio } from "./index.js";

describe("brand tokens", () => {
  it("keep button text readable (WCAG AA, 4.5:1)", () => {
    expect(contrastRatio("#ffffff", colors.action)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", colors.actionHover)).toBeGreaterThanOrEqual(4.5);
  });

  it("keep body text readable on the ink surface", () => {
    expect(contrastRatio(colors.paper, colors.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.paperDim, colors.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("computes the known failing case the action colour replaces", () => {
    expect(contrastRatio("#ffffff", colors.gate1)).toBeCloseTo(4.26, 2);
  });
});
