import { NextResponse } from "next/server";

import { revokeInvite } from "@/lib/network/admin";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** DELETE /api/orgs/:orgId/invites/:inviteId — revoke an unused invite. */
export async function DELETE(_request: Request, { params }: { params: { orgId: string; inviteId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await revokeInvite(r.ctx, params.orgId, params.inviteId));
  } catch (error) {
    return errorResponse(error);
  }
}
