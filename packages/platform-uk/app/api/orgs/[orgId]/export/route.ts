import { NextResponse } from "next/server";

import { exportOrganisation } from "@/lib/export/service";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/orgs/:orgId/export — the organisation's complete data as JSON (admins only; audited). */
export async function GET(_request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  try {
    const r = await requireContext();
    if (r instanceof NextResponse) return r;
    const data = await exportOrganisation(r.ctx, params.orgId);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aksh-organisation-${params.orgId}-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/export");
  }
}
