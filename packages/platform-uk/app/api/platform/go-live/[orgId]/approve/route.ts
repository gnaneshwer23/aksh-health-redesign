import { NextResponse } from "next/server";

import { decisionSchema, approveGoLive } from "@/lib/golive/service";
import { errorResponse, requireActor, requirePlatformSession } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/platform/go-live/:orgId/approve — approve into live (shadow mode). */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    const mfa = requirePlatformSession(actor);
    if (mfa) return mfa;
    const { note } = decisionSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await approveGoLive(actor.userId, params.orgId, note));
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId/approve");
  }
}
