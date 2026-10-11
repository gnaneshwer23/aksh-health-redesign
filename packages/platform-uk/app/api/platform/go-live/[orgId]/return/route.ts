import { NextResponse } from "next/server";

import { decisionSchema, returnGoLive } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/platform/go-live/:orgId/return — return to the organisation with a reason. */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    const { note } = decisionSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await returnGoLive(actor.userId, params.orgId, note));
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId/return");
  }
}
