import { NextResponse } from "next/server";

import { submitEvidence } from "@/lib/golive/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** PUT /api/orgs/:orgId/go-live/items/:key — submit (or resubmit) evidence for one checklist item. Admins only. */
export async function PUT(request: Request, { params }: { params: { orgId: string; key: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await submitEvidence(r.ctx, params.orgId, params.key, await request.json().catch(() => ({}))));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/go-live/items/:key");
  }
}
