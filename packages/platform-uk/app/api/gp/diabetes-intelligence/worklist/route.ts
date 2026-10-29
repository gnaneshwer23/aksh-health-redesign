import { NextResponse } from "next/server";

import { buildGlucoseIntelligenceWorklist } from "@/lib/diabetes-intelligence";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/** Synthetic diabetes glucose intelligence review worklist for GP dashboard. */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const items = await buildGlucoseIntelligenceWorklist({
    scopeKey: auth.context.scopeKey,
  });

  return NextResponse.json({
    synthetic: true,
    ehrWrite: false,
    clinicalValidationClaim: false,
    items,
  });
}
