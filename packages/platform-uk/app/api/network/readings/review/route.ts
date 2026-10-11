import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { listReadingsToReview } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** GET /api/network/readings/review[?patient=] — unverified patient readings, flagged first. Clinicians only. */
export async function GET(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const patient = new URL(request.url).searchParams.get("patient")?.slice(0, 64) || undefined;
    return NextResponse.json({ rows: await listReadingsToReview(r.ctx, patient) });
  } catch (error) {
    return errorResponse(error, "/api/network/readings/review");
  }
}
