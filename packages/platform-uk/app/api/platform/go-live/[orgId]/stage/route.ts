import { NextResponse } from "next/server";

import { pilotStageSchema, setPilotStage } from "@/lib/golive/service";
import { errorResponse, requireActor, requirePlatformSession } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/platform/go-live/:orgId/stage — move a live organisation between shadow and staff-assisted (PRD §10.3). */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    const mfa = requirePlatformSession(actor);
    if (mfa) return mfa;
    return NextResponse.json(await setPilotStage(actor.userId, params.orgId, pilotStageSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId/stage");
  }
}
