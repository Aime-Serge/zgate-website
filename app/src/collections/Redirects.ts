import type { CollectionConfig } from "payload";
import { isPublisherOrAdmin } from "@/access/roles";
import { validateHref } from "@/fields/common";
import { revalidateAfterChange, revalidateAfterDelete } from "@/hooks/revalidate";

/** Keeps old URLs working when pages move. Applied by the site router. */
export const Redirects: CollectionConfig = {
  slug: "redirects",
  admin: { useAsTitle: "from", defaultColumns: ["from", "to", "permanent"] },
  // A "page not found" answer is cached like any page, so adding or
  // changing a redirect must clear the cache or it won't take effect.
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  access: {
    read: () => true,
    create: isPublisherOrAdmin,
    update: isPublisherOrAdmin,
    delete: isPublisherOrAdmin,
  },
  fields: [
    {
      name: "from",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: (value: string | null | undefined) =>
        (typeof value === "string" && /^\/[^\s]*$/.test(value)) ||
        "Use a site path starting with /.",
    },
    { name: "to", type: "text", required: true, validate: validateHref },
    { name: "permanent", type: "checkbox", defaultValue: true },
  ],
};
