import { APIError, type CollectionBeforeChangeHook, type GlobalBeforeChangeHook } from "payload";
import { canPublish } from "@/access/roles";

const MESSAGE = "Only a publisher or admin can publish. Save as a draft and ask them to review it.";

/**
 * Draft -> review -> publish (website/docs/04-WEBSITE.md §4): editors
 * may save drafts but never set a document live. Local API calls with no
 * user (seed and migration scripts running on the server) are trusted
 * system operations; anything arriving over HTTP is checked.
 */
function assertMayPublish(status: unknown, req: Parameters<CollectionBeforeChangeHook>[0]["req"]) {
  if (status !== "published") return;
  if (req.payloadAPI === "local" && !req.user) return;
  if (!canPublish(req)) {
    throw new APIError(MESSAGE, 403, null, true);
  }
}

export const enforcePublishPermission: CollectionBeforeChangeHook = ({ data, req }) => {
  assertMayPublish((data as { _status?: unknown })._status, req);
  return data;
};

export const enforceGlobalPublishPermission: GlobalBeforeChangeHook = ({ data, req }) => {
  assertMayPublish((data as { _status?: unknown })._status, req);
  return data;
};
