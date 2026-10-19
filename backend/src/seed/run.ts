/**
 * Imports the approved copy into the CMS.   pnpm --filter @zgate/website-backend seed
 *
 * Safe to re-run: it creates what's missing and never overwrites an
 * editor's work. On a CMS seeded before a content-model change it also
 * upgrades what's safe to upgrade:
 *  - a new, still-empty field is filled in (divisions, courses, settings);
 *  - a page's layout is replaced only while the page is untouched - its
 *    only version is the one the seed created.
 * Anything an editor has changed, or has an unpublished draft of, is left
 * alone and logged. Everything is published except the privacy notice,
 * which stays a draft until legal counsel supplies the wording.
 */
import config from "@payload-config";
import { getPayload, type Payload } from "payload";
import type { Page } from "@zgate/cms-contracts/payload-types";
import {
  aboutLongForm,
  boilerplate,
  company,
  companyFacts,
  courses,
  divisions,
  elevatorPitch,
  mission,
  primaryCta,
  primaryMessage,
  privacySkeleton,
  values,
  vision,
} from "./content";
import { heading, richText } from "./lexical";

// Seed runs outside a Next.js request: skip cache revalidation hooks.
const context = { disableRevalidate: true };

type SlugCollection = "pages" | "divisions" | "courses";

/** The document with this slug, including an unpublished draft, or null. */
async function findBySlug(payload: Payload, collection: SlugCollection, slug: string) {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    draft: true,
    limit: 1,
    depth: 0,
    // Finds drafts too: a never-published draft still lives in the
    // collection with _status "draft".
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

/** Untouched = nobody has saved it since the seed created it. */
async function untouched(payload: Payload, collection: SlugCollection, id: number) {
  const { totalDocs } = await payload.countVersions({
    collection,
    where: { parent: { equals: id } },
    overrideAccess: true,
  });
  return totalDocs <= 1;
}

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

/** The seed's values for fields the document doesn't have yet. */
function missingFields(doc: Record<string, unknown>, seed: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(seed).filter(([key]) => isEmpty(doc[key])));
}

async function seedSiteSettings(payload: Payload): Promise<void> {
  const current = await payload.findGlobal({
    slug: "site-settings",
    draft: true,
    overrideAccess: true,
  });
  const additions = {
    boilerplate,
    companyFacts: companyFacts.map((fact) => ({ fact })),
  };
  if (current.legalName) {
    const missing = missingFields(current as unknown as Record<string, unknown>, additions);
    if (Object.keys(missing).length === 0) {
      payload.logger.info("site-settings: already set, skipped");
      return;
    }
    if (current._status === "draft") {
      payload.logger.warn("site-settings: has an unpublished draft, new fields not filled");
      return;
    }
    await payload.updateGlobal({
      slug: "site-settings",
      context,
      overrideAccess: true,
      data: { ...missing, _status: "published" },
    });
    payload.logger.info(`site-settings: filled ${Object.keys(missing).join(", ")}`);
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
      ...additions,
      _status: "published",
    },
  });
  payload.logger.info("site-settings: created");
}

/**
 * Creates the document, or fills the fields an existing one is missing.
 * Never changes a field that already has a value.
 */
async function seedDocument(
  payload: Payload,
  collection: "divisions" | "courses",
  slug: string,
  data: Record<string, unknown>,
): Promise<void> {
  const existing = await findBySlug(payload, collection, slug);
  const label = `${collection}/${slug}`;
  if (!existing) {
    await payload.create({
      collection,
      context,
      overrideAccess: true,
      data: { ...data, _status: "published" } as never,
    });
    payload.logger.info(`${label}: created`);
    return;
  }
  const missing = missingFields(existing as unknown as Record<string, unknown>, data);
  if (Object.keys(missing).length === 0) {
    payload.logger.info(`${label}: exists, skipped`);
    return;
  }
  if (existing._status === "draft") {
    payload.logger.warn(`${label}: has an unpublished draft, new fields not filled`);
    return;
  }
  await payload.update({
    collection,
    id: existing.id,
    context,
    overrideAccess: true,
    data: { ...missing, _status: "published" } as never,
  });
  payload.logger.info(`${label}: filled ${Object.keys(missing).join(", ")}`);
}

async function seedDivisions(payload: Payload): Promise<void> {
  for (const { included, ...division } of divisions) {
    await seedDocument(payload, "divisions", division.slug, {
      ...division,
      included: included.map((item) => ({ item })),
      cta: primaryCta,
    });
  }
}

async function seedCourses(payload: Payload): Promise<void> {
  for (const { outcomes, ...course } of courses) {
    await seedDocument(payload, "courses", course.slug, {
      ...course,
      outcomes: outcomes.map((outcome) => ({ outcome })),
      currency: "RWF",
    });
  }
}

type PageSeed = Pick<Page, "title" | "slug" | "pageType" | "layout"> & { publish: boolean };

/*
 * Page layouts. Copy is approved text (see content.ts) except the interface
 * wording of the doors and the steps, which restates approved facts - the
 * ICPs' core needs (docs/marketing/ICP.md) and the consultation funnel
 * (docs/marketing/CONVERSION_FUNNEL.md) - for the Marketing lead to review.
 */
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
        // The approved primary message (90-Day Plan §B1). Names the four
        // services and the pain in one line, so a cold visitor can tell
        // what Z-GATE does in five seconds (commercial-readiness review).
        headline: primaryMessage.headline,
        lede: `${primaryMessage.answer} Advisory keeps the business compliant and financially sound. Academy builds the skills the team needs to run it. Tech builds the systems it runs on. Data tells you, in numbers, whether any of it is working.`,
        cta: primaryCta,
        visual: "gate",
      },
      { blockType: "factStrip" },
      {
        blockType: "doors",
        eyebrow: "Start here",
        heading: "What do you need help with?",
        items: [
          {
            need: "My EBM, VAT or bookkeeping is giving me trouble",
            answer:
              "Advisory files, reconciles and keeps you compliant, and tells you plainly where you stand.",
            division: "advisory",
            label: "See Advisory",
            href: "/advisory",
          },
          {
            need: "I'm juggling separate vendors for books, systems and reporting",
            answer:
              "Bring them into one relationship: Advisory, Tech and Data already share context.",
            division: "bundle",
            label: "Start a conversation",
            href: "/contact",
          },
          {
            need: "I want a practical skill I can use straight away",
            answer:
              "Short Academy courses in tax, bookkeeping and EBM, built from real Advisory cases.",
            division: "academy",
            label: "See Academy",
            href: "/academy",
          },
          {
            need: "We have records, but no clear answer from them",
            answer:
              "Data turns transactions, operations and training records into reports you can act on.",
            division: "data",
            label: "See Data",
            href: "/data",
          },
        ],
      },
      {
        blockType: "marketFacts",
        eyebrow: "The problem",
        heading: "Every sale needs an EBM receipt — and most small businesses find that hard.",
        items: [
          {
            figure: "59%",
            statement:
              "of Rwandan SMEs report difficulty operating their Electronic Billing Machine (EBM)",
          },
          { figure: "51%", statement: "cite affordability as a barrier" },
        ],
        source:
          "Peer-reviewed EBM/VAT compliance studies of Rwandan SMEs, as cited in Z-GATE's 90-Day Business Plan (August 2026).",
      },
      {
        blockType: "divisionGrid",
        eyebrow: "One gate, four rooms",
        heading: "Four divisions that already talk to each other",
        intro:
          "Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately — and spend half their time translating between them. Z-GATE Solution puts all four under one roof.",
      },
      {
        blockType: "commitments",
        eyebrow: "The number first",
        heading: "What we commit to, in writing",
        items: [
          {
            figure: "2 days",
            label: "VAT and EBM returns filed at least 2 business days before the deadline",
            division: "advisory",
          },
          {
            figure: "4 hrs",
            label: "First response to an urgent compliance issue, such as an EBM failure",
            division: "advisory",
          },
          {
            figure: "5 days",
            label: "Academy certificates issued within 5 business days of completing a course",
            division: "academy",
          },
          {
            figure: "2 hrs",
            label: "First response when a system we run is down",
            division: "tech",
          },
          {
            figure: "99.5%",
            label: "Data accuracy target, verified by sample audit before delivery",
            division: "data",
          },
        ],
        note: "Targets from our client service agreements: commitments we are held to, not past results.",
      },
      {
        blockType: "steps",
        eyebrow: "How it works",
        heading: "From first message to one agreement",
        items: [
          {
            title: "Tell us what you need",
            body: "Message us on WhatsApp, call or email. A short description is enough.",
          },
          {
            title: "Talk to a person",
            body: "Someone from Z-GATE replies personally and works out which division fits.",
          },
          {
            title: "Get direct answers",
            body: "We go through your situation plainly, including what's in scope and what it costs.",
          },
          {
            title: "Sign one agreement",
            body: "One master agreement, with a schedule for each service you choose. Anything outside it is quoted before work starts.",
          },
        ],
      },
      {
        blockType: "callToAction",
        heading: "Ready to talk?",
        body: "A real person will reply — not an automated response.",
        ...primaryCta,
      },
    ],
  },
  {
    title: "About",
    slug: "about",
    pageType: "marketing",
    publish: true,
    layout: [
      {
        blockType: "hero",
        eyebrow: `About ${company.tradingName}`,
        // Messaging Framework level 1, the core philosophy.
        headline: "One gate. Four rooms. No translation lost between them.",
        lede: aboutLongForm[0],
      },
      {
        blockType: "richText",
        eyebrow: "Why one company",
        heading: "Both sides of the gate, under one roof",
        content: richText(...aboutLongForm.slice(1)),
      },
      {
        blockType: "featureList",
        eyebrow: "Where we're going",
        heading: "Mission and vision",
        items: [
          { title: "Mission", body: mission },
          { title: "Vision", body: vision },
        ],
      },
      {
        blockType: "featureList",
        eyebrow: "What we hold to",
        heading: "Values",
        numbered: true,
        items: values,
      },
      { blockType: "factStrip", heading: "Company facts" },
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
        eyebrow: "Contact",
        headline: "Talk to a person at Z-GATE",
        lede: "Tell us what you need — a real person will follow up, not an automated response.",
      },
      {
        blockType: "steps",
        heading: "What happens next",
        items: [
          {
            title: "You send a message",
            body: "On WhatsApp, by phone, by email or with the form. A few lines are enough.",
          },
          {
            title: "We reply personally",
            body: "Someone from Z-GATE answers on the channel you used.",
          },
          {
            title: "We find the right room",
            body: "We work out which of our four divisions fits your need, and the next step.",
          },
        ],
      },
      { blockType: "leadForm", variant: "contact", heading: "Send us a message" },
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
    const existing = await findBySlug(payload, "pages", page.slug);
    if (!existing) {
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
    } else if (!publish || !(await untouched(payload, "pages", existing.id))) {
      payload.logger.info(`pages/${page.slug}: exists (edited in the CMS or a draft), kept`);
    } else {
      await payload.update({
        collection: "pages",
        id: existing.id,
        context,
        overrideAccess: true,
        data: { layout: page.layout, _status: "published" },
      });
      payload.logger.info(`pages/${page.slug}: untouched since seeding, layout upgraded`);
    }
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
