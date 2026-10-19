/**
 * Page-building blocks. Deliberately absent: testimonial, rating and client
 * logo blocks. Z-GATE has no real, consented social proof yet, and the
 * brand rule is never to fabricate it (docs/04-WEBSITE.md §4). Adding one
 * is a reviewed schema change, not an editor's choice.
 *
 * Numbers are allowed only in two shapes that can't carry invented proof:
 * cited market research (a figure can't be saved without its source) and
 * our own published service commitments (always captioned as commitments,
 * never results).
 */
import type { Block, Field } from "payload";
import { DIVISION_SLUGS } from "@zgate/cms-contracts";
import { linkFields } from "@/fields/common";

/** Small mono label above a section heading - the brand guide's eyebrow. */
const eyebrowField: Field = { name: "eyebrow", type: "text", maxLength: 60 };

const divisionField = (allowBundle: boolean): Field => ({
  name: "division",
  type: "select",
  options: [
    ...DIVISION_SLUGS.map((value) => ({ label: value, value })),
    ...(allowBundle ? [{ label: "All four (one relationship)", value: "bundle" }] : []),
  ],
  admin: { description: "Sets the colour. Each division keeps its own." },
});

export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    { name: "eyebrow", type: "text", maxLength: 80 },
    { name: "headline", type: "textarea", required: true, maxLength: 160 },
    { name: "lede", type: "textarea", maxLength: 700 },
    { name: "cta", type: "group", label: "Button (optional)", fields: linkFields(false) },
    {
      name: "visual",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "None", value: "none" },
        { label: "The gate and its four rooms", value: "gate" },
      ],
    },
  ],
};

export const RichTextBlock: Block = {
  slug: "richText",
  interfaceName: "RichTextBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", maxLength: 120 },
    { name: "content", type: "richText", required: true },
  ],
};

export const FeatureListBlock: Block = {
  slug: "featureList",
  interfaceName: "FeatureListBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", maxLength: 120 },
    {
      name: "numbered",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Show 01, 02, 03 beside the items." },
    },
    {
      name: "items",
      type: "array",
      minRows: 1,
      required: true,
      fields: [
        { name: "title", type: "text", required: true, maxLength: 120 },
        { name: "body", type: "textarea", maxLength: 600 },
      ],
    },
  ],
};

export const DivisionGridBlock: Block = {
  slug: "divisionGrid",
  interfaceName: "DivisionGridBlock",
  admin: { disableBlockName: true },
  fields: [
    eyebrowField,
    { name: "heading", type: "text", maxLength: 120 },
    { name: "intro", type: "textarea", maxLength: 400 },
  ],
};

export const CourseListBlock: Block = {
  slug: "courseList",
  interfaceName: "CourseListBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", maxLength: 120 },
    {
      name: "courses",
      type: "relationship",
      relationTo: "courses",
      hasMany: true,
      admin: { description: "Leave empty to list every published course." },
    },
  ],
};

export const FaqBlock: Block = {
  slug: "faq",
  interfaceName: "FaqBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", maxLength: 120 },
    {
      name: "items",
      type: "array",
      minRows: 1,
      required: true,
      fields: [
        { name: "question", type: "text", required: true, maxLength: 200 },
        { name: "answer", type: "textarea", required: true, maxLength: 1200 },
      ],
    },
  ],
};

export const CallToActionBlock: Block = {
  slug: "callToAction",
  interfaceName: "CallToActionBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", required: true, maxLength: 120 },
    { name: "body", type: "textarea", maxLength: 400 },
    ...linkFields(true),
  ],
};

/** Contact form or course waitlist. Rendering and submission: step 3. */
export const LeadFormBlock: Block = {
  slug: "leadForm",
  interfaceName: "LeadFormBlock",
  fields: [
    { name: "heading", type: "text", maxLength: 120 },
    { name: "intro", type: "textarea", maxLength: 400 },
    {
      name: "variant",
      type: "select",
      required: true,
      defaultValue: "contact",
      options: [
        { label: "Contact enquiry", value: "contact" },
        { label: "Course waitlist", value: "waitlist" },
      ],
    },
  ],
};

/**
 * "What do you need?" - entrances written in the visitor's own words, each
 * leading to the room that solves it (docs/marketing/ICP.md core needs).
 */
export const DoorsBlock: Block = {
  slug: "doors",
  interfaceName: "DoorsBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", required: true, maxLength: 120 },
    {
      name: "items",
      type: "array",
      minRows: 2,
      maxRows: 6,
      required: true,
      fields: [
        {
          name: "need",
          type: "text",
          required: true,
          maxLength: 90,
          admin: {
            description: 'The need as a visitor would say it, e.g. "My EBM keeps failing".',
          },
        },
        { name: "answer", type: "textarea", maxLength: 240 },
        divisionField(true),
        ...linkFields(true),
      ],
    },
  ],
};

/** Published market research. A figure can't be saved without its source. */
export const MarketFactsBlock: Block = {
  slug: "marketFacts",
  interfaceName: "MarketFactsBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", required: true, maxLength: 140 },
    { name: "intro", type: "textarea", maxLength: 400 },
    {
      name: "items",
      type: "array",
      minRows: 1,
      maxRows: 4,
      required: true,
      fields: [
        { name: "figure", type: "text", required: true, maxLength: 12 },
        { name: "statement", type: "text", required: true, maxLength: 160 },
      ],
    },
    {
      name: "source",
      type: "text",
      required: true,
      maxLength: 300,
      admin: {
        description:
          "The published research these figures come from. Never Z-GATE's own results - those need real, consented case studies.",
      },
    },
  ],
};

/** Our published service commitments as figures - never past results. */
export const CommitmentsBlock: Block = {
  slug: "commitments",
  interfaceName: "CommitmentsBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", required: true, maxLength: 120 },
    { name: "intro", type: "textarea", maxLength: 400 },
    {
      name: "items",
      type: "array",
      minRows: 1,
      maxRows: 8,
      required: true,
      admin: { description: "Only targets written in a client service agreement (SLA schedule)." },
      fields: [
        { name: "figure", type: "text", required: true, maxLength: 16 },
        { name: "label", type: "text", required: true, maxLength: 140 },
        divisionField(false),
      ],
    },
    {
      name: "note",
      type: "text",
      required: true,
      maxLength: 160,
      defaultValue:
        "Targets from our client service agreements: commitments we are held to, not past results.",
    },
  ],
};

/** A numbered process - how working with Z-GATE goes, step by step. */
export const StepsBlock: Block = {
  slug: "steps",
  interfaceName: "StepsBlock",
  fields: [
    eyebrowField,
    { name: "heading", type: "text", required: true, maxLength: 120 },
    { name: "intro", type: "textarea", maxLength: 400 },
    {
      name: "items",
      type: "array",
      minRows: 2,
      maxRows: 6,
      required: true,
      fields: [
        { name: "title", type: "text", required: true, maxLength: 80 },
        { name: "body", type: "textarea", maxLength: 300 },
      ],
    },
  ],
};

/** The company facts from Site settings (registration, TIN, licence) as a strip. */
export const FactStripBlock: Block = {
  slug: "factStrip",
  interfaceName: "FactStripBlock",
  admin: { disableBlockName: true },
  fields: [
    {
      name: "heading",
      type: "text",
      maxLength: 80,
      admin: { description: "Optional. Edit the facts themselves in Site settings > Company." },
    },
  ],
};

export const pageBlocks: Block[] = [
  HeroBlock,
  FactStripBlock,
  DoorsBlock,
  MarketFactsBlock,
  DivisionGridBlock,
  CommitmentsBlock,
  StepsBlock,
  RichTextBlock,
  FeatureListBlock,
  CourseListBlock,
  FaqBlock,
  CallToActionBlock,
  LeadFormBlock,
];
