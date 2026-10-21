/**
 * "Content changed" webhook from the CMS (backend/content/revalidate.py):
 * marks every cached public page stale, so each
 * re-renders with published content on its next visit.
 *
 * Only the CMS knows REVALIDATE_SECRET; an unsigned, wrongly signed or
 * replayed request is refused. With the two apps hosted apart the CMS
 * calls this over the internet, so the signature is what protects it; the
 * frontend's proxy can also restrict it to the CMS host's address
 * (REVALIDATE_ALLOWED_IPS, frontend/deploy/Caddyfile).
 */
import { revalidatePath } from "next/cache";
import { REVALIDATE_SIGNATURE_HEADER, verifyRevalidation } from "@zgate/cms-contracts";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = env().REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: "revalidation is not configured" }, { status: 503 });

  const body = await request.text();
  if (!verifyRevalidation(body, request.headers.get(REVALIDATE_SIGNATURE_HEADER), secret)) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
