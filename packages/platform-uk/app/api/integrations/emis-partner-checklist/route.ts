import { NextResponse } from "next/server";

import { getEmisPartnerChecklist } from "@/lib/precision-health/emis-partner-checklist";
import { getEmisIntegrationStatus } from "@/lib/emis-staging";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * EMIS Partner write-back readiness checklist.
 * Always liveEmis:false — never claims live Partner EMR write-back.
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  return NextResponse.json({
    ...getEmisPartnerChecklist(),
    stagingStatus: getEmisIntegrationStatus(),
    liveEmis: false,
    banner: getEmisIntegrationStatus().notLiveBanner
  });
}
