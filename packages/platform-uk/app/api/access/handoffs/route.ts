import { NextResponse } from "next/server";

import { listHandoffs } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/access/handoffs?all=1 — open (or all) staff hand-offs for the caller's organisations. */
export async function GET(request: Request) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listHandoffs(r.ctx, new URL(request.url).searchParams.get("all") === "1") });
  } catch (error) {
    return errorResponse(error);
  }
}
