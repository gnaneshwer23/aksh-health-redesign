/**
 * Milestone B — PHI-safe decision-funnel aggregates for Agent Ops (read-only).
 * Milestone E P1.2 — Postgres-preferred storeMode honesty (file visible when hermetic).
 * Avoids POST /api/agents/equity (which drafts COMPASS + writes SHIELD).
 */
import { NextResponse } from "next/server";

import { summariseLoopOutcomes } from "@/lib/clinical-spine/loop-outcomes";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { listAgentRunCases } from "@/lib/repositories/loop-outcomes-repository";
import { AGENT_OPS_ROLES } from "@/lib/security/agent-authz";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAppRole(request, AGENT_OPS_ROLES);
  if (auth.response || !auth.context) return auth.response;

  const tenant = resolveTenantContext(request, auth.context);
  const loop = await listAgentRunCases({
    practiceId: tenant.practiceId,
    scopeKey: auth.context.scopeKey,
  });
  const loopOutcomes = {
    source: loop.source,
    storeMode: loop.storeMode,
    ...summariseLoopOutcomes(loop.cases),
  };

  return NextResponse.json({
    ...loopOutcomes,
    practiceId: tenant.practiceId,
    clinicalValidationClaim: false,
    ehrWrite: false,
    note:
      "Aggregates only; small cells suppressed. Acceptance rate ≠ clinical accuracy. storeMode is postgres | file | file_fallback (Milestone E P1.2) — file-mode sandboxes are not silently emptied.",
  });
}
