import { NextResponse } from "next/server";

import { isLlmOracleConfigured, runOracleAgent } from "@/lib/agents/llm-oracle";
import { getOracleModelCard } from "@/lib/precision-health/oracle-model-card";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  const modelCard = getOracleModelCard();
  return NextResponse.json({
    available: true,
    llmConfigured: isLlmOracleConfigured(),
    mode: isLlmOracleConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    modelCard,
    autoRetrain: false,
    physiologicalTwin: false,
    governedReleaseSop: modelCard.governedReleaseSop,
    note: "ORACLE drafts never write to the EHR. HITL Accept/Edit/Reject is required before staging. No silent auto-retrain — see GOVERNED_MODEL_RELEASE_SOP."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; caseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const draft = await runOracleAgent({ patientId });
  if (!draft) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: ORACLE draft generated (${draft.mode}/${draft.dataSource})`,
    detail: `score=${draft.oracleScore}; risk=${draft.oracleRisk}; confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "ORACLE",
    resourceRef: `${draft.patientLabel} (${draft.patientId})`,
    payload: {
      mode: draft.mode,
      dataSource: draft.dataSource,
      oracleScore: draft.oracleScore,
      oracleRisk: draft.oracleRisk,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false,
    modelCard: getOracleModelCard(),
    autoRetrain: false,
    physiologicalTwin: false
  });
}
