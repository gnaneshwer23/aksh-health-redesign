import { NextResponse } from "next/server";

import { patientLevelAccess } from "@/lib/synthetic-world/access";
import { getPatientDetail } from "@/lib/synthetic-world/queries";

export const dynamic = "force-dynamic";

/** GET /api/network/patients/[id] — one synthetic patient (clinical roles and public demo only). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const access = await patientLevelAccess();
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const detail = getPatientDetail(params.id.slice(0, 20));
  if (!detail) return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  return NextResponse.json(detail);
}
