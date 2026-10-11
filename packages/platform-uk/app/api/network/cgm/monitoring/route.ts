import { NextResponse } from "next/server";

import { listMonitoring } from "@/lib/cgm/monitoring";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/network/cgm/monitoring — clinicians' CGM worklist, most urgent first. */
export async function GET() {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json({ rows: await listMonitoring(r.ctx) });
  } catch (error) {
    return errorResponse(error, "/api/network/cgm/monitoring");
  }
}
