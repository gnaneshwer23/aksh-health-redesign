import { NextResponse } from "next/server";

import { getGoLive } from "@/lib/golive/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/go-live — checklist, automatic checks, readiness and history. */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await getGoLive(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/go-live");
  }
}
