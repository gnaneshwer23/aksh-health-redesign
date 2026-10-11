import { NextResponse } from "next/server";

import { getPilotReport, pilotReportCsv } from "@/lib/access/pilot-report";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/orgs/:orgId/pilot-report?from&to&format=csv — the pilot readout across complete weeks (PRD §10.3, §17). */
export async function GET(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const q = new URL(request.url).searchParams;
    const report = await getPilotReport(r.ctx, params.orgId, { from: q.get("from"), to: q.get("to") });
    if (q.get("format") === "csv") {
      return new NextResponse(pilotReportCsv(report), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="aksh-pilot-readout-${report.window.from}-${report.window.to}.csv"` } });
    }
    return NextResponse.json(report);
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/pilot-report");
  }
}
