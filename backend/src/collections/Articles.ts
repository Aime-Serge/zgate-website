import type { CollectionConfig } from "payload";
import { metaField, slugField } from "@/fields/common";
import { contentDefaults } from "./content";

/** Insights. The section stays hidden on the site until one is published. */
export const Articles: CollectionConfig = {
  slug: "articles",
  ...contentDefaults,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedOn", "_status"],
  },
  defaultSort: "-publishedOn",
  fields: [
    { name: "title", type: "text", required: true, maxLength: 140 },
    slugField(),
    { name: "publishedOn", type: "date", required: true, admin: { position: "sidebar" } },
    {
      name: "authorName",
      type: "text",
      required: true,
      maxLength: 80,
      admin: { position: "sidebar" },
    },
    { name: "excerpt", type: "textarea", required: true, maxLength: 300 },
    { name: "body", type: "richText", required: true },
    metaField,
  ],
};
