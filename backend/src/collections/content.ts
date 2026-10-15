import type { CollectionConfig } from "payload";
import { isPublisherOrAdmin, isStaff, publishedOrStaff } from "@/access/roles";
import { enforcePublishPermission } from "@/hooks/publishing";
import { revalidateAfterChange, revalidateAfterDelete } from "@/hooks/revalidate";

type ContentDefaults = Pick<CollectionConfig, "access" | "versions" | "hooks">;

/**
 * Shared behaviour for public-facing content: draft -> publish workflow,
 * version history for rollback, visitors see published documents only,
 * and the public cache is cleared whenever what's live changes.
 */
export const contentDefaults: ContentDefaults = {
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isPublisherOrAdmin,
    readVersions: isStaff,
  },
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
  hooks: {
    beforeChange: [enforcePublishPermission],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
};
