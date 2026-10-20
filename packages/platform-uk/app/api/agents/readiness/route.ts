import { NextResponse } from "next/server";

import { evaluateReadiness } from "@/lib/agents/readiness";
import { tallyLoop } from "@/lib/clinical-spine/loop-outcomes";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { listAgentRunCases } from "@/lib/repositories/loop-outcomes-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * GET /api/agents/readiness — each agent's release criteria against this organisation's agent-loop results
 * (synthetic validation). Read-only; releasing an agent is a governed human decision, never automatic.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;
  const tenant = resolveTenantContext(request, auth.context);
  const loop = await listAgentRunCases(tenant.practiceId);
  const tally = tallyLoop(loop.cases);
  return NextResponse.json({
    source: loop.source,
    measuredOn: "synthetic validation (clinical-proof environment)",
    agentReviews: tally.runs,
    agents: evaluateReadiness(tally),
    note: "Numeric targets are proposed until the clinical safety officer confirms them. Meeting them does not release an agent.",
  });
}
