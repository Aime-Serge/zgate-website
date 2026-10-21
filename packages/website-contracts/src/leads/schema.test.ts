import { describe, expect, it } from "vitest";
import { leadFormSchema } from "./schema.ts";

describe("leadFormSchema", () => {
  const base = {
    kind: "contact",
    name: "  Solange  ",
    contact: "+250 788 000 000",
    serviceInterests: ["advisory"],
    message: "",
    consentContact: "on",
  };

  it("accepts a minimal contact enquiry and trims input", () => {
    const result = leadFormSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Solange");
    expect(result.data?.preferredChannel).toBe("provided-contact");
    expect(result.data?.consentMarketing).toBe(false);
  });

  it("requires contact consent, with a plain-language reason", () => {
    const result = leadFormSchema.safeParse({ ...base, consentContact: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/agree/);
  });

  it("requires a course on the waitlist form", () => {
    const waitlist = { ...base, kind: "waitlist", serviceInterests: [] };
    expect(leadFormSchema.safeParse(waitlist).success).toBe(false);
    expect(leadFormSchema.safeParse({ ...waitlist, courseId: "3" }).success).toBe(true);
  });

  it("routes waitlist submissions through Academy rather than service selections", () => {
    expect(
      leadFormSchema.safeParse({
        ...base,
        kind: "waitlist",
        courseId: "3",
        serviceInterests: ["advisory"],
      }).success,
    ).toBe(false);
  });

  it("rejects oversized input", () => {
    expect(leadFormSchema.safeParse({ ...base, name: "x".repeat(201) }).success).toBe(false);
  });

  it("allows more than one service area", () => {
    expect(
      leadFormSchema.safeParse({ ...base, serviceInterests: ["advisory", "data"] }).success,
    ).toBe(true);
  });

  it("requires a service area for a contact enquiry", () => {
    const result = leadFormSchema.safeParse({ ...base, serviceInterests: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "serviceInterests")).toBe(true);
  });

  it("keeps Not sure yet exclusive", () => {
    expect(
      leadFormSchema.safeParse({ ...base, serviceInterests: ["not-sure", "tech"] }).success,
    ).toBe(false);
    expect(leadFormSchema.safeParse({ ...base, serviceInterests: ["not-sure"] }).success).toBe(
      true,
    );
  });

  it("rejects unknown service areas and duplicate choices", () => {
    expect(
      leadFormSchema.safeParse({ ...base, serviceInterests: ["advisory", "hacking"] }).success,
    ).toBe(false);
    expect(
      leadFormSchema.safeParse({ ...base, serviceInterests: ["advisory", "advisory"] }).success,
    ).toBe(false);
  });
});
