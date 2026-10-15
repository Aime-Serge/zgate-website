import path from "node:path";
import type { CollectionConfig } from "payload";
import { isPublisherOrAdmin, isStaff } from "@/access/roles";
import { env } from "@/lib/env";

/**
 * Images and documents used on public pages - Public-classified, never
 * client or learner files. Stored on local disk for now; object storage
 * comes with deployment (ADR-P7).
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isPublisherOrAdmin,
  },
  upload: {
    staticDir: path.resolve(env().MEDIA_DIR),
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif", "application/pdf"],
    // Pre-sized variants keep pages light on mobile connections.
    imageSizes: [
      { name: "thumbnail", width: 400 },
      { name: "card", width: 768 },
      { name: "hero", width: 1600 },
    ],
    formatOptions: { format: "webp", options: { quality: 80 } },
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      maxLength: 200,
      admin: { description: "Describe the image for people using screen readers. Required." },
    },
  ],
};
