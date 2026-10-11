import { NextResponse } from "next/server";

import { handoffActionSchema, updateHandoff } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/access/handoffs/:id — acknowledge, or close with a disposition. */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await updateHandoff(r.ctx, params.id.slice(0, 64), handoffActionSchema.parse(await request.json().catch(() => ({})))));
  } catch (error) {
    return errorResponse(error);
  }
}
