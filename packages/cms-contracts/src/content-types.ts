/**
 * The content the website frontend reads from the CMS's JSON API
 * (backend/content/views.py, shapes built in backend/content/serializers.py).
 * Hand-written to match the serializers: a field renamed there must be
 * renamed here, and the frontend's typecheck then shows every use.
 *
 * Every document is published content only - the API never serves drafts.
 * Rich text arrives as HTML, already sanitized by the CMS (an allowlist of
 * p, br, h2, h3, strong, em, ul, ol, li and a[href]).
 */
import type { DivisionSlug } from "./divisions.ts";

/** Sanitized HTML from a CMS rich-text field. */
export type RichTextHtml = string;

export type Meta = {
  title?: string | null;
  description?: string | null;
};

type BlockBase = { id?: string | null };

export interface HeroBlock extends BlockBase {
  blockType: "hero";
  eyebrow?: string | null;
  headline: string;
  /** The headline's opening words, shown in the brand gradient (the CMS checks they match). */
  headlineAccent?: string | null;
  lede?: string | null;
  cta?: { label?: string | null; href?: string | null };
  layout?: ("stacked" | "split" | "centered") | null;
  visual?: ("none" | "gate") | null;
}

export interface FactStripBlock extends BlockBase {
  blockType: "factStrip";
  heading?: string | null;
}

export interface DoorsBlock extends BlockBase {
  blockType: "doors";
  eyebrow?: string | null;
  heading: string;
  items: {
    id?: string | null;
    need: string;
    answer?: string | null;
    division?: (DivisionSlug | "bundle") | null;
    label: string;
    href: string;
  }[];
}

export interface MarketFactsBlock extends BlockBase {
  blockType: "marketFacts";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: { id?: string | null; figure: string; statement: string }[];
  source: string;
}

export interface DivisionGridBlock extends BlockBase {
  blockType: "divisionGrid";
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
}

export interface CommitmentsBlock extends BlockBase {
  blockType: "commitments";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: { id?: string | null; figure: string; label: string; division?: DivisionSlug | null }[];
  note: string;
}

export interface StepsBlock extends BlockBase {
  blockType: "steps";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: { id?: string | null; title: string; body?: string | null }[];
}

export interface RichTextBlock extends BlockBase {
  blockType: "richText";
  eyebrow?: string | null;
  heading?: string | null;
  content: RichTextHtml;
}

export interface FeatureListBlock extends BlockBase {
  blockType: "featureList";
  eyebrow?: string | null;
  heading?: string | null;
  numbered?: boolean | null;
  items: { id?: string | null; title: string; body?: string | null }[];
}

export interface CourseListBlock extends BlockBase {
  blockType: "courseList";
  eyebrow?: string | null;
  heading?: string | null;
  /** Published courses only; empty means "every published course". */
  courses?: Course[] | null;
}

export interface FaqBlock extends BlockBase {
  blockType: "faq";
  eyebrow?: string | null;
  heading?: string | null;
  items: { id?: string | null; question: string; answer: string }[];
}

export interface CallToActionBlock extends BlockBase {
  blockType: "callToAction";
  eyebrow?: string | null;
  heading: string;
  body?: string | null;
  label: string;
  href: string;
}

export interface LeadFormBlock extends BlockBase {
  blockType: "leadForm";
  heading?: string | null;
  intro?: string | null;
  variant: "contact" | "waitlist";
}

type Tone = (DivisionSlug | "bundle") | null;

/** The services console: one tab per division (from its own page) beside how a request moves. */
export interface ShowcaseBlock extends BlockBase {
  blockType: "showcase";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  stepsHeading: string;
  steps: string[];
}

export interface SpotlightsBlock extends BlockBase {
  blockType: "spotlights";
  items: {
    id?: string | null;
    eyebrow?: string | null;
    title: string;
    body?: string | null;
    division?: Tone;
    label: string;
    href: string;
  }[];
}

export interface PillarsBlock extends BlockBase {
  blockType: "pillars";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: { id?: string | null; title: string; body: string; division?: DivisionSlug | null }[];
}

export interface AudiencesBlock extends BlockBase {
  blockType: "audiences";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: {
    id?: string | null;
    tab: string;
    headline: string;
    body: string;
    points: string[];
    division?: Tone;
    label: string;
    href: string;
  }[];
}

export interface ScenariosBlock extends BlockBase {
  blockType: "scenarios";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
  items: {
    id?: string | null;
    situation: string;
    response: string;
    figure?: string | null;
    figureLabel?: string | null;
    division?: DivisionSlug | null;
  }[];
  /** Always says these are typical requests, not case studies. */
  note: string;
}

export interface TrustBlock extends BlockBase {
  blockType: "trust";
  eyebrow?: string | null;
  heading: string;
  items: { id?: string | null; title: string; body: string }[];
  link?: { label?: string | null; href?: string | null };
}

/** The newest published courses and articles; the CMS sends only the headings. */
export interface LatestBlock extends BlockBase {
  blockType: "latest";
  eyebrow?: string | null;
  heading: string;
  intro?: string | null;
}

/** Every published solution page as a card; the CMS sends only the headings. */
export interface SolutionGridBlock extends BlockBase {
  blockType: "solutionGrid";
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
}

export type PageBlock =
  | HeroBlock
  | FactStripBlock
  | DoorsBlock
  | MarketFactsBlock
  | DivisionGridBlock
  | CommitmentsBlock
  | StepsBlock
  | RichTextBlock
  | FeatureListBlock
  | CourseListBlock
  | FaqBlock
  | CallToActionBlock
  | LeadFormBlock
  | ShowcaseBlock
  | SpotlightsBlock
  | PillarsBlock
  | AudiencesBlock
  | ScenariosBlock
  | TrustBlock
  | LatestBlock
  | SolutionGridBlock;

type Timestamps = { updatedAt?: string | null; createdAt?: string | null };

export interface Page extends Timestamps {
  id: number;
  title: string;
  slug: string;
  /** "solution" pages are published at /solutions/<slug>; meta.description is their summary. */
  pageType: "marketing" | "solution" | "legal";
  layout: PageBlock[];
  meta?: Meta;
}

export interface Division extends Timestamps {
  id: number;
  slug: DivisionSlug;
  order: number;
  name: string;
  shortName: string;
  subtitle?: string | null;
  pillar?: string | null;
  headline?: string | null;
  mission: string;
  about: string;
  audience?: string | null;
  included: { id?: string | null; item: string }[];
  proof: string;
  commitments?: { id?: string | null; figure: string; label: string }[] | null;
  objection: { question: string; answer: string };
  faq?: { id?: string | null; question: string; answer: string }[] | null;
  cta: { label: string; href: string };
  meta?: Meta;
}

export interface Course extends Timestamps {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  audience: string;
  outcomes?: { id?: string | null; outcome: string }[] | null;
  syllabus?: { id?: string | null; title: string; summary?: string | null }[] | null;
  format?: string | null;
  duration?: string | null;
  priceAmount?: number | null;
  currency?: "RWF" | null;
  priceNote?: string | null;
  intakes?: { id?: string | null; label: string; startsOn: string }[] | null;
  meta?: Meta;
}

export interface Article extends Timestamps {
  id: number;
  title: string;
  slug: string;
  publishedOn: string;
  authorName: string;
  excerpt: string;
  body: RichTextHtml;
  meta?: Meta;
}

/**
 * A demo in the Demo Library (/demos). Without a videoUrl it is a
 * placeholder: the site shows "Coming soon" and offers a live walkthrough.
 */
export interface Demo extends Timestamps {
  id: number;
  slug: string;
  title: string;
  summary: string;
  division: DivisionSlug | "bundle";
  /** The solution pages ("kinds of business") it is for. */
  audiences: { slug: string; title: string }[];
  format: "video" | "tour" | "live";
  videoUrl?: string | null;
  /** Only when there is a video, e.g. "2 min 15 s". */
  duration?: string | null;
}

export interface Redirect {
  id: number;
  from: string;
  to: string;
  permanent?: boolean | null;
}

/** Public settings only: the staff notification inbox never leaves the CMS. */
export interface SiteSetting {
  id: number;
  legalName: string;
  tradingName: string;
  motto: string;
  elevatorPitch: string;
  audienceLine?: string | null;
  boilerplate?: string | null;
  companyFacts?: { id?: string | null; fact: string }[] | null;
  announcement?: { text?: string | null; label?: string | null; href?: string | null };
  email: string;
  phone: string;
  whatsapp?: string | null;
  address: string;
  responseTimeCommitment?: string | null;
  social?:
    | {
        id?: string | null;
        network: "facebook" | "linkedin" | "instagram" | "x" | "youtube" | "tiktok";
        url: string;
      }[]
    | null;
  enrollmentMode: "waitlist" | "lms";
  lmsBaseUrl?: string | null;
  privacyNoticeVersion: string;
}
