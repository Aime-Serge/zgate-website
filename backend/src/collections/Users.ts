import type { CollectionConfig } from "payload";
import { adminOrSelf, isAdmin, isAdminField, ROLES } from "@/access/roles";
import { auditChanges, auditDeletes, auditLogins } from "@/hooks/audit";

/**
 * CMS staff accounts. Separate from the e-learning platform's accounts
 * (ADR-007): no shared sessions, no shared tables.
 *
 * MFA: Payload has no built-in second factor, so until one is added the
 * admin route must sit behind an IP allowlist or zero-trust gateway at the
 * edge proxy (docs/04-WEBSITE.md §4).
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "roles"],
  },
  auth: {
    // Seconds. A working day, not a week - these are privileged sessions.
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      sameSite: "Lax",
      secure: process.env["NODE_ENV"] === "production",
    },
  },
  access: {
    // First-user creation is allowed by Payload's own onboarding flow even
    // with this rule; afterwards only admins add staff.
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
  },
  // Roles decide who can see leads, so every account change - above all a
  // role grant - and every sign-in is in the audit log. Reads aren't:
  // the admin UI reads the signed-in user on every page.
  hooks: {
    afterChange: [auditChanges],
    afterDelete: [auditDeletes],
    afterLogin: [auditLogins],
  },
  fields: [
    { name: "name", type: "text", required: true, maxLength: 80 },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      options: ROLES.map((role) => ({ label: role, value: role })),
      // Nobody can raise their own privileges.
      access: { create: isAdminField, update: isAdminField },
      saveToJWT: true,
      admin: {
        description:
          "editor: drafts only · publisher: publish + leads · admin: everything + users and audit log",
      },
    },
  ],
};
