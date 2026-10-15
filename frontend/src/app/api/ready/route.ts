import { env } from "@/lib/env";

/**
 * Readiness: can this instance render content right now, i.e. is the CMS
 * reachable and ready itself. 503 (not 500) so a load balancer can act on
 * the status code alone - same contract as the CMS's and the e-learning
 * API's /api/ready. Cached pages keep being served while the CMS is down.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${env().CMS_URL}/api/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Response.json({ status: "ready", checks: { cms: "ok" } });
  } catch {
    return Response.json({ status: "not_ready", checks: { cms: "error" } }, { status: 503 });
  }
}
