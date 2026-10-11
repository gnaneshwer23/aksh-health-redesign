import { NextResponse } from "next/server";

import { listReviewQueue } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/platform/go-live — organisations awaiting go-live review. Aksh platform admins only (404 otherwise). */
export async function GET() {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  try {
    return NextResponse.json({ rows: await listReviewQueue(actor.userId) });
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live");
  }
}
