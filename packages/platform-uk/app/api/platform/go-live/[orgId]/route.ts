import { NextResponse } from "next/server";

import { getReview } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/platform/go-live/:orgId — full review: evidence, automatic checks, members and registration, history. */
export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  try {
    return NextResponse.json(await getReview(actor.userId, params.orgId));
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId");
  }
}
