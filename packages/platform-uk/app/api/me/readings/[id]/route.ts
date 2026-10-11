import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse, requireContext } from "@/lib/network/http";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { markEnteredInError } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** PATCH /api/me/readings/:id { status: "entered_in_error" } — the patient withdraws an unchecked reading. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const limited = await checkRateLimit(`readings-edit:${r.actor.userId}`, 60, 60 * 60 * 1000);
    if (!limited.success) return rateLimitResponse(limited, "Too many changes in an hour. Try again later.");
    z.object({ status: z.literal("entered_in_error") }).parse(await request.json().catch(() => ({})));
    return NextResponse.json(await markEnteredInError(r.ctx, params.id));
  } catch (error) {
    return errorResponse(error, "/api/me/readings/:id");
  }
}
