import { NextResponse } from "next/server";

import { cgmUploadSchema, previewUpload } from "@/lib/cgm/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/network/patients/:id/cgm/preview — read the export and report what would be stored. Writes nothing. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const input = cgmUploadSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await previewUpload(r.ctx, params.id, input.csv, input.dateOrder));
  } catch (error) {
    return errorResponse(error, "/api/network/patients/:id/cgm/preview");
  }
}
