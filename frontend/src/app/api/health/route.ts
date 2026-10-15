/** Liveness: the process is up. No CMS dependency (see /api/ready). */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", checkedAt: new Date().toISOString() });
}
