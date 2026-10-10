import { NextResponse } from "next/server";

import { accessSettingsSchema, getAccessSettings, updateAccessSettings } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/access-settings — ranking order, offer cap and suppressed channels. */
export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await getAccessSettings(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error);
  }
}

/** PUT /api/orgs/:orgId/access-settings — organisation admins only; audited. */
export async function PUT(request: Request, { params }: { params: { orgId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await updateAccessSettings(r.ctx, params.orgId, accessSettingsSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error);
  }
}
