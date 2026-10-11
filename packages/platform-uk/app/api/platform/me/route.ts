import { NextResponse } from "next/server";

import { isPlatformAdmin } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/platform/me — whether the signed-in user is an Aksh platform admin (drives the review link). */
export async function GET() {
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    return NextResponse.json({ platformAdmin: await isPlatformAdmin(actor.userId) });
  } catch (error) {
    return errorResponse(error, "/api/platform/me");
  }
}
