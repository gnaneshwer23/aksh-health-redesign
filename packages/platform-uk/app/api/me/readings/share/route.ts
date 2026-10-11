import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { shareEarlierReadings } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** POST /api/me/readings/share — after linking, share readings recorded before joining with the care team. */
export async function POST() {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await shareEarlierReadings(r.ctx));
  } catch (error) {
    return errorResponse(error, "/api/me/readings/share");
  }
}
