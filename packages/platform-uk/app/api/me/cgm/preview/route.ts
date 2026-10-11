import { NextResponse } from "next/server";
import { z } from "zod";

import { previewUpload } from "@/lib/cgm/service";
import { BodyTooLargeError, readJsonLimited } from "@/lib/http/body";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({ csv: z.string().min(10), dateOrder: z.enum(["iso", "dmy", "mdy"]).optional() });

/** POST /api/me/cgm/preview — check the patient's export before saving. Writes nothing. */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    // The patient's own route: patient accounts only (staff use the clinician route, with its own rules).
    if (r.ctx.role !== "patient") return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
    const id = r.ctx.patientIds[0];
    if (!id) return NextResponse.json({ error: "Link your clinic first" }, { status: 409 });
    const input = schema.parse(await readJsonLimited(request, 7 * 1024 * 1024));
    return NextResponse.json(await previewUpload(r.ctx, id, input.csv, input.dateOrder));
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/me/cgm/preview");
  }
}
