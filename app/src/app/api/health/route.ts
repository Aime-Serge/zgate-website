/** Liveness: the process is up. No database dependency (see /api/ready). */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", checkedAt: new Date().toISOString() });
}
