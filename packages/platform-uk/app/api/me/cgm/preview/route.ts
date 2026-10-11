import { NextResponse } from "next/server";
import { z } from "zod";

import { previewUpload } from "@/lib/cgm/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({ csv: z.string().min(10), dateOrder: z.enum(["iso", "dmy", "mdy"]).optional() });

/** POST /api/me/cgm/preview — check the patient's export before saving. Writes nothing. */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const id = r.ctx.patientIds[0];
    if (!id) return NextResponse.json({ error: "Link your clinic first" }, { status: 409 });
    const input = schema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await previewUpload(r.ctx, id, input.csv, input.dateOrder));
  } catch (error) {
    return errorResponse(error, "/api/me/cgm/preview");
  }
}
