/**
 * POST /api/lead-intake - stores a public form submission handed over by
 * the website frontend (contracts/leadIntake.ts).
 *
 * The frontend already applies the visitor-facing checks it alone can
 * (honeypot, per-visitor rate limits - it sees the visitor's address) and
 * validates for field errors. Everything is validated again here: the
 * token proves the caller is our frontend, not that its input is sound.
 */
import { timingSafeEqual } from "node:crypto";
import type { Endpoint, Payload } from "payload";
import type { LeadIntakeResponse } from "@zgate/website-contracts";
import {
  ATTRIBUTION_FIELDS,
  attributionSchema,
  fieldErrorsFrom,
  leadFormSchema,
} from "@zgate/website-contracts";
import { env } from "@/lib/env";
import { createLead } from "@/lib/leads/createLead";

type Result = { status: number; body: LeadIntakeResponse | { error: string } };

/** Constant-time `Bearer <token>` check. */
export function bearerMatches(header: string | null, token: string): boolean {
  const presented = Buffer.from(header?.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(token);
  return presented.length === expected.length && timingSafeEqual(presented, expected);
}

const asForm = (body: unknown): Record<string, string> | null => {
  const form = (body as { form?: unknown } | null)?.form;
  if (!form || typeof form !== "object" || Array.isArray(form)) return null;
  return Object.fromEntries(
    Object.entries(form).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
};

export async function handleLeadIntake(
  payload: Payload,
  request: { authorization: string | null; readBody: () => Promise<unknown> },
  config: { token: string | undefined; adminUrl: string },
): Promise<Result> {
  if (!config.token) return { status: 503, body: { error: "lead intake is not configured" } };
  if (!bearerMatches(request.authorization, config.token)) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  // Read only once the caller is known to be the frontend.
  let body: unknown = null;
  try {
    body = await request.readBody();
  } catch {
    // Malformed JSON is answered as a 400 below.
  }
  const form = asForm(body);
  if (!form) return { status: 400, body: { error: "expected { form: { ... } }" } };

  const parsed = leadFormSchema.safeParse(form);
  if (!parsed.success) {
    return {
      status: 422,
      body: { ok: false, reason: "invalid", fieldErrors: fieldErrorsFrom(parsed.error) },
    };
  }
  const attribution = attributionSchema.parse(
    Object.fromEntries(ATTRIBUTION_FIELDS.map((field) => [field, form[field] ?? ""])),
  );

  const settings = await payload.findGlobal({ slug: "site-settings", overrideAccess: true });
  const result = await createLead(payload, parsed.data, attribution, {
    noticeVersion: settings.privacyNoticeVersion,
  });
  if (!result.ok) return { status: 422, body: { ok: false, reason: result.reason } };

  const notifyTo = settings.leadNotificationEmail;
  if (notifyTo) {
    const waitlist = parsed.data.kind === "waitlist";
    const link = `${config.adminUrl}/admin/collections/leads/${result.lead.id}`;
    // Not awaited, so a slow or failing mail server never delays or breaks
    // the visitor's submission. No personal data in the email.
    void payload
      .sendEmail({
        to: notifyTo,
        subject: waitlist ? "New course waitlist sign-up" : "New website enquiry",
        text: `A new ${waitlist ? "course waitlist sign-up" : "enquiry"} arrived on the website.\n\nOpen it in the CMS: ${link}`,
      })
      .catch((error: unknown) => {
        payload.logger.error({ err: error }, "Lead notification email failed");
      });
  }

  return { status: 201, body: { ok: true, leadId: result.lead.id } };
}

export const leadIntakeEndpoint: Endpoint = {
  path: "/lead-intake",
  method: "post",
  handler: async (req) => {
    const config = env();
    try {
      const result = await handleLeadIntake(
        req.payload,
        {
          authorization: req.headers.get("authorization"),
          readBody: async () => (req.json ? await req.json() : null),
        },
        { token: config.LEAD_INTAKE_TOKEN, adminUrl: config.ADMIN_URL },
      );
      return Response.json(result.body, { status: result.status });
    } catch (error) {
      req.payload.logger.error({ err: error }, "Lead intake failed");
      return Response.json({ error: "lead could not be stored" }, { status: 500 });
    }
  },
};
