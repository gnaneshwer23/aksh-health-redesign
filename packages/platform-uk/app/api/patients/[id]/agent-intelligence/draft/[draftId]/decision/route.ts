import { NextResponse } from "next/server";

import { denyUnlessConnectedDiabetesDecisionScope } from "@/lib/clinical-proof/connected-diabetes-decision-scope";
import { denyUnlessConnectedPatientAccess } from "@/lib/clinical-proof/connected-patient-access";
import { decideAgentIntelligenceDraft } from "@/lib/diabetes-intelligence";
import type {
  AgentIntelDecisionAction,
  StructuredDraftPayload,
} from "@/lib/diabetes-intelligence/agent-intel-types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string; draftId: string }> };

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

  const actor = auth.context.userEmail ?? auth.context.userId;

  try {
    const snapshot = await decideAgentIntelligenceDraft(
      {
        patientId,
        draftId,
        action: body.action,
        actor,
        reason: body.reason,
        editedPayload: body.editedPayload,
      },
      { scopeKey: auth.context.scopeKey }
    );
    return NextResponse.json({
      ...snapshot,
      action: body.action,
      ehrWrite: false,
      autonomousClinicalAction: false,
      decidedByPersona: auth.context.clinicalPersona,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message, ehrWrite: false }, { status });
  }
}
