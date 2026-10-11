import { NextResponse } from "next/server";
import { z } from "zod";

import { commitUpload, getCgm } from "@/lib/cgm/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({ csv: z.string().min(10), dateOrder: z.enum(["iso", "dmy", "mdy"]).optional(), filename: z.string().max(120).optional() });

function ownPatient(ctx: { patientIds: string[] }) {
  return ctx.patientIds[0] ?? null;
}

/** GET /api/me/cgm — the linked patient's own CGM summary. */
export async function GET() {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const id = ownPatient(r.ctx);
    if (!id) return NextResponse.json({ linked: false });
    return NextResponse.json({ linked: true, ...(await getCgm(r.ctx, id)) });
  } catch (error) {
    return errorResponse(error, "/api/me/cgm");
  }
}

/** POST /api/me/cgm — the patient uploads their own export (recorded as patient-reported). */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const id = ownPatient(r.ctx);
    if (!id) return NextResponse.json({ error: "Link your clinic first" }, { status: 409 });
    const input = schema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await commitUpload(r.ctx, id, input.csv, input.dateOrder, input.filename), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/me/cgm");
  }
}
