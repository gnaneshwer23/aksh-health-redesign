import { NextResponse } from "next/server";

import { actionSchema, applyAction } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/access/workflows/:id/actions — one staff step; idempotent on idempotencyKey. */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = actionSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await applyAction(r.ctx, params.id.slice(0, 64), input));
  } catch (error) {
    return errorResponse(error);
  }
}
