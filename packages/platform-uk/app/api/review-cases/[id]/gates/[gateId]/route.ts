import { NextResponse } from "next/server";

import { resolveTenantContext } from "@/lib/db/tenant-context";
import { persistItemDecision } from "@/lib/repositories/review-decision-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { CaseDecisionError, decideHumanGate, parseGateDecision } from "@/lib/workflow/decide-review-case";

export const dynamic = "force-dynamic";

/**
 * POST /api/review-cases/:id/gates/:gateId — record a clinician's decision on a human gate (urgent concern, referral,
 * medication). Signed-in identity, version check, and the audit record in the same transaction.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string; gateId: string }> }) {
  const { id, gateId } = await props.params;
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;
  const { scopeKey, userId, userRole } = auth.context;
  if (userRole !== "clinical_reviewer") {
    return NextResponse.json({ error: "Only a clinical reviewer may decide a human gate." }, { status: 403 });
  }
  try {
    const req = parseGateDecision(gateId, await request.json().catch(() => ({})));
    const tenant = resolveTenantContext(request, auth.context);
    const existing = (await readReviewCases(scopeKey, tenant.practiceId)).find((c) => c.id === id.slice(0, 120));
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (existing.userId && existing.userId !== userId) return NextResponse.json({ error: "Not your case" }, { status: 403 });
    const actor = auth.context.userEmail ?? userId;
    const { next, outcome, audit } = decideHumanGate(existing, req, actor);
    const saved = await persistItemDecision({ next, expectedVersion: req.expectedVersion, scopeKey, practiceId: tenant.practiceId, userId, audit });
    return NextResponse.json({ reviewCase: next, outcome: { ...outcome, auditId: saved.auditId, auditDurable: saved.auditDurable } });
  } catch (error) {
    if (error instanceof CaseDecisionError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    if (error instanceof Error && error.message.startsWith("STALE_CASE")) return NextResponse.json({ error: error.message, code: "STALE_CASE" }, { status: 409 });
    console.error("[gate-decision] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The gate decision was not recorded. Nothing changed; try again." }, { status: 503 });
  }
}
