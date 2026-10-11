import { NextResponse } from "next/server";

import { createKey, createKeySchema, listKeys } from "@/lib/connector/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET — schedule connections (keys are never returned, only their prefix). */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json({ rows: await listKeys(r.ctx, params.orgId) });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections");
  }
}

/** POST — create a connection; the API key is in this response only. Admins only. */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await createKey(r.ctx, params.orgId, createKeySchema.parse(await request.json().catch(() => ({})))), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/connections");
  }
}
