/**
 * Audit trail for Confidential data on the website - leads and consent
 * records (docs/architecture/DATA_ARCHITECTURE.md classification; the
 * website-side answer to finding F-1) - and for the staff accounts whose
 * roles decide who can see them. Written with the same `req` so the
 * entry joins the operation's transaction where there is one.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterLoginHook,
  CollectionAfterOperationHook,
  PayloadRequest,
} from "payload";
import type { User } from "@zgate/cms-contracts/payload-types";

type AuditAction = "read" | "create" | "update" | "delete" | "login";

type Actor = Pick<User, "id" | "email">;

// Bookkeeping Payload rewrites on saves - never a meaningful change. The
// auth fields are Payload's own (lockout counters, reset tokens, salt).
const IGNORED_FIELDS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "_status",
  "sessions",
  "salt",
  "loginAttempts",
  "lockUntil",
  "resetPasswordToken",
  "resetPasswordExpiration",
  "resetPasswordRequestedAt",
  "_verified",
  "_verificationToken",
]);

/**
 * Names of the top-level fields an update changed - names only, never
 * values, so the audit log doesn't become a second copy of personal data.
 * A new password shows up only as a new hash, and is reported as
 * "password".
 */
export function changedFields(
  previous: Record<string, unknown> | undefined,
  next: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(previous ?? {}), ...Object.keys(next)]);
  return [...keys]
    .filter(
      (key) =>
        !IGNORED_FIELDS.has(key) && JSON.stringify(previous?.[key]) !== JSON.stringify(next[key]),
    )
    .map((key) => (key === "hash" ? "password" : key))
    .sort();
}

async function record(
  req: PayloadRequest,
  action: AuditAction,
  collection: string,
  docIds: (string | number)[],
  { actor = req.user as Actor | null, fields }: { actor?: Actor | null; fields?: string[] } = {},
): Promise<void> {
  await req.payload.create({
    collection: "audit-logs",
    overrideAccess: true,
    req,
    data: {
      actorType: actor
        ? "user"
        : req.context["publicSubmission"]
          ? "anonymous"
          : req.payloadAPI === "local"
            ? "system"
            : "anonymous",
      actor: actor?.id ?? null,
      // A snapshot: the account (and so the relationship) may be deleted
      // later; the log must still say who it was.
      actorEmail: actor?.email ?? null,
      action,
      targetCollection: collection,
      docIds: docIds.map(String),
      ...(fields && fields.length > 0 ? { changedFields: fields } : {}),
    },
  });
}

/** Logs every human read (list or single). System reads aren't logged. */
export const auditReads: CollectionAfterOperationHook = async ({
  operation,
  result,
  req,
  collection,
}) => {
  if (!req.user) return result;
  if (operation === "find") {
    const ids = (result as { docs: { id: string | number }[] }).docs.map((doc) => doc.id);
    if (ids.length > 0) await record(req, "read", collection.slug, ids);
  } else if (operation === "findByID" && result) {
    await record(req, "read", collection.slug, [(result as { id: string | number }).id]);
  }
  return result;
};

export const auditChanges: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
  collection,
}) => {
  const fields =
    operation === "update" ? changedFields(previousDoc as Record<string, unknown>, doc) : undefined;
  await record(req, operation, collection.slug, [(doc as { id: string | number }).id], { fields });
  return doc;
};

export const auditDeletes: CollectionAfterDeleteHook = async ({ id, req, collection, doc }) => {
  await record(req, "delete", collection.slug, [id]);
  return doc;
};

/** Staff sign-ins. Failed attempts are counted and locked out by Payload itself. */
export const auditLogins: CollectionAfterLoginHook = async ({ req, user, collection }) => {
  await record(req, "login", collection.slug, [user.id], { actor: user });
  return user;
};
