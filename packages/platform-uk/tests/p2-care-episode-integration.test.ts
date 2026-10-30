/**
 * P2 — end-to-end stakeholder care episode integration.
 * Threads one care_episode_id across intake → booking → nurse → orchestrate → review
 * and surfaces nurse_observation on the nurse worklist builder.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "p2-episode-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
const prevConductor = process.env.ENABLE_CONDUCTOR_FROM_INTAKE;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
delete process.env.ENABLE_CONDUCTOR_FROM_INTAKE;
process.chdir(tmp);

async function main() {
  const {
    resetCareEpisodeStoreForTests,
    getCareEpisode,
    runStakeholderEpisodeJourney,
  } = await import("../lib/care-episode");
  const { createInitialState } = await import("../lib/front-desk/store");
  const {
    buildNurseObservationWorklist,
    listOpenNurseObservationTasks,
  } = await import("../lib/front-desk/nurse-handoff");
  const { isConductorFromIntakeEnabled } = await import("../lib/integration-config");
  const { maybeConductorFromIntake } = await import("../lib/intake/conductor-from-intake");
  const { AGENT_DIRECTORY } = await import("../lib/agents");
  const { runVoiceCareEscalation } = await import("../lib/agents/voice-care");

  assert.equal(isConductorFromIntakeEnabled(), false, "CONDUCTOR-from-intake default off");

  const off = await maybeConductorFromIntake({
    patientId: "P002",
    actor: "p2-test",
    scopeKey: "shared",
    orchestrateAfterIntake: true,
  });
  assert.equal(off.enabled, false);
  assert.equal(off.ran, false);
  assert.equal(off.evaluationOnly, true);
  assert.equal(off.ehrWrite, false);

  const scopeKey = `p2ep_${Date.now()}`;
  await resetCareEpisodeStoreForTests(scopeKey);
  const state = createInitialState();
  const free = state.slots.find((s) => !s.patientId);
  assert.ok(free, "need free slot");

  const journey = await runStakeholderEpisodeJourney({
    state,
    patientId: "P002",
    patientLabel: "Synthetic Patel",
    actor: "p2-integration-test",
    scopeKey,
    slotId: free!.id,
    intakeCaseId: "intake-p2-1",
  });

  assert.ok(journey.careEpisodeId.startsWith("ce-"));
  assert.deepEqual(journey.stages, [
    "intake",
    "booking",
    "nurse_observations",
    "orchestrate",
    "clinical_review",
  ]);
  assert.ok(journey.nurseTask, "booking opens nurse observation task");
  assert.equal(journey.nurseTask!.careEpisodeId, journey.careEpisodeId);
  assert.equal(journey.nurseTask!.ehrWrite, false);

  const open = listOpenNurseObservationTasks(state);
  assert.ok(open.some((w) => w.careEpisodeId === journey.careEpisodeId));

  const worklist = buildNurseObservationWorklist(state);
  assert.ok(worklist.some((i) => i.careEpisodeId === journey.careEpisodeId && i.source === "front_desk_booking"));

  const episode = await getCareEpisode(journey.careEpisodeId, scopeKey);
  assert.ok(episode);
  assert.ok(episode!.links.length >= 3, "≥3 stage links on episode");
  assert.ok(
    episode!.tasks.some((t) => t.ownerRole === "nurse"),
    "nurse task persisted on care episode"
  );

  // Honesty: VOICE CARE ≠ VOICE
  const voiceCare = runVoiceCareEscalation({ caseId: "vc-p2", patientLabel: "Synthetic" });
  assert.equal(voiceCare.notVoiceDictation, true);
  assert.ok(voiceCare.label.includes("NOT VOICE DICTATION"));
  assert.equal(voiceCare.telephony, false);
  assert.equal(voiceCare.ehrWrite, false);

  // Honesty: directory status
  for (const a of AGENT_DIRECTORY) {
    if (a.phase === 1) assert.equal(a.status, "in_validation");
    if (a.phase === 2) {
      assert.equal(a.live, false);
      assert.equal(a.status, "in_validation");
    }
  }

  // Flag on + no patient → offer but do not run
  process.env.ENABLE_CONDUCTOR_FROM_INTAKE = "true";
  const offered = await maybeConductorFromIntake({
    actor: "p2-test",
    scopeKey,
    orchestrateAfterIntake: false,
  });
  assert.equal(offered.enabled, true);
  assert.equal(offered.available, true);
  assert.equal(offered.ran, false);
  delete process.env.ENABLE_CONDUCTOR_FROM_INTAKE;

  console.log("p2-care-episode-integration: booking→nurse→orchestrate/review + honesty — PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    if (prevConductor === undefined) delete process.env.ENABLE_CONDUCTOR_FROM_INTAKE;
    else process.env.ENABLE_CONDUCTOR_FROM_INTAKE = prevConductor;
    rmSync(tmp, { recursive: true, force: true });
  });
