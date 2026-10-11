import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { listReadingsToReview } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** GET /api/network/readings/review[?patient=] — unverified patient readings, flagged first. Clinicians only. */
export async function GET(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const params = new URL(request.url).searchParams;
    const patient = params.get("patient")?.slice(0, 64) || undefined;
    const raw = params.get("offset") ?? "0";
    const offset = /^\d{1,6}$/.test(raw) ? Number(raw) : 0; // non-negative integer only
    const rows = await listReadingsToReview(r.ctx, patient, offset);
    return NextResponse.json({ rows, nextOffset: rows.length === 200 ? offset + 200 : null });
  } catch (error) {
    return errorResponse(error, "/api/network/readings/review");
  }
}
