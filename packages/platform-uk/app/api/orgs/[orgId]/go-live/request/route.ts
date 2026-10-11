import { NextResponse } from "next/server";

import { requestReview } from "@/lib/golive/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/orgs/:orgId/go-live/request — ask Aksh to review; only when every check passes. */
export async function POST(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await requestReview(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/go-live/request");
  }
}
