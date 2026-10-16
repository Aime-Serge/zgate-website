import type { CollectionConfig } from "payload";
import { DIVISION_SLUGS } from "@zgate/cms-contracts";
import { linkFields, metaField } from "@/fields/common";
import { contentDefaults } from "./content";

export { DIVISION_SLUGS, type DivisionSlug, isDivisionSlug } from "@zgate/cms-contracts";

/**
 * The four divisions. A fixed structure rather than free-form blocks: the
 * v1 commercial review found this mission -> included -> proof ->
 * objection -> CTA sequence to be the site's strongest content, so the
 * schema keeps every division page on it.
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
    { name: "mission", type: "textarea", required: true, maxLength: 400 },
    { name: "about", type: "textarea", required: true, maxLength: 1200 },
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
      name: "objection",
      type: "group",
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
