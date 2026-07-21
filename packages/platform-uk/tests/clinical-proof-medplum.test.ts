import assert from "node:assert/strict";

import {
  dryRunMedplumStagingSync,
  getMedplumRehearsalStatus,
  probeMedplumOAuth,
  pushToMedplum,
  resolveMedplumOAuthTokenUrl
} from "../lib/medplum-client";
import { isMedplumSyncEnabled, shouldSyncAcceptedCaseToMedplum } from "../lib/integration-config";
import type { ReviewCase } from "../lib/types";

async function run() {
  const previous = process.env.ENABLE_MEDPLUM_SYNC;
  const previousId = process.env.MEDPLUM_CLIENT_ID;
  const previousSecret = process.env.MEDPLUM_CLIENT_SECRET;
  delete process.env.ENABLE_MEDPLUM_SYNC;
  delete process.env.MEDPLUM_CLIENT_ID;
  delete process.env.MEDPLUM_CLIENT_SECRET;

  assert.equal(isMedplumSyncEnabled(), false);
  const disabled = getMedplumRehearsalStatus();
  assert.equal(disabled.mode, "disabled");
  assert.equal(disabled.liveEmis, false);
  assert.equal(disabled.syncFlagEnabled, false);
  assert.equal(disabled.dryRunEligible, false);

  const refused = await pushToMedplum({ resourceType: "Bundle", type: "collection", entry: [] });
  assert.equal(refused.ok, false);
  assert.equal(refused.liveEmis, false);
  assert.ok(refused.error?.toLowerCase().includes("disabled"));

  const dryDisabled = await dryRunMedplumStagingSync({ patientId: "P001" });
  assert.equal(dryDisabled.attempted, false);
  assert.equal(dryDisabled.syncFlagEnabled, false);
  assert.equal(dryDisabled.liveEmis, false);

  const authMissing = await probeMedplumOAuth();
  assert.equal(authMissing.attempted, false);
  assert.equal(authMissing.ok, false);
  assert.equal(authMissing.liveEmis, false);
  assert.ok(authMissing.error?.toLowerCase().includes("not configured"));

  assert.equal(
    resolveMedplumOAuthTokenUrl("https://api.medplum.example/fhir/R4"),
    "https://api.medplum.example/oauth2/token"
  );

  const existing = { status: "pending_review" } as ReviewCase;
  const accepted = {
    status: "accepted",
    frozenArtifact: { exportedResources: { resourceType: "Bundle" } }
  } as ReviewCase;
  assert.equal(shouldSyncAcceptedCaseToMedplum(existing, accepted, accepted), false);

  process.env.ENABLE_MEDPLUM_SYNC = "true";
  const enabled = getMedplumRehearsalStatus();
  assert.equal(enabled.syncFlagEnabled, true);
  assert.equal(enabled.liveEmis, false);
  assert.equal(enabled.dryRunEligible, true);
  assert.ok(enabled.mode === "rehearsal_ready" || enabled.mode === "rehearsal_no_credentials");
  assert.ok(enabled.note.toLowerCase().includes("oauth") || enabled.note.toLowerCase().includes("credential"));

  // Dry-run status route exists and documents honest disabled/enabled modes
  const fs = await import("node:fs");
  const path = await import("node:path");
  const statusRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/integrations/medplum-status/route.ts"),
    "utf8"
  );
  assert.ok(statusRoute.includes("getMedplumRehearsalStatus"));
  assert.ok(statusRoute.includes("dryRunMedplumStagingSync"));
  assert.ok(statusRoute.includes("probeMedplumOAuth"));
  assert.ok(statusRoute.includes('probe === "auth"'));
  assert.ok(statusRoute.includes("liveEmis: false"));
  assert.ok(statusRoute.includes("liveSyncInvented: false"));

  const smokeScript = fs.readFileSync(
    path.join(process.cwd(), "scripts/smoke-medplum-rehearsal.mjs"),
    "utf8"
  );
  assert.ok(smokeScript.includes("ENABLE_MEDPLUM_SYNC"));
  assert.ok(smokeScript.includes("inventedLiveSync"));
  assert.ok(smokeScript.includes("degradedRehearsal"));
  assert.ok(smokeScript.includes("oauthDirect"));

  const voiceRecorder = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/VoiceRecorder.tsx"),
    "utf8"
  );
  assert.ok(voiceRecorder.includes("voice-simulated-asr-banner"));
  assert.ok(voiceRecorder.includes("Simulated ASR"));

  const spinePanel = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spinePanel.includes("medplum-honesty-banner"));

  if (previous === undefined) delete process.env.ENABLE_MEDPLUM_SYNC;
  else process.env.ENABLE_MEDPLUM_SYNC = previous;
  if (previousId === undefined) delete process.env.MEDPLUM_CLIENT_ID;
  else process.env.MEDPLUM_CLIENT_ID = previousId;
  if (previousSecret === undefined) delete process.env.MEDPLUM_CLIENT_SECRET;
  else process.env.MEDPLUM_CLIENT_SECRET = previousSecret;

  console.log("Medplum FHIR rehearsal flag contract passed (status dry-run + smoke script).");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
