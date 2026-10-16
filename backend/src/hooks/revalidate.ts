import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";
import {
  REVALIDATE_SIGNATURE_HEADER,
  type RevalidationEvent,
  signRevalidation,
} from "@zgate/cms-contracts";
import { env } from "@/lib/env";

/**
 * Public pages are rendered by the website frontend on first request and
 * then cached until content changes. The whole site is small, so any
 * published change tells the frontend to drop every cached page, rather
 * than tracking which pages show which document.
 *
 * The frontend only marks its pages stale; each re-renders on its next
 * visit - in practice after this save's transaction has committed. The
 * frontend's hourly revalidation is the safety net if a webhook is lost.
 *
 * Scripts (seed, migrations) set `context.disableRevalidate`.
 */
function revalidateSite(
  req: PayloadRequest,
  context: Record<string, unknown>,
  source: string,
): void {
  if (context["disableRevalidate"]) return;
  const { REVALIDATE_URL: url, REVALIDATE_SECRET: secret } = env();
  const logger = req.payload.logger;
  if (!url || !secret) {
    logger.warn("Site revalidation skipped: REVALIDATE_URL is not set");
    return;
  }

  const event: RevalidationEvent = { event: "content-changed", source };
  const body = JSON.stringify(event);
  // Not awaited: an unreachable frontend must never block or fail an
  // editor's save.
  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [REVALIDATE_SIGNATURE_HEADER]: signRevalidation(body, secret),
    },
    body,
    signal: AbortSignal.timeout(5000),
  })
    .then((response) => {
      if (!response.ok) logger.warn(`Site revalidation failed: HTTP ${response.status}`);
    })
    .catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn(`Site revalidation failed: ${reason}`);
    });
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req,
  context,
  collection,
}) => {
  // Draft saves don't change what visitors see - only publishes and
  // unpublishes do (previousDoc covers "was live, now isn't").
  const status = (doc as { _status?: string })._status;
  const previousStatus = (previousDoc as { _status?: string } | undefined)?._status;
  if (status === undefined || status === "published" || previousStatus === "published") {
    revalidateSite(req, context, collection.slug);
  }
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  req,
  context,
  collection,
}) => {
  revalidateSite(req, context, collection.slug);
  return doc;
};

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({
  doc,
  req,
  context,
  global,
}) => {
  revalidateSite(req, context, global.slug);
  return doc;
};
