import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { addPatientRecord, patientRecordSchema } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/** POST /api/network/patients/:id/records — add an observation, medicine, care-team member or consent record. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = patientRecordSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await addPatientRecord(r.ctx, params.id, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
