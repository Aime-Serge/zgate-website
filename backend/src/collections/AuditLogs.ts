import type { CollectionConfig } from "payload";
import { isAdmin, nobody } from "@/access/roles";

/**
 * Append-only: written only by server hooks (src/hooks/audit.ts) through
 * the Local API with overrideAccess. No HTTP caller - including admins -
 * can create, edit or delete an entry.
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "action",
    defaultColumns: ["createdAt", "actorEmail", "action", "targetCollection", "changedFields"],
    description:
      "Who viewed or changed personal data or staff accounts, who signed in, and when. Read-only.",
  },
  defaultSort: "-createdAt",
  access: {
    read: isAdmin,
    create: nobody,
    update: nobody,
    delete: nobody,
  },
  fields: [
    {
      name: "actorType",
      type: "select",
      required: true,
      options: ["user", "system", "anonymous"].map((value) => ({ label: value, value })),
    },
    { name: "actor", type: "relationship", relationTo: "users" },
    // Kept even if the account is later deleted (the relationship is not).
    { name: "actorEmail", type: "email" },
    {
      name: "action",
      type: "select",
      required: true,
      options: ["read", "create", "update", "delete", "login"].map((value) => ({
        label: value,
        value,
      })),
    },
    { name: "targetCollection", type: "text", required: true, index: true },
    // A plain list rather than a JSON field: JSON fields render with the
    // Monaco editor, which Payload loads from a third-party CDN - keeping
    // the admin free of outside scripts (src/lib/hosts.ts CSP).
    { name: "docIds", type: "text", hasMany: true, required: true },
    // Updates only: which fields changed - names, never values.
    { name: "changedFields", type: "text", hasMany: true },
  ],
};
