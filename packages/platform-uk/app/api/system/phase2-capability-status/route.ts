import { NextResponse } from "next/server";

import { getPhase2AgentCapabilityStatus } from "../../../../lib/agents/phase2-capability-status";
import { requireAuthenticatedUserScope } from "../../../../lib/user-scope";

/**
 * GET /api/system/phase2-capability-status
 * E1 (docs/PHASED_BUILD_PLAN_E.md) — read-only honesty status for PRISM/ATLAS
 * (Phase 2 roadmap agents). Authenticated-only (any role): this is pure
 * "not built" status information, not a governance/audit export, so it is
 * intentionally not restricted to the clinical_reviewer/operations_lead
 * allow-list E2 applies to the system/governance-export routes.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  return NextResponse.json(getPhase2AgentCapabilityStatus());
}
