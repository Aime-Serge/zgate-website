"use server";

/**
 * Public lead form handler (contact enquiries and course waitlist).
 *
 * Next.js already rejects cross-origin calls to server actions (Origin vs
 * Host) and caps the body at 1 MB. Everything else is checked here, because
 * anyone can POST to this action without using the page: honeypot,
 * per-visitor and global rate limits, and schema validation. The CMS's lead
 * intake then re-validates, checks the privacy notice and the chosen
 * course, stores the lead and notifies staff (website/backend
 * src/endpoints/leadIntake.ts).
 */
import { headers } from "next/headers";
import {
  fieldErrorsFrom,
  LEAD_INTAKE_PATH,
  type LeadFormState,
  leadFormSchema,
  type LeadIntakeResponse,
} from "@zgate/website-backend/contracts";
import { getSiteSettings } from "@/lib/cms";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/leads/clientIp";
import { RateLimiter } from "@/lib/leads/rateLimit";

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

/** Hands the submission to the CMS. Throws on transport or server errors. */
async function sendToCms(form: Record<string, string>): Promise<LeadIntakeResponse> {
  const { CMS_URL, LEAD_INTAKE_TOKEN } = env();
  if (!LEAD_INTAKE_TOKEN) throw new Error("LEAD_INTAKE_TOKEN is not set");
  const response = await fetch(`${CMS_URL}${LEAD_INTAKE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LEAD_INTAKE_TOKEN}` },
    body: JSON.stringify({ form }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 201 && response.status !== 422) {
    throw new Error(`lead intake answered HTTP ${response.status}`);
  }
  return (await response.json()) as LeadIntakeResponse;
}

export async function submitLead(
  _previous: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const settings = await getSiteSettings();

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

  const form = Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && !entry[0].startsWith("$ACTION"),
    ),
  );
  const parsed = leadFormSchema.safeParse(form);
  if (!parsed.success) {
    return fail(formData, "Please check the highlighted fields.", fieldErrorsFrom(parsed.error));
  }

  let result: LeadIntakeResponse;
  try {
    result = await sendToCms(form);
  } catch (error) {
    console.error("Lead submission failed:", error instanceof Error ? error.message : error);
    return fail(
      formData,
      `Sorry — something went wrong on our side and your message wasn't saved. Please try again, or reach us on ${settings.phone}.`,
    );
  }

  if (!result.ok) {
    switch (result.reason) {
      case "invalid":
        return fail(formData, "Please check the highlighted fields.", result.fieldErrors);
      case "course-unavailable":
        return fail(formData, "That course isn't open for registration.", {
          courseId: "Choose another course.",
        });
      case "privacy-unpublished":
        return fail(
          formData,
          `This form isn't open yet. Please reach us on ${settings.phone} or ${settings.email}.`,
        );
    }
  }

  return { status: "success", message: successMessage(settings.responseTimeCommitment) };
}
