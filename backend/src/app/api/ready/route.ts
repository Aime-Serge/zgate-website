import config from "@payload-config";
import { getPayload } from "payload";

/**
 * Readiness: can this instance serve CMS content right now. 503 (not 500)
 * so a load balancer can act on the status code alone - same contract as
 * the e-learning API's /api/ready.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getPayload({ config });
    await payload.count({ collection: "redirects", overrideAccess: true });
    return Response.json({ status: "ready", checks: { database: "ok" } });
  } catch {
    return Response.json({ status: "not_ready", checks: { database: "error" } }, { status: 503 });
  }
}
