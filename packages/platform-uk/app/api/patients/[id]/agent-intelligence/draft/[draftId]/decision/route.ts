import { NextResponse } from "next/server";

import { findOpenReviewItemForDiabetesDraft } from "@/lib/clinical-spine/diabetes-draft-enqueue";
import { denyUnlessConnectedDiabetesDecisionScope } from "@/lib/clinical-proof/connected-diabetes-decision-scope";
import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import type {
  AgentIntelDecisionAction,
  StructuredDraftPayload,
} from "@/lib/diabetes-intelligence/agent-intel-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; draftId: string }> };

/**
 * P1 worklist honesty — agent-intel Accept/Edit/Reject is not a second HITL surface.
 * Clinicians decide on the primary review-case worklist (`/review/{caseId}`).
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const params = await context.params;
  const patientId = params.id?.trim();
  const draftId = params.draftId?.trim();
  if (!patientId || !draftId) {
    return NextResponse.json({ error: "patient id and draftId required" }, { status: 400 });
  }

  const denied = denyUnlessConnectedPatientAccess(auth.context, patientId);
  if (denied) return denied;

  const personaDenied = denyUnlessConnectedDiabetesDecisionScope(
    auth.context.clinicalPersona,
    "agent_draft"
  );
  if (personaDenied) return personaDenied;

  let body: {
    action?: AgentIntelDecisionAction;
    reason?: string;
    editedPayload?: StructuredDraftPayload;
  } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.action || !["accept", "edit", "reject"].includes(body.action)) {
    return NextResponse.json(
      { error: "action must be accept | edit | reject" },
      { status: 400 }
    );
  }

  const tenant = resolveTenantContext(request, auth.context);
  const mirrored = await findOpenReviewItemForDiabetesDraft({
    diabetesDraftId: draftId,
    scopeKey: auth.context.scopeKey,
    practiceId: tenant.practiceId,
  });

  if (mirrored) {
    return NextResponse.json(
      {
        error:
          "Agent-intelligence drafts are decided on the primary GP review worklist, not this domain endpoint.",
        code: "USE_PRIMARY_REVIEW",
        decisionFinalised: false,
        ehrWrite: false,
        autonomousClinicalAction: false,
        caseId: mirrored.caseId,
        itemId: mirrored.itemId,
        decisionHref: mirrored.decisionHref,
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Domain agent-intelligence is prep only. Run orchestration (Guardian PASS/REVIEW) so the draft is enqueued to the primary review worklist, then Accept/Edit/Reject there.",
      code: "PREP_ONLY_ENQUEUE_REQUIRED",
      decisionFinalised: false,
      ehrWrite: false,
      autonomousClinicalAction: false,
      decisionHref: `/dashboard/gp/review-queue?patient=${encodeURIComponent(patientId)}`,
    },
    { status: 409 }
  );
}
