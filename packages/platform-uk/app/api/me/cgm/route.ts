import { NextResponse } from "next/server";
import { z } from "zod";

import { commitUpload, getCgm } from "@/lib/cgm/service";
import { BodyTooLargeError, readJsonLimited } from "@/lib/http/body";
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
    // The patient's own route: patient accounts only (staff use the clinician route, with its own rules).
    if (r.ctx.role !== "patient") return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
    const id = ownPatient(r.ctx);
    if (!id) return NextResponse.json({ linked: false });
    return NextResponse.json({ linked: true, ...(await getCgm(r.ctx, id)) });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/me/cgm");
  }
}

/** POST /api/me/cgm — the patient uploads their own export (recorded as patient-reported). */
export async function POST(request: Request) {
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    // The patient's own route: patient accounts only (staff use the clinician route, with its own rules).
    if (r.ctx.role !== "patient") return NextResponse.json({ error: "Patient accounts only" }, { status: 403 });
    const id = ownPatient(r.ctx);
    if (!id) return NextResponse.json({ error: "Link your clinic first" }, { status: 409 });
    const input = schema.parse(await readJsonLimited(request, 7 * 1024 * 1024));
    return NextResponse.json(await commitUpload(r.ctx, id, input.csv, input.dateOrder, input.filename), { status: 201 });
  } catch (error) {
    if (error instanceof BodyTooLargeError) return NextResponse.json({ error: "File too large (6 MB). Export a shorter period." }, { status: 413 });
    return errorResponse(error, "/api/me/cgm");
  }
}
