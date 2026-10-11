import { NextResponse } from "next/server";

import { connectorConfigSchema, revokeKey, updateKeyConfig } from "@/lib/connector/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ orgId: string; keyId: string }> };

/** PATCH — appointment type mapping, offer window and site. */
export async function PATCH(request: Request, props: P) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    // Malformed JSON must not reach the schema as {} and wipe the stored mapping.
    const body = await request.json().catch(() => undefined);
    if (body === undefined || body === null || typeof body !== "object") return NextResponse.json({ error: "Send the full connection settings as JSON" }, { status: 400 });
    return NextResponse.json(await updateKeyConfig(r.ctx, params.orgId, params.keyId, connectorConfigSchema.parse(body)));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/:keyId");
  }
}

/** DELETE — revoke the key immediately. */
export async function DELETE(_request: Request, props: P) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await revokeKey(r.ctx, params.orgId, params.keyId));
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections/:keyId");
  }
}
