import { NextResponse } from "next/server";

import { updateMember, updateMemberSchema } from "@/lib/network/admin";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** PATCH /api/orgs/:orgId/members/:membershipId — suspend/reactivate, role, admin (admins only). */
export async function PATCH(request: Request, { params }: { params: { orgId: string; membershipId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await updateMember(r.ctx, params.orgId, params.membershipId, updateMemberSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error);
  }
}
