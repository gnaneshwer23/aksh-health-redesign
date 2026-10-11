import { NextResponse } from "next/server";

import { cgmUploadSchema, commitUpload, getCgm } from "@/lib/cgm/service";
import { BodyTooLargeError, readJsonLimited } from "@/lib/http/body";
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
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/network/patients/:id/cgm");
  }
}

/** POST — store a CGM export for this patient (re-parsed on the server; duplicates skipped). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const input = cgmUploadSchema.parse(await readJsonLimited(request, 7 * 1024 * 1024));
    return NextResponse.json(await commitUpload(r.ctx, params.id, input.csv, input.dateOrder, input.filename), { status: 201 });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/network/patients/:id/cgm");
  }
}
