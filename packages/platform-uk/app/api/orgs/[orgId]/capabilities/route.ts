import { NextResponse } from "next/server";

import { getCapabilityRegister } from "@/lib/access/capabilities";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/capabilities — what is switched on for this organisation, and the honesty fields (PRD §8.1). */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await getCapabilityRegister(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/capabilities");
  }
}
