/**
 * Page-building blocks. Deliberately absent: testimonial, rating, client
 * logo and statistic blocks. Z-GATE has no real, consented social proof
 * yet, and the brand rule is never to fabricate it
 * (website/docs/04-WEBSITE.md §4). Adding one is a reviewed schema
 * change, not an editor's choice.
 */
import type { Block } from "payload";
import { linkFields } from "@/fields/common";

export const HeroBlock: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    { name: "eyebrow", type: "text", maxLength: 80 },
    { name: "headline", type: "textarea", required: true, maxLength: 160 },
    { name: "lede", type: "textarea", maxLength: 700 },
    { name: "cta", type: "group", label: "Button (optional)", fields: linkFields(false) },
  ],
};

export const RichTextBlock: Block = {
  slug: "richText",
  interfaceName: "RichTextBlock",
  fields: [
    { name: "heading", type: "text", maxLength: 120 },
    { name: "content", type: "richText", required: true },
  ],
};

export const FeatureListBlock: Block = {
  slug: "featureList",
  interfaceName: "FeatureListBlock",
  fields: [
    { name: "heading", type: "text", maxLength: 120 },
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
  fields: [{ name: "heading", type: "text", maxLength: 120 }],
};

export const CourseListBlock: Block = {
  slug: "courseList",
  interfaceName: "CourseListBlock",
  fields: [
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

export const pageBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  FeatureListBlock,
  DivisionGridBlock,
  CourseListBlock,
  FaqBlock,
  CallToActionBlock,
  LeadFormBlock,
];
