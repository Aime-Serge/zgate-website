/**
 * Lead form validation, shared by the website frontend (its server action,
 * for field errors) and the CMS (lead intake, which re-checks everything).
 * Client components import ./constants instead, which has no dependencies:
 * this file pulls in zod, which must stay out of the browser bundle.
 *
 * Plain-language messages and a deliberately free-form "contact" field
 * (email, phone or WhatsApp) carry over from the v1 contact form, which the
 * commercial review found well suited to this market
 * (docs/WEBSITE.md, Forms).
 */
import { z } from "zod";
import { REPLY_CHANNELS, SERVICE_AREAS, type LeadField } from "./constants.ts";

export {
  ATTRIBUTION_FIELDS,
  INTERESTS,
  REPLY_CHANNELS,
  SERVICE_AREAS,
  type LeadFormState,
} from "./constants.ts";

const trimmed = (max: number, required?: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    required ? z.string().min(1, required).max(max) : z.string().max(max),
  );

const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const optionalId = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().positive().optional(),
);

export const leadFormSchema = z
  .object({
    kind: z.enum(["contact", "waitlist"]),
    name: trimmed(200, "Enter your name."),
    businessName: trimmed(160),
    contact: trimmed(200, "Enter a phone number, WhatsApp number or email so we can reach you."),
    preferredChannel: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(REPLY_CHANNELS).default("provided-contact"),
    ),
    serviceInterests: z.array(z.enum(SERVICE_AREAS)).max(SERVICE_AREAS.length).default([]),
    courseId: optionalId,
    message: trimmed(2000),
    consentContact: checkbox.refine((v) => v, {
      message: "Please agree so we can contact you about your enquiry.",
    }),
    consentMarketing: checkbox,
  })
  .superRefine((value, ctx) => {
    if (new Set(value.serviceInterests).size !== value.serviceInterests.length) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceInterests"],
        message: "Choose each service only once.",
      });
    }
    if (
      value.kind === "contact" &&
      (value.serviceInterests.length === 0 ||
        (value.serviceInterests.includes("not-sure") && value.serviceInterests.length > 1))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceInterests"],
        message:
          value.serviceInterests.length === 0
            ? "Choose at least one service, or select Not sure yet."
            : "Choose Not sure yet by itself, or select one or more services.",
      });
    }
    if (value.kind === "waitlist" && value.serviceInterests.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["serviceInterests"],
        message: "Course waitlists are routed through Academy.",
      });
    }
    if (value.kind === "waitlist" && value.courseId === undefined) {
      ctx.addIssue({ code: "custom", path: ["courseId"], message: "Choose a course." });
    }
  });

export type LeadFormInput = z.infer<typeof leadFormSchema>;

/** UTM and referrer captured in the browser; every field optional and capped. */
export const attributionSchema = z.object({
  utmSource: trimmed(100),
  utmMedium: trimmed(100),
  utmCampaign: trimmed(100),
  utmContent: trimmed(100),
  utmTerm: trimmed(100),
  landingPage: trimmed(500),
  referrer: trimmed(500),
});

export type Attribution = z.infer<typeof attributionSchema>;

export function fieldErrorsFrom(error: z.ZodError): Partial<Record<LeadField, string>> {
  const errors: Partial<Record<LeadField, string>> = {};
  for (const issue of error.issues) {
    const key =
      issue.path[0] === "serviceInterests"
        ? "serviceInterests"
        : (issue.path[0] as LeadField | undefined);
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
