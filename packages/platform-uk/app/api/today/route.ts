import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { getToday } from "@/lib/workspace/today";

export const dynamic = "force-dynamic";

/** GET /api/today — what needs a person now, across the caller's organisations. Live records only. */
export async function GET() {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await getToday(r.ctx));
  } catch (error) {
    return errorResponse(error, "/api/today");
  }
}
