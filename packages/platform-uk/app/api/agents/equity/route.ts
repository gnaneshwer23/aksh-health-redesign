import { NextResponse } from "next/server";

import { isLlmEquityConfigured, runEquityAgent } from "@/lib/agents/llm-equity";
import { summariseLoopOutcomes } from "@/lib/clinical-spine/loop-outcomes";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { listAgentRunCases } from "@/lib/repositories/loop-outcomes-repository";
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
  // The organisation's own agent-loop results (aggregates only, small counts suppressed): what was drafted and what
  // clinicians did with it. Deterministic; never sent to a model.
  const tenant = resolveTenantContext(request, auth.context);
  const loop = await listAgentRunCases(tenant.practiceId);
  const loopOutcomes = { source: loop.source, ...summariseLoopOutcomes(loop.cases) };

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
      safetyNotes: draft.safetyNotes,
      loopRuns: loopOutcomes.runs
    }
  });

  return NextResponse.json({
    draft,
    loopOutcomes,
    hitlRequired: true,
    ehrWrite: false,
    shieldLogged: shield.persisted
  });
}
