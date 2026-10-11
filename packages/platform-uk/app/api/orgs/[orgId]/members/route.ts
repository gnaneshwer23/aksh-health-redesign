import { NextResponse } from "next/server";

import { listMembers } from "@/lib/network/admin";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/members — staff with role, status and registration status. */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listMembers(r.ctx, params.orgId) });
  } catch (error) {
    return errorResponse(error);
  }
}
