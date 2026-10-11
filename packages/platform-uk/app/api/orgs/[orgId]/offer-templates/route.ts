import { NextResponse } from "next/server";

import { approveTemplate, approveTemplateSchema, listTemplates, renderTemplate, SAMPLE_FACTS, templateProblems } from "@/lib/access/templates";
import { errorResponse, requireContext } from "@/lib/network/http";

export const dynamic = "force-dynamic";

/** GET /api/orgs/:orgId/offer-templates — the wording in force, its versions and the placeholders allowed. */
export async function GET(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    // ?preview=<body> checks proposed wording without saving it.
    const preview = new URL(request.url).searchParams.get("preview");
    const list = await listTemplates(r.ctx, params.orgId);
    if (preview !== null) return NextResponse.json({ ...list, check: { problems: templateProblems(preview), preview: renderTemplate(preview, SAMPLE_FACTS) } });
    return NextResponse.json(list);
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/offer-templates");
  }
}

/** POST /api/orgs/:orgId/offer-templates — an admin approves new wording (a new version). */
export async function POST(request: Request, props: { params: Promise<{ orgId: string }> }) {
  const params = await props.params;
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    return NextResponse.json(await approveTemplate(r.ctx, params.orgId, approveTemplateSchema.parse(await request.json().catch(() => ({})))), { status: 201 });
  } catch (error) {
    return errorResponse(error, "/api/orgs/:orgId/offer-templates");
  }
}
