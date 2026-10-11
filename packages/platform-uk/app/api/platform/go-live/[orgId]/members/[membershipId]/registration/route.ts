import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/lib/golive/service";
import { errorResponse, requireActor } from "@/lib/network/http";
import { recordRegistrationCheckAsPlatform, registrationCheckSchema } from "@/lib/network/registration";

export const dynamic = "force-dynamic";

/** POST — an Aksh admin records a registration check (e.g. the organisation's only admin is the clinician). */
export async function POST(request: Request, { params }: { params: { orgId: string; membershipId: string } }) {
  try {
    const actor = await requireActor();
    if (actor instanceof NextResponse) return actor;
    await requirePlatformAdmin(actor.userId, params.orgId);
    const input = registrationCheckSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await recordRegistrationCheckAsPlatform(actor.userId, params.orgId, params.membershipId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/platform/go-live/:orgId/members/:membershipId/registration");
  }
}
