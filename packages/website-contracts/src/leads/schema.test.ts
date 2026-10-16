import { describe, expect, it } from "vitest";
import { leadFormSchema } from "./schema.ts";

describe("leadFormSchema", () => {
  const base = {
    kind: "contact",
    name: "  Solange  ",
    contact: "+250 788 000 000",
    message: "",
    consentContact: "on",
  };

  it("accepts a minimal contact enquiry and trims input", () => {
    const result = leadFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Solange");
    expect(result.data?.consentMarketing).toBe(false);
  });

  it("requires contact consent, with a plain-language reason", () => {
    const result = leadFormSchema.safeParse({ ...base, consentContact: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/agree/);
  });

  it("requires a course on the waitlist form", () => {
    expect(leadFormSchema.safeParse({ ...base, kind: "waitlist" }).success).toBe(false);
    expect(leadFormSchema.safeParse({ ...base, kind: "waitlist", courseId: "3" }).success).toBe(
      true,
    );
  });

  it("rejects oversized input", () => {
    expect(leadFormSchema.safeParse({ ...base, name: "x".repeat(201) }).success).toBe(false);
  });

  it("ignores an unknown interest instead of failing the form", () => {
    expect(
      leadFormSchema.safeParse({ ...base, interest: "hacking" }).data?.interest,
    ).toBeUndefined();
  });
});
