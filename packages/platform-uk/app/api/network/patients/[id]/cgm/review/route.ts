import { NextResponse } from "next/server";

import { reviewPatientUploads } from "@/lib/cgm/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** POST — a clinician has looked at the patient's own CGM uploads; they now count clinically. Audited. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await reviewPatientUploads(r.ctx, params.id));
  } catch (error) {
    return errorResponse(error, "/api/network/patients/:id/cgm/review");
  }
}
