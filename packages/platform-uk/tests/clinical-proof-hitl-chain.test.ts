import assert from "node:assert/strict";

import { runHitlStagingSimWritebackChain } from "../lib/clinical-proof/hitl-writeback-chain";
import { listSimulatedEhrWrites, resetEhrWritebackSimForTests } from "../lib/clinical-proof/ehr-writeback-sim";
import { getEmisIntegrationStatus, listEmisStagingQueue } from "../lib/emis-staging";

async function run() {
  resetEhrWritebackSimForTests();

  const chain = await runHitlStagingSimWritebackChain({
    caseId: "unit-hitl-chain",
    clinicianId: "gp-unit-chain",
    clinicianName: "Dr Unit Chain"
  });

  assert.equal(chain.emisLiveWriteBack, false);
  assert.equal(chain.accept.ehrWriteAttempted, false);
  assert.equal(chain.accept.liveEmis, false);
  assert.equal(chain.accept.staged.fhirR4Valid, true);
  assert.ok(chain.accept.staged.resourceCount >= 5);
  assert.ok(chain.accept.stagingEntryId.startsWith("emis-stage-"));
  assert.ok(chain.accept.simWriteId.startsWith("sim-ehr-"));
  assert.ok(chain.accept.simulatedEhrEntryIds.length >= 2);
  assert.equal(chain.reject.simulatedEhrUnchanged, true);

  assert.equal(chain.reject.staged, false);
  assert.equal(chain.reject.simWritesBefore, chain.reject.simWritesAfter);

  assert.equal(chain.replayDenied, true);
  assert.equal(chain.unauthenticatedDenied, true);

  assert.equal(getEmisIntegrationStatus().liveWriteBack, false);
  assert.ok(listEmisStagingQueue(5).some((e) => e.caseId === "unit-hitl-chain"));
  assert.equal(listSimulatedEhrWrites(5).length, 1);

  console.log(
    `HITL → FHIR stage → sim write-back chain passed (accept once, reject no-write, replay denied).`
  );
}

void run();
