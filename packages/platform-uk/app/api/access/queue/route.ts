import { NextResponse } from "next/server";

import { listQueue } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/access/queue?org= — open and recent slot-fill workflows for the caller's organisations. */
export async function GET(request: Request) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listQueue(r.ctx, new URL(request.url).searchParams.get("org")?.slice(0, 64) || undefined) });
  } catch (error) {
    return errorResponse(error);
  }
}
