import { NextResponse } from "next/server";

import { listEvents } from "@/lib/connector/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET — the last 50 messages from the organisation's scheduling system, with their result codes. */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json({ rows: await listEvents(r.ctx, params.orgId) });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/events");
  }
}
