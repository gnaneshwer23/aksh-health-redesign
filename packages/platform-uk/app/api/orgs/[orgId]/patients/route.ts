import { NextResponse } from "next/server";

import { errorResponse, requireContext } from "@/lib/network/http";
import { listOrgPatients, validatePatientImport } from "@/lib/network/admin";
import { importPatients, importPatientsSchema } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/orgs/:orgId/patients — import up to 100 patients with history (idempotent on recordRef).
 * ?dryRun=1 validates up to 500 rows and reports per-row errors without writing.
 */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    if (new URL(request.url).searchParams.get("dryRun") === "1") {
      const body = (await request.json().catch(() => ({}))) as { patients?: unknown };
      return NextResponse.json(await validatePatientImport(r.ctx, params.orgId, Array.isArray(body.patients) ? body.patients : []));
    }
    const input = importPatientsSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json({ rows: await importPatients(r.ctx, params.orgId, input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/orgs/:orgId/patients?q= — operational list (identity and record number only) for any member. */
export async function GET(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json({ rows: await listOrgPatients(r.ctx, params.orgId, new URL(request.url).searchParams.get("q")?.slice(0, 80) || undefined) });
  } catch (error) {
    return errorResponse(error);
  }
}
