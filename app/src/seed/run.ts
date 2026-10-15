/**
 * Imports the approved v1 copy into the CMS.   pnpm --filter @zgate/website seed
 *
 * Safe to re-run: it only creates what's missing and never overwrites a
 * document that already exists, so editors' changes in the CMS are never
 * lost. Everything is published except the privacy notice, which stays a
 * draft until legal counsel supplies the wording.
 */
import config from "@payload-config";
import { getPayload, type Payload } from "payload";
import type { Page } from "@/payload-types";
import {
  aboutLongForm,
  company,
  courses,
  divisions,
  elevatorPitch,
  homeHowItWorks,
  mission,
  primaryCta,
  privacySkeleton,
  values,
  vision,
} from "./content";
import { heading, richText } from "./lexical";

// Seed runs outside a Next.js request: skip cache revalidation hooks.
const context = { disableRevalidate: true };

type SlugCollection = "pages" | "divisions" | "courses";

async function exists(
  payload: Payload,
  collection: SlugCollection,
  slug: string,
): Promise<boolean> {
  const result = await payload.count({
    collection,
    where: { slug: { equals: slug } },
    // Counts drafts too: a never-published draft still lives in the
    // collection with _status "draft".
    overrideAccess: true,
  });
  return result.totalDocs > 0;
}

async function seedSiteSettings(payload: Payload): Promise<void> {
  const current = await payload.findGlobal({
    slug: "site-settings",
    draft: true,
    overrideAccess: true,
  });
  if (current.legalName) {
    payload.logger.info("site-settings: already set, skipped");
    return;
  }
  await payload.updateGlobal({
    slug: "site-settings",
    context,
    overrideAccess: true,
    data: {
      legalName: company.legalName,
      tradingName: company.tradingName,
      motto: company.motto,
      elevatorPitch,
      email: company.email,
      phone: company.phone,
      address: company.address,
      enrollmentMode: "waitlist",
      privacyNoticeVersion: "draft",
      _status: "published",
    },
  });
  payload.logger.info("site-settings: created");
}

async function seedDivisions(payload: Payload): Promise<void> {
  for (const division of divisions) {
    if (await exists(payload, "divisions", division.slug)) {
      payload.logger.info(`divisions/${division.slug}: exists, skipped`);
      continue;
    }
    await payload.create({
      collection: "divisions",
      context,
      overrideAccess: true,
      data: {
        ...division,
        included: division.included.map((item) => ({ item })),
        cta: primaryCta,
        _status: "published",
      },
    });
    payload.logger.info(`divisions/${division.slug}: created`);
  }
}

async function seedCourses(payload: Payload): Promise<void> {
  for (const course of courses) {
    if (await exists(payload, "courses", course.slug)) {
      payload.logger.info(`courses/${course.slug}: exists, skipped`);
      continue;
    }
    await payload.create({
      collection: "courses",
      context,
      overrideAccess: true,
      data: { ...course, currency: "RWF", _status: "published" },
    });
    payload.logger.info(`courses/${course.slug}: created`);
  }
}

type PageSeed = Pick<Page, "title" | "slug" | "pageType" | "layout"> & { publish: boolean };

const pages: PageSeed[] = [
  {
    title: "Home",
    slug: "home",
    pageType: "marketing",
    publish: true,
    layout: [
      {
        blockType: "hero",
        eyebrow: company.motto,
        headline: "One gate, four rooms — no translation lost between them.",
        lede: elevatorPitch,
        cta: primaryCta,
      },
      { blockType: "divisionGrid", heading: "Four divisions, one relationship" },
      { blockType: "richText", heading: "How it works", content: richText(homeHowItWorks) },
      { blockType: "callToAction", heading: "Ready to talk?", ...primaryCta },
    ],
  },
  {
    title: "About",
    slug: "about",
    pageType: "marketing",
    publish: true,
    layout: [
      { blockType: "hero", headline: `About ${company.legalName}` },
      { blockType: "richText", content: richText(...aboutLongForm) },
      { blockType: "richText", heading: "Mission", content: richText(mission) },
      { blockType: "richText", heading: "Vision", content: richText(vision) },
      { blockType: "featureList", heading: "Values", items: values },
      // The v1 About page had no next step (KI-19); same CTA as every other page.
      { blockType: "callToAction", heading: "Ready to talk?", ...primaryCta },
    ],
  },
  {
    title: "Contact",
    slug: "contact",
    pageType: "marketing",
    publish: true,
    layout: [
      {
        blockType: "hero",
        headline: "Contact",
        lede: "Tell us what you need — a real person will follow up, not an automated response.",
      },
      { blockType: "leadForm", variant: "contact" },
    ],
  },
  {
    title: "Privacy notice",
    slug: "privacy",
    pageType: "legal",
    publish: false,
    layout: [
      { blockType: "hero", headline: "Privacy notice" },
      {
        blockType: "richText",
        content: richText(
          ...privacySkeleton.flatMap((section) => [heading(section.heading), section.body]),
        ),
      },
    ],
  },
];

async function seedPages(payload: Payload): Promise<void> {
  for (const { publish, ...page } of pages) {
    if (await exists(payload, "pages", page.slug)) {
      payload.logger.info(`pages/${page.slug}: exists, skipped`);
      continue;
    }
    await payload.create({
      collection: "pages",
      context,
      overrideAccess: true,
      draft: !publish,
      data: { ...page, _status: publish ? "published" : "draft" },
    });
    payload.logger.info(
      `pages/${page.slug}: created${publish ? "" : " as draft (needs legal wording)"}`,
    );
  }
}

const payload = await getPayload({ config });
try {
  await seedSiteSettings(payload);
  await seedDivisions(payload);
  await seedCourses(payload);
  await seedPages(payload);
  payload.logger.info("Seed complete.");
  process.exit(0);
} catch (error) {
  payload.logger.error({ err: error }, "Seed failed");
  process.exit(1);
}
