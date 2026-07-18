import { NextResponse } from "next/server";

import { isLlmDrAssistConfigured, runDrAssistAgent } from "@/lib/agents/llm-dr-assist";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    available: true,
    llmConfigured: isLlmDrAssistConfigured(),
    mode: isLlmDrAssistConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    note: "Dr.Assist coding drafts never write to the EHR. HITL Accept/Edit/Reject is required before staging."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { patientId?: string; conditionHint?: string; caseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const draft = await runDrAssistAgent({
    patientId,
    conditionHint: body.conditionHint
  });
  if (!draft) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: Dr.Assist draft generated (${draft.mode}/${draft.dataSource})`,
    detail: `codes=${draft.codes.length}; confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "DrASSIST",
    resourceRef: `${draft.patientLabel} (${draft.patientId})`,
    payload: {
      mode: draft.mode,
      dataSource: draft.dataSource,
      codeCount: draft.codes.length,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false
  });
}
