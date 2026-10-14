/**
 * Public lead submission rules, against a real database (skips without
 * DATABASE_URL / PAYLOAD_SECRET / SITE_URL, like access.test.ts).
 * The server action wrapper (rate limit, honeypot, headers) is exercised
 * over HTTP in the smoke checks; this covers what gets stored.
 */
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Attribution, LeadFormInput } from "@/lib/leads/schema";
import type { Course, Page } from "@/payload-types";

const canRun = Boolean(
  process.env["DATABASE_URL"] && process.env["PAYLOAD_SECRET"] && process.env["SITE_URL"],
);
const run = `t${Date.now()}`;
const startedAt = new Date().toISOString();

const attribution: Attribution = {
  utmSource: "facebook",
  utmMedium: "social",
  utmCampaign: `${run}-campaign`,
  utmContent: "",
  utmTerm: "",
  landingPage: "/academy",
  referrer: "https://www.facebook.com",
};

const contactInput: LeadFormInput = {
  kind: "contact",
  name: `${run} Visitor`,
  contact: "+250 700 000 001",
  interest: "advisory",
  message: "I need help with EBM.",
  consentContact: true,
  consentMarketing: false,
};

describe.skipIf(!canRun)("public lead submission", () => {
  let payload: Payload;
  let createLead: typeof import("@/lib/leads/createLead").createLead;
  let publishedCourse: Course;
  let draftCourse: Course;
  let privacy: {
    page: Page;
    originalStatus: "draft" | "published" | null | undefined;
    created: boolean;
  };
  const leadIds: number[] = [];

  const setPrivacyStatus = async (status: "draft" | "published") => {
    await payload.update({
      collection: "pages",
      id: privacy.page.id,
      data: { _status: status },
      overrideAccess: true,
      context: { disableRevalidate: true },
    });
  };

  beforeAll(async () => {
    const [{ getPayload }, { default: config }, leads] = await Promise.all([
      import("payload"),
      import("@payload-config"),
      import("@/lib/leads/createLead"),
    ]);
    payload = await getPayload({ config });
    createLead = leads.createLead;

    const course = (status: "draft" | "published") =>
      payload.create({
        collection: "courses",
        data: {
          title: `${run} ${status}`,
          slug: `${run}-${status}`,
          audience: "Test",
          _status: status,
        },
        draft: status === "draft",
        overrideAccess: true,
        context: { disableRevalidate: true },
      });
    publishedCourse = await course("published");
    draftCourse = await course("draft");

    const existing = await payload.find({
      collection: "pages",
      where: { slug: { equals: "privacy" } },
      draft: true,
      overrideAccess: true,
    });
    const page = existing.docs[0];
    privacy = page
      ? { page, originalStatus: page._status, created: false }
      : {
          page: await payload.create({
            collection: "pages",
            data: {
              title: "Privacy notice",
              slug: "privacy",
              pageType: "legal",
              layout: [{ blockType: "hero", headline: "Privacy notice" }],
              _status: "draft",
            },
            draft: true,
            overrideAccess: true,
            context: { disableRevalidate: true },
          }),
          originalStatus: "draft",
          created: true,
        };
    await setPrivacyStatus("draft");
  });

  afterAll(async () => {
    if (!payload) return;
    for (const id of leadIds) {
      await payload.delete({ collection: "leads", id, overrideAccess: true });
    }
    await payload.delete({
      collection: "audit-logs",
      // Only entries this run produced - never a developer's real history.
      where: {
        and: [
          { targetCollection: { equals: "leads" } },
          { createdAt: { greater_than_equal: startedAt } },
        ],
      },
      overrideAccess: true,
    });
    for (const course of [publishedCourse, draftCourse]) {
      if (course)
        await payload.delete({
          collection: "courses",
          id: course.id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        });
    }
    if (privacy?.created) {
      await payload.delete({
        collection: "pages",
        id: privacy.page.id,
        overrideAccess: true,
        context: { disableRevalidate: true },
      });
    } else if (privacy && privacy.originalStatus !== "published") {
      await setPrivacyStatus("draft");
    }
  });

  it("refuses to store personal data while no privacy notice is published", async () => {
    const result = await createLead(payload, contactInput, attribution, { noticeVersion: "test" });
    expect(result).toEqual({ ok: false, reason: "privacy-unpublished" });
  });

  describe("once the privacy notice is published", () => {
    beforeAll(async () => {
      await setPrivacyStatus("published");
    });

    it("stores an enquiry with its consent and attribution", async () => {
      const now = new Date("2026-10-14T09:00:00.000Z");
      const result = await createLead(payload, contactInput, attribution, {
        noticeVersion: "2026-10-14",
        now,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      leadIds.push(result.lead.id);
      expect(result.lead).toMatchObject({
        kind: "contact",
        status: "new",
        name: contactInput.name,
        interest: "advisory",
        consent: { contactAllowed: true, marketingAllowed: false, noticeVersion: "2026-10-14" },
        attribution: { utmSource: "facebook", utmCampaign: `${run}-campaign` },
      });
      expect(result.lead.consent.consentedAt).toBe(now.toISOString());
    });

    it("records the submission in the audit log as anonymous", async () => {
      const id = leadIds[0];
      const logs = await payload.find({
        collection: "audit-logs",
        where: {
          and: [{ targetCollection: { equals: "leads" } }, { action: { equals: "create" } }],
        },
        overrideAccess: true,
        limit: 100,
      });
      const entry = logs.docs.find((log) => (log.docIds as string[]).includes(String(id)));
      expect(entry?.actorType).toBe("anonymous");
    });

    it("refuses a waitlist sign-up for a course that isn't published", async () => {
      const result = await createLead(
        payload,
        { ...contactInput, kind: "waitlist", courseId: draftCourse.id },
        attribution,
        { noticeVersion: "test" },
      );
      expect(result).toEqual({ ok: false, reason: "course-unavailable" });
    });

    it("links a waitlist sign-up to its course and marks it as Academy interest", async () => {
      const result = await createLead(
        payload,
        { ...contactInput, kind: "waitlist", interest: undefined, courseId: publishedCourse.id },
        attribution,
        { noticeVersion: "test" },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      leadIds.push(result.lead.id);
      const course =
        typeof result.lead.course === "object" ? result.lead.course?.id : result.lead.course;
      expect(course).toBe(publishedCourse.id);
      expect(result.lead.interest).toBe("academy");
    });
  });
});
