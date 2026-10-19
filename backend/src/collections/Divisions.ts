import type { CollectionConfig } from "payload";
import { DIVISION_SLUGS } from "@zgate/cms-contracts";
import { linkFields, metaField } from "@/fields/common";
import { contentDefaults } from "./content";

export { DIVISION_SLUGS, type DivisionSlug, isDivisionSlug } from "@zgate/cms-contracts";

/**
 * The four divisions. A fixed structure rather than free-form blocks: the
 * v1 commercial review found this mission -> included -> proof ->
 * objection -> CTA sequence to be the site's strongest content, so the
 * schema keeps every division page on it. The redesign adds who it's for,
 * commitments as figures ("say the number first") and more honest answers
 * to the same sequence.
 */
export const Divisions: CollectionConfig = {
  slug: "divisions",
  ...contentDefaults,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "_status", "updatedAt"],
  },
  defaultSort: "order",
  fields: [
    {
      name: "slug",
      type: "select",
      required: true,
      unique: true,
      index: true,
      options: DIVISION_SLUGS.map((value) => ({ label: value, value })),
      admin: { position: "sidebar", description: "Also the page URL, e.g. /advisory." },
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    { name: "name", type: "text", required: true, maxLength: 60 },
    { name: "shortName", type: "text", required: true, maxLength: 30 },
    {
      type: "row",
      fields: [
        {
          name: "subtitle",
          type: "text",
          maxLength: 60,
          admin: { description: 'The brand guide\'s line, e.g. "Tax & Business Consulting".' },
        },
        {
          name: "pillar",
          type: "text",
          maxLength: 40,
          admin: { description: 'Its message-house pillar, e.g. "Compliance certainty".' },
        },
      ],
    },
    {
      name: "headline",
      type: "text",
      maxLength: 140,
      admin: {
        description:
          "The page's main heading: the division's approved message (docs/marketing/MESSAGING_FRAMEWORK.md, level 4).",
      },
    },
    { name: "mission", type: "textarea", required: true, maxLength: 400 },
    { name: "about", type: "textarea", required: true, maxLength: 1200 },
    {
      name: "audience",
      type: "textarea",
      maxLength: 300,
      admin: { description: "Who it's for, in one or two plain sentences." },
    },
    {
      name: "included",
      type: "array",
      label: "What's included",
      minRows: 1,
      required: true,
      admin: {
        description: "Service scope from the signed SLA schedule - not aspirational items.",
      },
      fields: [{ name: "item", type: "text", required: true, maxLength: 240 }],
    },
    {
      name: "proof",
      type: "textarea",
      required: true,
      maxLength: 800,
      admin: {
        description: "Real, checkable commitments only. No invented results or testimonials.",
      },
    },
    {
      name: "commitments",
      type: "array",
      maxRows: 6,
      admin: {
        description:
          "Targets from this division's SLA schedule, shown as figures. Commitments only - never past results.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "figure", type: "text", required: true, maxLength: 16 },
            { name: "label", type: "text", required: true, maxLength: 140 },
          ],
        },
      ],
    },
    {
      name: "objection",
      type: "group",
      admin: { description: "The question this division's buyers ask first. Shown first." },
      fields: [
        { name: "question", type: "text", required: true, maxLength: 200 },
        { name: "answer", type: "textarea", required: true, maxLength: 800 },
      ],
    },
    {
      name: "faq",
      type: "array",
      label: "More questions",
      maxRows: 6,
      admin: { description: "Honest answers only (docs/marketing/MESSAGING_FRAMEWORK.md)." },
      fields: [
        { name: "question", type: "text", required: true, maxLength: 200 },
        { name: "answer", type: "textarea", required: true, maxLength: 800 },
      ],
    },
    {
      name: "cta",
      type: "group",
      label: "Call to action",
      fields: linkFields(true),
    },
    metaField,
  ],
};
