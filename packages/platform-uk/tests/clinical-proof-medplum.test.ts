import assert from "node:assert/strict";

import {
  getMedplumRehearsalStatus,
  pushToMedplum,
  resolveMedplumOAuthTokenUrl
} from "../lib/medplum-client";
import { isMedplumSyncEnabled, shouldSyncAcceptedCaseToMedplum } from "../lib/integration-config";
import type { ReviewCase } from "../lib/types";

async function run() {
  const previous = process.env.ENABLE_MEDPLUM_SYNC;
  delete process.env.ENABLE_MEDPLUM_SYNC;

  assert.equal(isMedplumSyncEnabled(), false);
  const disabled = getMedplumRehearsalStatus();
  assert.equal(disabled.mode, "disabled");
  assert.equal(disabled.liveEmis, false);
  assert.equal(disabled.syncFlagEnabled, false);

  const refused = await pushToMedplum({ resourceType: "Bundle", type: "collection", entry: [] });
  assert.equal(refused.ok, false);
  assert.equal(refused.liveEmis, false);
  assert.ok(refused.error?.toLowerCase().includes("disabled"));

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
  assert.ok(enabled.mode === "rehearsal_ready" || enabled.mode === "rehearsal_no_credentials");

  // Dry-run status route exists and documents honest disabled/enabled modes
  const fs = await import("node:fs");
  const path = await import("node:path");
  const statusRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/integrations/medplum-status/route.ts"),
    "utf8"
  );
  assert.ok(statusRoute.includes("getMedplumRehearsalStatus"));
  assert.ok(statusRoute.includes("liveEmis: false"));
  assert.ok(statusRoute.includes("liveSyncInvented: false"));

  const smokeScript = fs.readFileSync(
    path.join(process.cwd(), "scripts/smoke-medplum-rehearsal.mjs"),
    "utf8"
  );
  assert.ok(smokeScript.includes("ENABLE_MEDPLUM_SYNC"));
  assert.ok(smokeScript.includes("inventedLiveSync"));

  if (previous === undefined) delete process.env.ENABLE_MEDPLUM_SYNC;
  else process.env.ENABLE_MEDPLUM_SYNC = previous;

  console.log("Medplum FHIR rehearsal flag contract passed (status dry-run + smoke script).");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
