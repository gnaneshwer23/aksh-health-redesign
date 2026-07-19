import { NextResponse } from "next/server";

import { getEvidencePackLinks, SPINE_PARTNER_HONESTY } from "@/lib/clinical-spine/partner-readiness";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * GET /api/clinical-spine/evidence-pack-export
 * Partner-facing index of clinical proof / safety case / gate docs.
 * Does not invent signed approvals — links + honesty flags only.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const links = getEvidencePackLinks();

  return NextResponse.json({
    artifactType: "aksh-evidence-pack-export",
    phase: "F",
    generatedAt: new Date().toISOString(),
    honesty: { ...SPINE_PARTNER_HONESTY },
    liveEmis: false,
    autoRetrain: false,
    physiologicalTwin: false,
    signedApprovalsInvented: false,
    regenerateHint: "npm run evidence:pack",
    links,
    partnerReviewNote:
      "Share these paths/docs with partners for review. Gate 1–3 and DPIA/CSO remain unsigned until humans sign out-of-band.",
    note: "Export index only — not a certification pack and not a live EMR evidence claim."
  });
}
