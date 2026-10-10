import { NextResponse } from "next/server";

import { isLlmEquityConfigured, runEquityAgent } from "@/lib/agents/llm-equity";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    available: true,
    llmConfigured: isLlmEquityConfigured(),
    mode: isLlmEquityConfigured() ? "llm_with_deterministic_fallback" : "deterministic_only",
    note: "COMPASS (formerly EQUITY) drafts are aggregate/synthetic only. HITL required. No EHR write."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { focusCategory?: string; caseId?: string } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const draft = await runEquityAgent({ focusCategory: body.focusCategory });

  const shield = await persistShieldAuditEvent({
    action: "defer",
    actor: auth.context.userEmail ?? auth.context.userId,
    label: `SHIELD: COMPASS draft generated (${draft.mode}/${draft.dataSource})`,
    detail: `flags=${draft.equityFlags}; priorities=${draft.priorities.length}; confidence=${draft.confidence}`,
    category: "system",
    caseId: body.caseId,
    agentLabel: "COMPASS",
    resourceRef: draft.icsName,
    payload: {
      mode: draft.mode,
      dataSource: draft.dataSource,
      equityFlags: draft.equityFlags,
      priorities: draft.priorities,
      safetyNotes: draft.safetyNotes
    }
  });

  return NextResponse.json({
    draft,
    hitlRequired: true,
    ehrWrite: false,
    shieldLogged: shield.persisted
  });
}
