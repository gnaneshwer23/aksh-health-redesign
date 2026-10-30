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
    surface: "domain_prep",
    synthetic: true,
    ehrWrite: false,
    autonomousClinicalAction: false,
    clinicalValidationClaim: false,
    primaryDecisionHref: "/dashboard/gp/review-queue",
    note:
      "Continuous-care domain prep / ops view — not a second Accept/Edit/Reject queue. GP clinical drafts decide on the primary review worklist.",
  });
}
