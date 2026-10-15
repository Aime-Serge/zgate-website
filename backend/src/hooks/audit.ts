/**
 * Audit trail for Confidential data on the website - leads and consent
 * records (docs/architecture/DATA_ARCHITECTURE.md classification; the
 * website-side answer to finding F-1). Written with the same `req` so the
 * entry joins the operation's transaction where there is one.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterOperationHook,
  PayloadRequest,
} from "payload";

type AuditAction = "read" | "create" | "update" | "delete";

async function record(
  req: PayloadRequest,
  action: AuditAction,
  collection: string,
  docIds: (string | number)[],
): Promise<void> {
  await req.payload.create({
    collection: "audit-logs",
    overrideAccess: true,
    req,
    data: {
      actorType: req.user
        ? "user"
        : req.context["publicSubmission"]
          ? "anonymous"
          : req.payloadAPI === "local"
            ? "system"
            : "anonymous",
      actor: req.user?.id ?? null,
      action,
      targetCollection: collection,
      docIds: docIds.map(String),
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
  req,
  collection,
}) => {
  await record(req, operation, collection.slug, [(doc as { id: string | number }).id]);
  return doc;
};

export const auditDeletes: CollectionAfterDeleteHook = async ({ id, req, collection, doc }) => {
  await record(req, "delete", collection.slug, [id]);
  return doc;
};
