import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  assertEmisStagingNeverWrites,
  assertSimulatedWriteRequiresApproval,
  HITL_INVARIANTS
} from "../lib/clinical-proof/hitl-invariants";
import { resetEhrWritebackSimForTests } from "../lib/clinical-proof/ehr-writeback-sim";
import { getEmisIntegrationStatus } from "../lib/emis-staging";

function run() {
  resetEhrWritebackSimForTests();

  assert.ok(HITL_INVARIANTS.zeroAutonomousEhrWrite.includes("approval"));

  const emis = assertEmisStagingNeverWrites();
  assert.equal(emis.status.liveWriteBack, false);
  assert.equal(emis.entry.ehrWriteAttempted, false);
  assert.equal(getEmisIntegrationStatus().enabled, false);

  const sim = assertSimulatedWriteRequiresApproval();
  assert.equal(sim.denied.ok, false);
  assert.equal(sim.allowed.ok, true);
  assert.equal(sim.replay.ok, false);
  assert.equal(sim.simStatus.liveEmis, false);

  // Agent route source must declare no EHR write in responses (static contract check)
  const guardianRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/agents/guardian/route.ts"),
    "utf8"
  );
  assert.ok(guardianRoute.includes("ehrWrite: false"), "GUARDIAN must return ehrWrite: false");
  assert.ok(guardianRoute.includes("hitlRequired: true"), "GUARDIAN must require HITL");

  const oracleRoute = fs.readFileSync(path.join(process.cwd(), "app/api/agents/oracle/route.ts"), "utf8");
  assert.ok(oracleRoute.includes("ehrWrite: false"));

  const emisRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/integrations/emis-staging/route.ts"),
    "utf8"
  );
  assert.ok(emisRoute.includes("liveWriteBack: false"));
  assert.ok(emisRoute.includes("No EMIS write was attempted"));

  console.log("HITL non-bypass / zero-autonomous-write invariants passed.");
}

void run();
