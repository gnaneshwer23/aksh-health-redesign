import { NextResponse } from "next/server";

import { buildContinuousCareWorklist } from "@/lib/diabetes-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/** Synthetic continuous-care worklist for GP dashboard (follow-ups + escalations). */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const items = await buildContinuousCareWorklist({
    scopeKey: auth.context.scopeKey,
  });

  return NextResponse.json({
    items,
    synthetic: true,
    ehrWrite: false,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    note: "Phase 4 continuous care worklist — synthetic demo only.",
  });
}
