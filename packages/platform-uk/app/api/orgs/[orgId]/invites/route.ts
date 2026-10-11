import { NextResponse } from "next/server";

import { listInvites } from "@/lib/network/admin";
import { errorResponse, requireContext } from "@/lib/network/http";
import { createInvite, createInviteSchema } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/** POST /api/orgs/:orgId/invites — single-use staff or patient invite. The code is returned once. */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = createInviteSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await createInvite(r.ctx, params.orgId, input), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/orgs/:orgId/invites — pending invites (metadata only; codes are shown once at creation). */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listInvites(r.ctx, params.orgId) });
  } catch (error) {
    return errorResponse(error);
  }
}
