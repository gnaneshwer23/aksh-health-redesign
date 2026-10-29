import { NextResponse } from "next/server";

import { buildAgentIntelligenceWorklist } from "@/lib/diabetes-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const items = await buildAgentIntelligenceWorklist({
    scopeKey: auth.context.scopeKey,
  });
  return NextResponse.json({
    items,
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    clinicalValidationClaim: false,
    note: "Phase 5 agent intelligence worklist — AI drafts awaiting clinician review only.",
  });
}
