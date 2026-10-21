/**
 * A course is joined across products by its slug (ADR-007). The slugs the
 * website's CMS accepts must be exactly the ones the e-learning platform's
 * contract accepts, or a course could exist on one side and be unreachable
 * on the other.
 */
import { courseSlugSchema } from "@zgate/elearning-contracts";
import { describe, expect, it, test } from "vitest";
import { isValidSlug } from "@zgate/cms-contracts";

const samples = [
  "tax-bookkeeping-fundamentals",
  "ebm-digital-invoicing",
  "a1",
  "course-2026",
  "Tax",
  "tax basics",
  "-lead",
  "trail-",
  "double--hyphen",
  "../etc",
  "taxé",
  "",
];

// The CMS (backend/content/validators.py) enforces the same pattern;
// backend/content/tests/test_validators.py runs these samples against it.
const cmsAccepts = isValidSlug;

describe("course slugs: website CMS == e-learning contract", () => {
  for (const slug of samples) {
    it(JSON.stringify(slug), () => {
      expect(courseSlugSchema.safeParse(slug).success).toBe(cmsAccepts(slug));
    });
  }
});

// Not built yet: the website reads courses from its own CMS, and the
// e-learning API doesn't serve the catalog. When it does, parse a real
// response here with catalogResponseSchema and check every field the
// course page shows. Reported as "todo", never as passed.
test.todo("the website renders its course pages from GET /api/v1/public/catalog (not built yet)");
