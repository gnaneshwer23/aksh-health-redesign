import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, requireContext } from "@/lib/network/http";
import { markEnteredInError } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** PATCH /api/me/readings/:id { status: "entered_in_error" } — the patient withdraws an unchecked reading. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    z.object({ status: z.literal("entered_in_error") }).parse(await request.json().catch(() => ({})));
    return NextResponse.json(await markEnteredInError(r.ctx, params.id));
  } catch (error) {
    return errorResponse(error, "/api/me/readings/:id");
  }
}
