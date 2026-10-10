import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { importPatients, importPatientsSchema } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/** POST /api/orgs/:orgId/patients — import up to 100 patients with history (idempotent on recordRef). */
export async function POST(request: Request, { params }: { params: { orgId: string } }) {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const input = importPatientsSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json({ rows: await importPatients(r.ctx, params.orgId, input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
