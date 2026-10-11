import { NextResponse } from "next/server";
import { z } from "zod";

import { getWeeklyReview, listSignOffs, signOffWeek } from "@/lib/access/weekly-review";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

const signOffSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().trim().min(1).max(4000),
  actionsAgreed: z.string().max(4000).nullish(),
  attendees: z.string().max(1000).nullish(),
});

/** GET /api/orgs/:orgId/weekly-review?week=YYYY-MM-DD — the pilot weekly review (default: last complete week) and its sign-offs. */
export async function GET(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const week = new URL(request.url).searchParams.get("week");
    const report = await getWeeklyReview(r.ctx, params.orgId, week);
    const signOffs = await listSignOffs(r.ctx, params.orgId, report.week.start);
    return NextResponse.json({ report, signOffs, canSignOff: r.ctx.adminOrgIds.includes(params.orgId) });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/weekly-review");
  }
}

/** POST /api/orgs/:orgId/weekly-review — an organisation admin signs off a complete week; the figures are frozen. */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const body = signOffSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await signOffWeek(r.ctx, params.orgId, body), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/weekly-review");
  }
}
