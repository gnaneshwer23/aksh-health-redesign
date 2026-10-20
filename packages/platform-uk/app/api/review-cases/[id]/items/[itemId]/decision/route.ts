import { NextResponse } from "next/server";

import { evaluateDecisionScope } from "@/lib/clinical-decision-scope";
import { recordSpineQueueDecisions } from "@/lib/clinical-spine/queue-decision";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { persistItemDecision } from "@/lib/repositories/review-decision-repository";
import { readReviewCases } from "@/lib/review-case-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { DecisionError, decideReviewItem, parseItemDecision } from "@/lib/workflow/decide-review-item";
import { draftPendingReferrals } from "@/lib/clinical-spine/enqueue";

export const dynamic = "force-dynamic";

/**
 * POST /api/review-cases/:id/items/:itemId/decision — accept, edit or reject one draft.
 * The server authorises the reviewer, checks the case version, applies the decision, and saves it together with its
 * audit record in one transaction. The response is the stored outcome, not an optimistic guess.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await props.params;
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;
  const { scopeKey, userId, userRole } = auth.context;
  if (userRole !== "clinical_reviewer") {
    return NextResponse.json({ error: "Only a clinical reviewer may accept, edit or reject a draft." }, { status: 403 });
  }
  try {
    const req = parseItemDecision(await request.json().catch(() => ({})));
    const tenant = resolveTenantContext(request, auth.context);
    const existing = (await readReviewCases(scopeKey, tenant.practiceId)).find((c) => c.id === id.slice(0, 120));
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    if (existing.userId && existing.userId !== userId) return NextResponse.json({ error: "Not your case" }, { status: 403 });

    const actor = auth.context.userEmail ?? userId;
    const decided = decideReviewItem(existing, itemId.slice(0, 120), req, actor);
    const { outcome, audit } = decided;
    // PATHWAY (FR-AGT-024): referral drafts appear once the note and codes are accepted; saved with this decision.
    const next = draftPendingReferrals(decided.next);
    // Role-specific gates (for example medication decisions) are enforced here, on the server.
    const scope = evaluateDecisionScope({ persona: auth.context.clinicalPersona, existing, next });
    if (!scope.allowed) return NextResponse.json({ error: `Forbidden. ${scope.reason}` }, { status: 403 });

    const saved = await persistItemDecision({ next, expectedVersion: req.expectedVersion, scopeKey, practiceId: tenant.practiceId, userId, audit });

    // Learning record for the decision; failure is reported, never hidden, and does not undo the decision.
    let spine: Awaited<ReturnType<typeof recordSpineQueueDecisions>> | null = null;
    let learningError: string | null = null;
    try {
      spine = await recordSpineQueueDecisions({ existing, next, scopeKey, actor, offerHealthPlan: req.offerHealthPlan === true });
    } catch (error) {
      learningError = error instanceof Error ? error.message : "learning record failed";
    }

    return NextResponse.json({
      reviewCase: next,
      outcome: { ...outcome, auditId: saved.auditId, auditDurable: saved.auditDurable },
      spine,
      learning: { recorded: Boolean(spine?.learningEventIds?.length), error: learningError },
      // Item decisions never deliver anything externally; staging happens only when the whole case is accepted.
      delivery: { staged: false, externalDelivery: "none" },
    });
  } catch (error) {
    if (error instanceof DecisionError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("[review-decision] failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The decision was not recorded. Nothing changed; try again." }, { status: 503 });
  }
}
