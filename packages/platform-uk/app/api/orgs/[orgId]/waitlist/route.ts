import { NextResponse } from "next/server";

import { addToWaitlist, waitlistSchema } from "@/lib/access/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST /api/orgs/:orgId/waitlist — add a patient to the waiting list for an appointment type. */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = waitlistSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await addToWaitlist(r.ctx, params.orgId, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
