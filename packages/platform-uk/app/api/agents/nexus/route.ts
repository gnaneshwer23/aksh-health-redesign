import { NextResponse } from "next/server";

import { isLlmNexusConfigured, runNexusAgent } from "@/lib/agents/llm-nexus";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/agents/nexus — NEXUS (Clinical Intelligence Agent) capabilities.
 */
export async function GET() {
  return NextResponse.json({
    available: true,
    agent: "NEXUS",
    role: "Clinical Intelligence Agent",
    llmConfigured: isLlmNexusConfigured(),
    mode: isLlmNexusConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    note: "NEXUS correlations are drafts for clinician review only. HITL Accept/Edit/Reject required before staging. No EHR write."
  });
}

/**
 * POST /api/agents/nexus — correlate conditions × medications × risk for one patient.
 * Draft only; SHIELD-audited; ehrWrite:false.
 */
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

  const draft = await runNexusAgent({ patientId });
  if (!draft) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: NEXUS correlations drafted (${draft.mode}/${draft.dataSource})`,
    detail: `correlations=${draft.correlations.length}; confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "NEXUS",
    resourceRef: `${draft.patientLabel} (${draft.patientId})`,
    payload: {
      mode: draft.mode,
      dataSource: draft.dataSource,
      correlationCount: draft.correlations.length,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false
  });
}
