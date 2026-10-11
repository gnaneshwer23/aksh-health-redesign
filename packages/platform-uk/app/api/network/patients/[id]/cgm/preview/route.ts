import { NextResponse } from "next/server";

import { cgmUploadSchema, previewUpload } from "@/lib/cgm/service";
import { BodyTooLargeError, readJsonLimited } from "@/lib/http/body";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/network/patients/:id/cgm/preview — read the export and report what would be stored. Writes nothing. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const input = cgmUploadSchema.parse(await readJsonLimited(request, 7 * 1024 * 1024));
    return NextResponse.json(await previewUpload(r.ctx, params.id, input.csv, input.dateOrder));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/network/patients/:id/cgm/preview");
  }
}
