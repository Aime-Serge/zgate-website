import { describe, expect, it } from "vitest";
import { validateLayout } from "@/collections/Pages";
import { validateHref, validateSlug } from "@/fields/common";

// Payload validators receive (value, options); these rules only read value.
const href = (value: string) => validateHref(value, {} as never);
const slug = (value: string) => validateSlug(value, {} as never);

describe("validateHref", () => {
  it.each(["/contact", "/academy/courses", "https://learn.example.rw/courses"])(
    "accepts %s",
    (value) => {
      expect(href(value)).toBe(true);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    "http://example.com",
    "//evil.example",
    "contact",
  ])("rejects %s", (value) => {
    expect(href(value)).not.toBe(true);
  });
});

describe("validateSlug", () => {
  it.each(["home", "tax-basics", "course-2"])("accepts %s", (value) => {
    expect(slug(value)).toBe(true);
  });

  it.each(["Home", "tax basics", "-lead", "trail-", "double--hyphen", "../etc"])(
    "rejects %s",
    (value) => {
      expect(slug(value)).not.toBe(true);
    },
  );
});

describe("validateLayout", () => {
  it("requires a next step on marketing pages", () => {
    expect(validateLayout([{ blockType: "hero" }], "marketing")).not.toBe(true);
    expect(
      validateLayout([{ blockType: "hero" }, { blockType: "callToAction" }], "marketing"),
    ).toBe(true);
    expect(validateLayout([{ blockType: "leadForm" }], "marketing")).toBe(true);
  });

  it("exempts legal pages but still requires content", () => {
    expect(validateLayout([{ blockType: "richText" }], "legal")).toBe(true);
    expect(validateLayout([], "legal")).not.toBe(true);
  });
});
