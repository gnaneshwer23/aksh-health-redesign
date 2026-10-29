import { NextResponse } from "next/server";

import { buildContinuousCareWorklist } from "@/lib/diabetes-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/** Nurse/ops continuous-care queue — follow-ups + escalations owned by nurse role. */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const items = await buildContinuousCareWorklist({
    scopeKey: auth.context.scopeKey,
    roleFilter: "nurse",
  });

  return NextResponse.json({
    items,
    roleFilter: "nurse",
    synthetic: true,
    ehrWrite: false,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    note: "Phase 4 nurse continuous-care queue — synthetic demo; HITL preserved; no autonomous clinical actions.",
  });
}
