/**
 * Server-only: stores a validated public form submission as a lead.
 * Called by lead intake (src/endpoints/leadIntake.ts) - the only way a lead
 * can be created (the collection refuses creates over the REST API).
 */
import type { Payload } from "payload";
import type { Lead } from "@zgate/cms-contracts/payload-types";
import type { Attribution, LeadFormInput } from "@zgate/website-contracts";

export type CreateLeadResult =
  { ok: true; lead: Lead } | { ok: false; reason: "course-unavailable" | "privacy-unpublished" };

/**
 * Personal data must not be collected without a published privacy notice
 * (Law N° 058/2021, docs/release/COMMERCIAL_READINESS.md CR-6), so the form
 * is refused - not just hidden - until the notice is live.
 */
export async function isPrivacyNoticePublished(payload: Payload): Promise<boolean> {
  const result = await payload.count({
    collection: "pages",
    where: { and: [{ slug: { equals: "privacy" } }, { _status: { equals: "published" } }] },
    overrideAccess: true,
  });
  return result.totalDocs > 0;
}

export async function createLead(
  payload: Payload,
  input: LeadFormInput,
  attribution: Attribution,
  { noticeVersion, now = new Date() }: { noticeVersion: string; now?: Date },
): Promise<CreateLeadResult> {
  if (!(await isPrivacyNoticePublished(payload))) {
    return { ok: false, reason: "privacy-unpublished" };
  }

  // The browser only names a course; whether it exists and is live is
  // re-checked here, never trusted from the form.
  let course: number | undefined;
  if (input.courseId !== undefined) {
    const found = await payload.count({
      collection: "courses",
      where: { and: [{ id: { equals: input.courseId } }, { _status: { equals: "published" } }] },
      overrideAccess: true,
    });
    if (found.totalDocs === 0) return { ok: false, reason: "course-unavailable" };
    course = input.courseId;
  }

  const lead = await payload.create({
    collection: "leads",
    overrideAccess: true,
    // Read by the audit hook: recorded as an anonymous public submission.
    context: { publicSubmission: true },
    data: {
      kind: input.kind,
      status: "new",
      name: input.name,
      contact: input.contact,
      ...(input.interest ? { interest: input.interest } : {}),
      ...(course !== undefined ? { course, interest: "academy" as const } : {}),
      ...(input.message ? { message: input.message } : {}),
      consent: {
        contactAllowed: input.consentContact,
        marketingAllowed: input.consentMarketing,
        noticeVersion,
        consentedAt: now.toISOString(),
      },
      attribution,
    },
  });
  return { ok: true, lead };
}
