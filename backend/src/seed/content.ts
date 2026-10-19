/**
 * Approved copy imported into the CMS on first run. Moved verbatim from
 * the v1 site (e-learning repository, legacy/ops/src/lib/content.ts), which sourced every string
 * from the approved business documents - nothing here is written
 * freehand. After seeding, the CMS is the source of truth; edit content
 * there, not here.
 */

export const company = {
  legalName: "Z-GATE LTD",
  tradingName: "Z-GATE Solution",
  motto: "Where Business Meets Technology",
  // docs/discovery/BUSINESS_ALIGNMENT.md - confirmed address.
  address: "Inyarurembo, Kiyovu, Nyarugenge, Kigali, Rwanda",
  // Business Project Development Report - the registered contact.
  email: "info@zgaterw.com",
  phone: "+250 792 957 513",
} as const;

// Mission/Vision doc, "Elevator Pitch (short paragraph)".
export const elevatorPitch =
  "Most businesses hire a tax consultant, a trainer, a developer, and a data analyst separately — and spend half their time translating between them. Z-GATE Solution puts all four under one roof. Advisory keeps the business compliant and financially sound. Academy builds the skills the team needs to run it. Tech builds the systems it runs on. Data tells you, in numbers, whether any of it is working. One gate, four rooms, no translation lost between them.";

// Mission/Vision doc, "About Z-GATE Solution (long form)".
export const aboutLongForm = [
  "Z-GATE Solution was built on a simple observation: the businesses that struggle most aren't the ones with bad ideas — they're the ones whose finances, people, technology, and data all live in different places, run by different vendors, none of whom talk to each other.",
  "A gate is the one point where two different worlds agree to meet. That's the idea the company is named for. On one side sits the discipline of business — tax law, compliance, financial planning, professional skill. On the other sits technology — software, systems, data, automation. Most companies make a client walk back and forth between the two. Z-GATE puts both sides of that gate under one roof, as four divisions that already speak to each other.",
  "A client doesn't hire four vendors and manage the seams themselves. They come through one gate, and the four rooms on the other side already know why they're there.",
];

// Mission/Vision doc, "Mission" and "Vision".
export const mission =
  "To be the single point of entry where a business's financial discipline, its people's skills, its technology, and its data stop operating as separate projects and start operating as one system.";
export const vision =
  'A future where a growing business never has to choose between "get good advice," "train our people," "build the technology," and "understand our numbers" — because all four are one relationship, one standard of quality, and one team that already knows the business.';

// Mission/Vision doc, "Values".
export const values = [
  {
    title: "Threshold, not silo",
    body: "A client is never handed off and forgotten. Advisory, Academy, Tech, and Data share context, so a recommendation made in one room is already understood in the other three.",
  },
  {
    title: "Precision over polish",
    body: "In tax, in code, in a training curriculum, in a dashboard — a number that's wrong or a fact that's rounded off is a bigger failure than a page that isn't pretty. Get it right before making it look good.",
  },
  {
    title: "Warm engineering",
    body: "Technical work done for a person, not around them. Every deliverable — a filing, a course, a build, a report — is written and explained so the person receiving it actually understands what changed and why.",
  },
];

export const homeHowItWorks =
  "A client doesn't hire four vendors and manage the seams themselves. Advisory, Academy, Tech, and Data share context, so a recommendation made in one room is already understood in the other three — they come through one gate, and the four rooms on the other side already know why they're there.";

export const primaryCta = { label: "Start a conversation", href: "/contact" } as const;

export type DivisionSeed = {
  slug: "advisory" | "academy" | "tech" | "data";
  order: number;
  name: string;
  shortName: string;
  mission: string;
  about: string;
  included: string[];
  proof: string;
  objection: { question: string; answer: string };
};

// Mission/Vision doc "Division Copy" + Client SLA Template Part 2 scope;
// proof/objection from docs/marketing/MESSAGING_FRAMEWORK.md.
export const divisions: DivisionSeed[] = [
  {
    slug: "advisory",
    order: 1,
    name: "Z-GATE Advisory",
    shortName: "Advisory",
    mission:
      "To keep a business compliant, tax-efficient, and financially sound, so leadership can make decisions on solid ground instead of guesswork.",
    about:
      "Z-GATE Advisory handles the parts of the business that don't forgive a mistake — tax filings, compliance, financial structuring, business consulting. The work is judged on one standard: is the number right, and is the business protected. Advisory clients get direct answers, not hedged ones, and a filing calendar they never have to chase.",
    included: [
      "Tax representation and advisory before the Rwanda Revenue Authority (RRA)",
      "Preparation and filing of personal and business income tax returns",
      "EBM (Electronic Billing Machine) setup support and ongoing compliance monitoring",
      "Monthly bookkeeping and recording of commercial transactions",
      "Business and management advisory on request",
    ],
    proof:
      "Advisory is Z-GATE's registered main business activity — tax representation and advisory before the Rwanda Revenue Authority. Our published service commitments include filing at least 2 business days ahead of any statutory deadline and responding to an urgent compliance issue within 4 business hours.",
    objection: {
      question: "Can I afford ongoing help?",
      answer:
        "Weigh it against the cost of getting EBM or VAT wrong. A retainer is a fixed, predictable cost; a missed filing isn't.",
    },
  },
  {
    slug: "academy",
    order: 2,
    name: "Z-GATE Academy",
    shortName: "Academy",
    mission:
      "To build the specific, usable skills a team needs to do the job in front of them — not a certificate for the wall, but a capability the business can point to.",
    about:
      "Z-GATE Academy runs professional training built around real outputs: a team that ships its first project, closes its first deal differently, or reads its first financial statement correctly, before the course ends. Curricula are built with Advisory, Tech, and Data, so training reflects the actual tools and standards a client's business already uses.",
    included: [
      "Delivery of the agreed course(s) per the published curriculum and schedule",
      "Learner enrollment, attendance tracking, and progress assessment",
      "Certificate issuance on successful course completion",
    ],
    proof:
      "Our first two courses are built directly from Advisory's own anonymized client casework, not generic material — real compliance problems SME owners actually bring in.",
    objection: {
      question: "Will this certificate mean anything to an employer?",
      answer:
        "We don't have an employer-verification track record yet — what we can promise is a curriculum built from real work, not slides. See each course's outline before you enroll.",
    },
  },
  {
    slug: "tech",
    order: 3,
    name: "Z-GATE Tech",
    shortName: "Tech",
    mission:
      "To build the systems a business runs on — reliable, maintainable, and built for the business it's actually serving, not a generic template.",
    about:
      "Z-GATE Tech designs and builds the software, infrastructure, and automation that let the rest of a client's business move faster. Every system is built with a plain-language explanation of what it does and how to run it — nothing shipped as a black box.",
    included: [
      "Design, development, and maintenance of software, systems, or web applications per the agreed project brief",
      "Onsite or remote management of the Client's computer systems and data-processing facilities, where contracted",
      "Hosting and infrastructure support for systems Z-GATE builds or manages",
    ],
    proof:
      "Our published support commitments: 2-hour first response on a critical outage, 99% monthly uptime target. This very site and Advisory's own client portal are built by the same team — an internal reference before an external sale.",
    objection: {
      question: "Do you have external Tech clients yet?",
      answer:
        "Tech is proving itself internally first, on Z-GATE's own systems, before taking on external client work — the same discipline we'd apply to any client's build.",
    },
  },
  {
    slug: "data",
    order: 4,
    name: "Z-GATE Data",
    shortName: "Data",
    mission:
      'To turn what a business already has — transactions, operations, training records, systems logs — into a clear, honest answer to "is this working."',
    about:
      "Z-GATE Data builds the dashboards, reports, and analysis that tell leadership what's actually happening, not what looks good in a slide. Because Data sits alongside Advisory, Academy, and Tech, its numbers are built on the business's real financial, training, and system data — not a disconnected export.",
    included: [
      "Data entry and data processing from the Client's records into an agreed format",
      "Standard reporting and dashboard delivery on the agreed cadence",
      "Ad hoc analysis on request, quoted separately if outside the retainer scope",
    ],
    proof:
      "Our published accuracy target is 99.5%, verified by sample audit before delivery. Reports are shared only through access-controlled channels — never open links or unsecured email.",
    objection: {
      question: "Will my data be mixed with anyone else's?",
      answer:
        "No. We don't use one client's data to build or benchmark another client's work without written consent.",
    },
  },
];

// Academy Course Curriculum (also seeded by the e-learning API, migration 010).
// Outcomes, syllabus and intake dates are left empty on purpose: they
// aren't in the approved source available here, so they're not invented.
export const courses = [
  {
    slug: "tax-bookkeeping-fundamentals",
    title: "Tax & Bookkeeping Fundamentals for Small Business Owners",
    audience: "SME owners and staff; no prior accounting background required",
    duration: "4 weeks — 8 sessions, 1.5 hrs each",
    priceAmount: 40000,
    priceNote: "per learner",
  },
  {
    slug: "ebm-digital-invoicing",
    title: "EBM & Digital Invoicing Mastery",
    audience: "SME owners and staff who issue or are required to issue EBM receipts",
    duration: "2 weeks — 4 sessions, 1.5 hrs each",
    priceAmount: 40000,
    priceNote: "per learner",
  },
] as const;

/**
 * Privacy notice skeleton. Seeded as a DRAFT and never published by the
 * seed: the wording must come from the DPO / legal counsel (Law N°
 * 058/2021). The headings list what the notice has to cover; the
 * bracketed lines are deliberately unfinished.
 */
export const privacySkeleton = [
  {
    heading: "Who we are",
    body: "[Controller identity and contact details - to be completed by the DPO / legal counsel.]",
  },
  {
    heading: "What we collect and why",
    body: "[Each purpose and its lawful basis - to be completed.]",
  },
  {
    heading: "How long we keep it",
    body: "[Retention periods - to be confirmed by legal counsel.]",
  },
  {
    heading: "Who we share it with",
    body: "[Sub-processors and any cross-border transfer - to be completed.]",
  },
  {
    heading: "Your rights",
    body: "[Access, correction, deletion, objection, and how to exercise them - to be completed.]",
  },
  {
    heading: "Contact and complaints",
    body: "[DPO contact and the supervisory authority (NCSA) - to be completed.]",
  },
];
