import { NextResponse } from "next/server";

import { cgmUploadSchema, commitUpload, getCgm } from "@/lib/cgm/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/network/patients/:id/cgm — latest 14 days: metrics, AGP, uploads. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    return NextResponse.json(await getCgm(r.ctx, params.id));
  } catch (error) {
    return errorResponse(error, "/api/network/patients/:id/cgm");
  }
}

/** POST — store a CGM export for this patient (re-parsed on the server; duplicates skipped). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const input = cgmUploadSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await commitUpload(r.ctx, params.id, input.csv, input.dateOrder, input.filename), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/network/patients/:id/cgm");
  }
}
