import { NextResponse } from "next/server";

import { requestNetworkContext } from "@/lib/network/context";
import { errorResponse } from "@/lib/network/http";
import { getPatientDetail } from "@/lib/network/read";
import { patientLevelAccess } from "@/lib/network/access";

export const dynamic = "force-dynamic";

/** GET /api/network/patients/:id — one record, only if row-level security lets the caller see it. */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const access = await patientLevelAccess();
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  const ctx = await requestNetworkContext();
  if (!ctx) return NextResponse.json({ error: "Sign in to see this record" }, { status: 401 });
  try {
    const detail = await getPatientDetail(ctx, params.id.slice(0, 64));
    return detail ? NextResponse.json(detail) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}
