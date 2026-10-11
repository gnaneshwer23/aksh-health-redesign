import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, requireContext } from "@/lib/network/http";
import { verifyReadings } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** POST /api/network/readings/verify { ids } — a clinician marks readings as checked; final and audited. */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const { ids } = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(200) }).parse(await request.json().catch(() => ({})));
    return NextResponse.json(await verifyReadings(r.ctx, ids));
  } catch (error) {
    return errorResponse(error, "/api/network/readings/verify");
  }
}
