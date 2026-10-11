import { NextResponse } from "next/server";

import { connectorConfigSchema, revokeKey, updateKeyConfig } from "@/lib/connector/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

type P = { params: { orgId: string; keyId: string } };

/** PATCH — appointment type mapping, offer window and site. */
export async function PATCH(request: Request, { params }: P) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await updateKeyConfig(r.ctx, params.orgId, params.keyId, connectorConfigSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/:keyId");
  }
}

/** DELETE — revoke the key immediately. */
export async function DELETE(_request: Request, { params }: P) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await revokeKey(r.ctx, params.orgId, params.keyId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/:keyId");
  }
}
