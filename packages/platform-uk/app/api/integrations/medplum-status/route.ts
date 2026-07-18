import { NextResponse } from "next/server";

import { getMedplumRehearsalStatus, pushToMedplum } from "@/lib/medplum-client";
import { resolveOptionalAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * Honest Medplum rehearsal status (dry-run).
 * Reports ENABLE_MEDPLUM_SYNC enabled/disabled without inventing live sync.
 * Never calls EMIS. Optional ?probe=push refuses when flag is off.
 */
export async function GET(request: Request) {
  const context = await resolveOptionalAuthenticatedUserScope(request);
  const status = getMedplumRehearsalStatus();
  const url = new URL(request.url);
  const probe = url.searchParams.get("probe")?.trim();

  let pushProbe: { attempted: boolean; ok: boolean; liveEmis: false; error?: string } | null = null;
  if (probe === "push") {
    const result = await pushToMedplum({
      resourceType: "Bundle",
      type: "collection",
      id: "medplum-dry-run-probe",
      entry: []
    });
    pushProbe = {
      attempted: true,
      ok: result.ok,
      liveEmis: false,
      error: result.error
    };
  }

  return NextResponse.json({
    artifactType: "aksh-uk-medplum-rehearsal-status",
    requestedBy: context?.userEmail ?? context?.scopeKey ?? "public",
    liveEmis: false,
    liveSyncInvented: false,
    status,
    pushProbe,
    note:
      status.mode === "disabled"
        ? "Flag off — accept path never pushes. This endpoint is status-only."
        : "Flag on — rehearsal mode only; not EMIS write-back."
  });
}
