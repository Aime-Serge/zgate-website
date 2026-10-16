/**
 * The website's "Enroll" button follows the e-learning platform's
 * enroll-link contract (@zgate/elearning-contracts). Renders the real
 * course page component, so a change on either side that breaks the
 * hand-off fails here - in this workspace's CI and in e-learning's.
 */
import { enrollLinkSchema } from "@zgate/elearning-contracts";
import type { Course, SiteSetting } from "@zgate/cms-contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CourseView } from "../../../frontend/src/components/site/CourseView.tsx";

const LMS = "https://learn.example.rw";

const settings = {
  legalName: "Z-GATE LTD",
  phone: "+250 792 957 513",
  whatsapp: null,
  email: "info@example.rw",
  enrollmentMode: "lms",
  lmsBaseUrl: LMS,
} as unknown as SiteSetting;

const course = (slug: string) =>
  ({
    id: 1,
    slug,
    title: "EBM Digital Invoicing",
    summary: "Issue and file compliant electronic invoices.",
    audience: "Small business owners and accountants",
    intakes: [],
    outcomes: [],
    syllabus: [],
  }) as unknown as Course;

const decode = (html: string) => html.replace(/&amp;/g, "&");

function enrollHref(slug: string): string {
  const html = renderToStaticMarkup(
    <CourseView
      course={course(slug)}
      settings={settings}
      siteUrl="https://www.example.rw"
      privacyLive={false}
    />,
  );
  const match = /href="([^"]*\/enroll[^"]*)"/.exec(html);
  if (!match?.[1]) throw new Error("No enroll link rendered in LMS mode");
  return decode(match[1]);
}

describe("website course page -> LMS enroll link", () => {
  for (const slug of ["ebm-digital-invoicing", "tax-bookkeeping-fundamentals", "a1"]) {
    it(`follows the enroll-link format for "${slug}"`, () => {
      const parsed = enrollLinkSchema.safeParse(enrollHref(slug));
      expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
      expect(parsed.data).toMatchObject({ origin: LMS, slug });
    });
  }
});
