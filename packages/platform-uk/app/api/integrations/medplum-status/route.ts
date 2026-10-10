import { NextResponse } from "next/server";

import {
  dryRunMedplumStagingSync,
  getMedplumRehearsalStatus,
  probeMedplumOAuth,
  pushToMedplum
} from "@/lib/medplum-client";
import { resolveOptionalAuthenticatedUserScope } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

/**
 * Honest Medplum rehearsal status.
 * Reports ENABLE_MEDPLUM_SYNC enabled/disabled without inventing live sync.
 * Never calls EMIS.
 * ?probe=auth — client_credentials OAuth only (no FHIR write)
 * ?probe=push — empty collection push (legacy)
 * ?probe=dry-run — FHIR-shaped staging bundle dry-run when flag on; cleared when off
 */
export async function GET(request: Request) {
  const context = await resolveOptionalAuthenticatedUserScope(request);
  const status = getMedplumRehearsalStatus();
  const url = new URL(request.url);
  const probe = url.searchParams.get("probe")?.trim();

  let pushProbe: {
    attempted: boolean;
    ok: boolean;
    liveEmis: false;
    error?: string;
    kind?: string;
    bundleSummary?: string;
  } | null = null;

  let authProbe: Awaited<ReturnType<typeof probeMedplumOAuth>> | null = null;

  if (probe === "auth") {
    authProbe = await probeMedplumOAuth();
  } else if (probe === "dry-run") {
    const result = await dryRunMedplumStagingSync({
      patientId: url.searchParams.get("patientId") ?? undefined,
      caseId: url.searchParams.get("caseId") ?? undefined
    });
    pushProbe = {
      attempted: result.attempted,
      ok: result.ok,
      liveEmis: false,
      error: result.error,
      kind: "staging_bundle_dry_run",
      bundleSummary: result.bundleSummary
    };
  } else if (probe === "push") {
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
      error: result.error,
      kind: "empty_collection_push"
    };
  }

  const refreshed = getMedplumRehearsalStatus();

  return NextResponse.json({
    artifactType: "aksh-uk-medplum-rehearsal-status",
    requestedBy: context?.userEmail ?? context?.scopeKey ?? "public",
    liveEmis: false,
    liveSyncInvented: false,
    emrWriteBack: false,
    status: refreshed,
    authProbe,
    pushProbe,
    note:
      refreshed.mode === "disabled"
        ? "Flag off — accept path never pushes. Dry-run cleared. This endpoint is status-only."
        : refreshed.mode === "rehearsal_no_credentials"
          ? "Flag on · credentials missing — set MEDPLUM_CLIENT_ID + MEDPLUM_CLIENT_SECRET; not EHR."
          : "Flag on · credentials present — verify OAuth with ?probe=auth; Invalid client → regenerate Client Secret in Medplum App → Clients; not EHR write-back."
  });
}
