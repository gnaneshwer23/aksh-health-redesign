import { NextResponse } from "next/server";

import { isLlmGuardianConfigured, runGuardianAgent } from "@/lib/agents/llm-guardian";
import { enforceAgentInvokeRateLimit } from "@/lib/agents/rate-limit-guards";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { AGENT_INVOKE_ROLES } from "@/lib/security/agent-authz";
import { phiSafeResourceRef } from "@/lib/security/phi-safe-ref";
import { requireAppRole } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    available: true,
    llmConfigured: isLlmGuardianConfigured(),
    mode: isLlmGuardianConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    note: "GUARDIAN drafts never write to the EHR. HITL Accept/Edit/Reject is required before staging."
  });
}

export async function POST(request: Request) {
  const auth = await requireAppRole(request, AGENT_INVOKE_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const limited = await enforceAgentInvokeRateLimit(request, auth.context.userId);
  if (limited) return limited;

  let body: { patientId?: string; proposedDrug?: string; caseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patientId = body.patientId?.trim();
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required." }, { status: 400 });
  }

  const draft = await runGuardianAgent({
    patientId,
    proposedDrug: body.proposedDrug
  });

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: GUARDIAN draft generated (${draft.mode}/${draft.dataSource})`,
    detail: `status=${draft.overallStatus}; interactions=${draft.interactions.length}; confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "GUARDIAN",
    resourceRef: phiSafeResourceRef(draft.patientId, {
      caseId: body.caseId,
      agentLabel: "GUARDIAN",
    }),
    payload: {
      mode: draft.mode,
      dataSource: draft.dataSource,
      proposedDrug: draft.proposedDrug,
      overallStatus: draft.overallStatus,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false
  });
}
