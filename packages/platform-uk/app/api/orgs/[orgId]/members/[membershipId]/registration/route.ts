import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { listRegistrationChecks, recordRegistrationCheck, registrationCheckSchema } from "@/lib/network/registration";

export const dynamic = "force-dynamic";

type P = { params: { orgId: string; membershipId: string } };

/** GET — registration check history for a member. */
export async function GET(_request: Request, { params }: P) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listRegistrationChecks(r.ctx, params.orgId, params.membershipId) });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/members/:membershipId/registration");
  }
}

/** POST — record a check against the official register. Admins only; never your own. */
export async function POST(request: Request, { params }: P) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = registrationCheckSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await recordRegistrationCheck(r.ctx, params.orgId, params.membershipId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/members/:membershipId/registration");
  }
}
