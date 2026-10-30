import { NextResponse } from "next/server";

import { isLlmSynthesisConfigured, runSynthesisAgent } from "@/lib/agents/llm-synthesis";
import { enforceAgentInvokeRateLimit } from "@/lib/agents/rate-limit-guards";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { AGENT_INVOKE_ROLES } from "@/lib/security/agent-authz";
import { phiSafeResourceRef } from "@/lib/security/phi-safe-ref";
import { requireAppRole } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    available: true,
    llmConfigured: isLlmSynthesisConfigured(),
    mode: isLlmSynthesisConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    note: "SYNTHESIS drafts never write to the EHR. HITL Accept/Edit/Reject is required."
  });
}

export async function POST(request: Request) {
  const auth = await requireAppRole(request, AGENT_INVOKE_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const limited = await enforceAgentInvokeRateLimit(request, auth.context.userId);
  if (limited) return limited;

  let body: { transcript?: string; patientLabel?: string; caseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcript = body.transcript?.trim();
  if (!transcript) {
    return NextResponse.json({ error: "transcript is required." }, { status: 400 });
  }

  const draft = await runSynthesisAgent({
    transcript,
    patientLabel: body.patientLabel
  });

  void persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: SYNTHESIS draft generated (${draft.mode})`,
    detail: `confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "SYNTHESIS",
    resourceRef: phiSafeResourceRef(body.caseId ?? "synthesis", {
      caseId: body.caseId,
      agentLabel: "SYNTHESIS",
    }),
    payload: {
      mode: draft.mode,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false
  });
}
