import { NextResponse } from "next/server";

import { listEvents } from "@/lib/connector/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET — the last 50 messages from the organisation's scheduling system, with their result codes. */
export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listEvents(r.ctx, params.orgId) });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/events");
  }
}
