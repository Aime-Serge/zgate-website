"use server";

/**
 * Public lead form handler (contact enquiries and course waitlist).
 *
 * Next.js already rejects cross-origin calls to server actions (Origin vs
 * Host) and caps the body at 1 MB. Everything else is checked here, because
 * anyone can POST to this action without using the page:
 * honeypot, per-visitor and global rate limits, schema validation, a
 * published privacy notice, and a re-check of the chosen course.
 */
import config from "@payload-config";
import { headers } from "next/headers";
import { after } from "next/server";
import { getPayload } from "payload";
import { adminOrigin, env } from "@/lib/env";
import { clientIp } from "@/lib/leads/clientIp";
import { createLead } from "@/lib/leads/createLead";
import { RateLimiter } from "@/lib/leads/rateLimit";
import {
  ATTRIBUTION_FIELDS,
  attributionSchema,
  fieldErrorsFrom,
  leadFormSchema,
  type LeadFormState,
} from "@/lib/leads/schema";

const perVisitor = new RateLimiter(5, 10 * 60 * 1000);
// Bounds a distributed flood: no more than this many submissions an hour
// site-wide, whatever addresses they come from.
const siteWide = new RateLimiter(300, 60 * 60 * 1000);

const ECHOED = ["name", "contact", "message", "interest", "courseId"] as const;

function echo(formData: FormData) {
  const values: Partial<Record<(typeof ECHOED)[number], string>> = {};
  for (const key of ECHOED) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.slice(0, 2000);
  }
  return values;
}

function fail(
  formData: FormData,
  message: string,
  fieldErrors: Extract<LeadFormState, { status: "error" }>["fieldErrors"] = {},
): LeadFormState {
  return { status: "error", message, fieldErrors, values: echo(formData) };
}

function successMessage(responseTime: string | null | undefined): string {
  return responseTime
    ? `Thank you — we've received your message and will reply ${responseTime}.`
    : "Thank you — we've received your message. A member of the team will reply personally.";
}

export async function submitLead(
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const payload = await getPayload({ config });
  const settings = await payload.findGlobal({ slug: "site-settings", overrideAccess: true });

  // Honeypot: invisible to people, filled in by naive bots. Answer exactly
  // as for a real submission so the bot learns nothing.
  if (formData.get("website")) {
    return { status: "success", message: successMessage(settings.responseTimeCommitment) };
  }

  const ip = clientIp((await headers()).get("x-forwarded-for"), env().TRUSTED_PROXIES);
  if (!perVisitor.attempt(ip) || !siteWide.attempt("site")) {
    return fail(
      formData,
      `We've received several messages from this connection. Please wait a few minutes, or reach us directly on ${settings.phone}.`,
    );
  }

  const parsed = leadFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(formData, "Please check the highlighted fields.", fieldErrorsFrom(parsed.error));
  }
  const attribution = attributionSchema.parse(
    Object.fromEntries(ATTRIBUTION_FIELDS.map((field) => [field, formData.get(field) ?? ""])),
  );

  let result: Awaited<ReturnType<typeof createLead>>;
  try {
    result = await createLead(payload, parsed.data, attribution, {
      noticeVersion: settings.privacyNoticeVersion,
    });
  } catch (error) {
    payload.logger.error({ err: error }, "Lead submission failed");
    return fail(
      formData,
      `Sorry — something went wrong on our side and your message wasn't saved. Please try again, or reach us on ${settings.phone}.`,
    );
  }

  if (!result.ok) {
    return result.reason === "course-unavailable"
      ? fail(formData, "That course isn't open for registration.", {
          courseId: "Choose another course.",
        })
      : fail(
          formData,
          `This form isn't open yet. Please reach us on ${settings.phone} or ${settings.email}.`,
        );
  }

  const notifyTo = settings.leadNotificationEmail;
  if (notifyTo) {
    const link = `${adminOrigin(env())}/admin/collections/leads/${result.lead.id}`;
    // After the response, so a slow or failing mail server never delays
    // or breaks the visitor's submission. No personal data in the email.
    after(async () => {
      try {
        await payload.sendEmail({
          to: notifyTo,
          subject:
            parsed.data.kind === "waitlist" ? "New course waitlist sign-up" : "New website enquiry",
          text: `A new ${parsed.data.kind === "waitlist" ? "course waitlist sign-up" : "enquiry"} arrived on the website.\n\nOpen it in the CMS: ${link}`,
        });
      } catch (error) {
        payload.logger.error({ err: error }, "Lead notification email failed");
      }
    });
  }

  return { status: "success", message: successMessage(settings.responseTimeCommitment) };
}
