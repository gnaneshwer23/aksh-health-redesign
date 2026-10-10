import { NextResponse } from "next/server";

import { ingestSlot, ingestSlotSchema } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/orgs/:orgId/slots — record a cancelled/free slot from an authoritative source (idempotent on sourceRef). */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = ingestSlotSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await ingestSlot(r.ctx, params.orgId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
