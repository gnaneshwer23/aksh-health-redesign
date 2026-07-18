import { NextResponse } from "next/server";

import { listEvalFixtures, runGoldenEval, type EvalReport } from "@/lib/eval/score-agents";
import type { GoldenAgentId } from "@/lib/eval/golden-cases";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 60;

const AGENTS = new Set<GoldenAgentId>(["SYNTHESIS", "GUARDIAN", "ORACLE"]);

export async function GET() {
  return NextResponse.json({
    available: true,
    fixtures: listEvalFixtures(),
    note: "POST with optional { agent, caseIds } to score golden cases. HITL-safe: no EHR write.",
    ehrWrite: false,
    hitlRequired: true,
    docs: "docs/AGENT_EVAL_HARNESS.md"
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: { agent?: string; caseIds?: string[] } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agentRaw = body.agent?.trim().toUpperCase();
  let agent: GoldenAgentId | undefined;
  if (agentRaw) {
    if (!AGENTS.has(agentRaw as GoldenAgentId)) {
      return NextResponse.json(
        { error: "agent must be SYNTHESIS, GUARDIAN, or ORACLE." },
        { status: 400 }
      );
    }
    agent = agentRaw as GoldenAgentId;
  }

  const report: EvalReport = await runGoldenEval({
    agent,
    caseIds: Array.isArray(body.caseIds) ? body.caseIds.map(String) : undefined
  });

  return NextResponse.json({
    report,
    ehrWrite: false,
    hitlRequired: true
  });
}
