import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { readingInputSchema } from "@/lib/readings/rules";
import { addReading, listOwnReadings } from "@/lib/readings/service";

export const dynamic = "force-dynamic";

/** GET /api/me/readings — the patient's own readings and where they are (on their account, sent, checked). */
export async function GET() {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await listOwnReadings(r.ctx));
  } catch (error) {
    return errorResponse(error, "/api/me/readings");
  }
}

/** POST /api/me/readings — record a reading. Idempotent on clientRef (safe to retry after going offline). */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const limited = checkRateLimit(`readings:${r.actor.userId}`, 60, 60 * 60 * 1000);
    if (!limited.success) return rateLimitResponse(limited, "Too many readings in an hour. Try again later.");
    const input = readingInputSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await addReading(r.ctx, input), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/me/readings");
  }
}
