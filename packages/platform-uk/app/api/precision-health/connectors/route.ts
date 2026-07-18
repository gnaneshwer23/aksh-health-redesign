import { NextResponse } from "next/server";

import { listConnectorStatuses, PHASE2_CONNECTOR_ENV_VARS } from "@/lib/precision-health/connectors";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

/**
 * GET /api/precision-health/connectors
 * Registry status: enabled/disabled, liveStream true/false (honest).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const connectors = listConnectorStatuses();

  return NextResponse.json({
    artifactType: "aksh-precision-health-connectors",
    connectors,
    documentedEnvVarNames: [...PHASE2_CONNECTOR_ENV_VARS],
    liveStreamInvented: false,
    ehrWrite: false,
    note: "Phase 2 connector registry. liveStream:true only when real Fitbit client env is present — ingest still does not invent device reads."
  });
}
