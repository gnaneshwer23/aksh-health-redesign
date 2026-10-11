import { NextResponse } from "next/server";

import { getMeasurement } from "@/lib/access/measurement";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/measurement — fill rate against the locked baseline. */
export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await getMeasurement(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/measurement");
  }
}
