import type { CollectionConfig } from "payload";
import { pageBlocks } from "@/blocks";
import { metaField, slugField } from "@/fields/common";
import { contentDefaults } from "./content";

type LayoutValue = { blockType?: string }[] | null | undefined;

/**
 * Every marketing page must end in a next step for the visitor
 * (docs/release/COMMERCIAL_READINESS.md found About had none - KI-19).
 * Legal pages (privacy, terms) are exempt.
 */
export function validateLayout(value: LayoutValue, pageType: unknown): true | string {
  if (!value || value.length === 0) return "Add at least one block.";
  if (pageType === "legal") return true;
  const hasCta = value.some(
    (block) => block.blockType === "callToAction" || block.blockType === "leadForm",
  );
  return (
    hasCta || "Marketing pages need a Call to action or a form block so visitors have a next step."
  );
}

export const Pages: CollectionConfig = {
  slug: "pages",
  ...contentDefaults,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description: 'Site pages. The slug "home" is the homepage.',
  },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 120 },
    slugField('URL path segment, e.g. "about". Use "home" for the homepage.'),
    {
      name: "pageType",
      type: "select",
      required: true,
      defaultValue: "marketing",
      options: [
        { label: "Marketing", value: "marketing" },
        { label: "Legal (privacy, terms)", value: "legal" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "layout",
      type: "blocks",
      required: true,
      blocks: pageBlocks,
      validate: (value: unknown, { siblingData }: { siblingData: { pageType?: unknown } }) =>
        validateLayout(value as LayoutValue, siblingData.pageType),
    },
    metaField,
  ],
};
