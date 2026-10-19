import type { CollectionConfig } from "payload";
import { metaField, slugField } from "@/fields/common";
import { contentDefaults } from "./content";

/**
 * Course marketing pages. Per ADR-007 the website owns the marketing copy
 * and the e-learning platform will own price, intakes and seats, joined
 * by `slug`. Until the LMS exists, the "interim" fields below are the
 * source of truth; afterwards they're replaced by the LMS catalog.
 */
export const Courses: CollectionConfig = {
  slug: "courses",
  ...contentDefaults,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
  },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 120 },
    slugField("Shared with the e-learning platform - don't change after launch."),
    { name: "summary", type: "textarea", maxLength: 400 },
    { name: "audience", type: "textarea", required: true, maxLength: 400 },
    {
      name: "outcomes",
      type: "array",
      label: "What you'll be able to do",
      fields: [{ name: "outcome", type: "text", required: true, maxLength: 200 }],
    },
    {
      name: "syllabus",
      type: "array",
      admin: {
        description:
          "Not shown on the website: it is the gate to the e-learning platform, which owns course outlines (ADR-007).",
      },
      fields: [
        { name: "title", type: "text", required: true, maxLength: 160 },
        { name: "summary", type: "textarea", maxLength: 600 },
      ],
    },
    {
      type: "collapsible",
      label: "Schedule & price (interim - moves to the e-learning platform)",
      fields: [
        {
          name: "format",
          type: "text",
          maxLength: 120,
          admin: { description: 'e.g. "In person, Kigali"' },
        },
        {
          name: "duration",
          type: "text",
          maxLength: 120,
          admin: { description: 'e.g. "4 weeks — 8 sessions, 1.5 hrs each"' },
        },
        {
          type: "row",
          fields: [
            {
              name: "priceAmount",
              type: "number",
              min: 0,
              admin: {
                description: "Whole amount in the currency's smallest unit (RWF has no decimals).",
              },
            },
            {
              name: "currency",
              type: "select",
              defaultValue: "RWF",
              options: [{ label: "RWF", value: "RWF" }],
            },
            {
              name: "priceNote",
              type: "text",
              maxLength: 60,
              admin: { description: 'e.g. "per learner"' },
            },
          ],
        },
        {
          name: "intakes",
          type: "array",
          fields: [
            { name: "label", type: "text", required: true, maxLength: 80 },
            {
              name: "startsOn",
              type: "date",
              required: true,
              admin: { date: { pickerAppearance: "dayOnly" } },
            },
          ],
        },
      ],
    },
    metaField,
  ],
};
