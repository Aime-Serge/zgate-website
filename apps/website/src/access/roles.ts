/**
 * Staff roles for the website CMS (docs/platform-v2/04-WEBSITE.md §4).
 *
 *  - editor:    drafts content; cannot publish, cannot see leads
 *  - publisher: everything an editor can do, plus publish and work leads
 *               (the Marketing lead)
 *  - admin:     everything, plus user management and the audit log (MD)
 *
 * Only two people should hold publisher or admin, per the publishing
 * workflow in 04-WEBSITE.md.
 */
import type { Access, FieldAccess, PayloadRequest, Where } from "payload";

export const ROLES = ["admin", "publisher", "editor"] as const;
export type Role = (typeof ROLES)[number];

interface StaffUser {
  roles?: Role[] | null;
}

function rolesOf(req: PayloadRequest): Role[] {
  const user = req.user as StaffUser | null | undefined;
  return user?.roles ?? [];
}

export function hasRole(req: PayloadRequest, ...allowed: Role[]): boolean {
  const roles = rolesOf(req);
  return roles.some((role) => allowed.includes(role));
}

export const canPublish = (req: PayloadRequest): boolean => hasRole(req, "admin", "publisher");

export const isStaff: Access = ({ req }) => Boolean(req.user);
export const isAdmin: Access = ({ req }) => hasRole(req, "admin");
export const isPublisherOrAdmin: Access = ({ req }) => canPublish(req);
export const nobody: Access = () => false;

export const isAdminField: FieldAccess = ({ req }) => hasRole(req, "admin");

/**
 * Public visitors see published documents only; signed-in staff also see
 * drafts (needed by the admin UI and, later, live preview).
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true;
  const where: Where = { _status: { equals: "published" } };
  return where;
};

/** Users may read and edit their own account; admins may manage all. */
export const adminOrSelf: Access = ({ req }) => {
  if (hasRole(req, "admin")) return true;
  if (!req.user) return false;
  const where: Where = { id: { equals: req.user.id } };
  return where;
};
