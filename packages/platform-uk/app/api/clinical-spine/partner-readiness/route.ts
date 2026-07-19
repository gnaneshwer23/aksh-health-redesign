import { NextResponse } from "next/server";

import {
  buildPartnerReadinessPack,
  SPINE_PARTNER_HONESTY
} from "@/lib/clinical-spine/partner-readiness";
import { listPartnerGateArtifacts } from "@/lib/repositories/partner-gate-artifact-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/clinical-spine/partner-readiness
 * Consolidated Phase F partner / regulatory readiness pack.
 * Always liveEmis:false · never claims signed DPIA/CSO/MHRA/DCB0129.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  try {
    const { records } = await listPartnerGateArtifacts({
      scopeKey: auth.context.scopeKey,
      limit: 50
    });
    const pack = buildPartnerReadinessPack({ artifacts: records });

    return NextResponse.json({
      ...pack,
      ...SPINE_PARTNER_HONESTY,
      liveEmis: false,
      autoRetrain: false,
      physiologicalTwin: false
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Partner readiness pack failed.",
        liveEmis: false,
        autoRetrain: false,
        physiologicalTwin: false
      },
      { status: 400 }
    );
  }
}
