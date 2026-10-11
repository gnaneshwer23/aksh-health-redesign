import { NextResponse } from "next/server";

import { getOrganisation, updateOrganisation, updateOrganisationSchema } from "@/lib/network/admin";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId — organisation details for members. */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await getOrganisation(r.ctx, params.orgId));
  } catch (error) {
    return errorResponse(error);
  }
}

/** PATCH /api/orgs/:orgId — name, region and locale (admins only; audited). */
export async function PATCH(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await updateOrganisation(r.ctx, params.orgId, updateOrganisationSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error);
  }
}
