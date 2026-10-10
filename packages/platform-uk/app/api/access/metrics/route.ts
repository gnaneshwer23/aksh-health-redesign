import { NextResponse } from "next/server";

import { accessMetrics } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/access/metrics?org=&days= — fill rate (slot-fill-v1) with guardrails, labelled unverified. */
export async function GET(request: Request) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  const sp = new URL(request.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(sp.get("days")) || 30));
  try {
    return NextResponse.json(await accessMetrics(r.ctx, sp.get("org")?.slice(0, 64) || undefined, days));
  } catch (error) {
    return errorResponse(error);
  }
}
