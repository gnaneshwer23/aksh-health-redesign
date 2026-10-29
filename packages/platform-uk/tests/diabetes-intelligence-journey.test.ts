/**
 * Connected Diabetes Intelligence — synthetic vertical slice.
 * File-store path (no Postgres required). ehrWrite must stay false.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Isolate file stores under a temp cwd so we do not pollute package data/.
// Force file fallback even if the developer shell has DATABASE_URL (local-dev Neon).
const tmp = mkdtempSync(path.join(tmpdir(), "diab-journey-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  // Dynamic import after chdir so repository resolves data/ under tmp.
  const {
    buildDiabetesJourney,
    seedSyntheticJourney,
    draftJourneyCarePlan,
    decideJourneyCarePlan,
    advanceFollowUp,
  } = await import("../lib/diabetes-intelligence/journey");
  const { assessGlucoseMissing, MIN_GLUCOSE_FOR_PLAN } = await import(
    "../lib/diabetes-intelligence/missing-data"
  );

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P001";

  // Missing-data helpers
  const sparse = assessGlucoseMissing([{ recordedAt: "2026-01-01T00:00:00.000Z", glucoseMgDl: 120 }]);
  assert.ok(sparse.missingData.some((m) => m.code === "glucose_sparse"));
  assert.ok(sparse.dataCompleteness < 1);
  assert.equal(MIN_GLUCOSE_FOR_PLAN, 3);

  let journey = await buildDiabetesJourney(patientId, { scopeKey });
  assert.equal(journey.synthetic, true);
  assert.equal(journey.ehrWrite, false);
  assert.equal(journey.hitlRequired, true);
  assert.ok(journey.history.conditions.length > 0, "P001 has conditions in mock cohort");

  journey = await seedSyntheticJourney(patientId, { scopeKey, actor: "test@aksh.health" });
  assert.ok(journey.glucose.observations.length >= 4, "seed loads glucose series");
  assert.ok(journey.glucose.dataCompleteness >= 1, "≥3 readings → completeness 1");
  assert.ok(journey.timeline.some((e) => e.kind === "glucose"));

  journey = await draftJourneyCarePlan(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const draft = journey.carePlans.find((p) => p.status === "DRAFT");
  assert.ok(draft, "care plan draft created");
  assert.equal(draft.ehrWrite, false);
  assert.equal(draft.hitlRequired, true);
  assert.ok(journey.timeline.some((e) => e.kind === "care_plan_draft"));

  // Reject without reason must fail
  await assert.rejects(
    () =>
      decideJourneyCarePlan(
        {
          patientId,
          planId: draft.id,
          action: "reject",
          actor: "clinician@aksh.health",
        },
        { scopeKey }
      ),
    /reason/i
  );

  // Accept → approved + follow-up
  journey = await decideJourneyCarePlan(
    {
      patientId,
      planId: draft.id,
      action: "accept",
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  const approved = journey.carePlans.find((p) => p.id === draft.id);
  assert.equal(approved?.status, "APPROVED");
  assert.ok(journey.followUps.length >= 1, "follow-up created on accept");
  assert.equal(journey.followUps[0].status, "open");
  assert.ok(journey.followUps[0].owner);
  assert.ok(journey.followUps[0].dueAt);
  assert.ok(journey.timeline.some((e) => e.kind === "care_plan_decision"));
  assert.ok(journey.timeline.some((e) => e.kind === "follow_up"));

  const taskId = journey.followUps[0].id;
  journey = await advanceFollowUp(
    { patientId, taskId, action: "acknowledge" },
    { scopeKey }
  );
  assert.equal(journey.followUps.find((t) => t.id === taskId)?.status, "acknowledged");

  journey = await advanceFollowUp(
    { patientId, taskId, action: "complete", note: "Review done (synthetic)" },
    { scopeKey }
  );
  const done = journey.followUps.find((t) => t.id === taskId);
  assert.equal(done?.status, "completed");
  assert.ok(done?.closedAt);
  assert.equal(journey.ehrWrite, false);

  // Second draft + edit path
  journey = await draftJourneyCarePlan(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const draft2 = journey.carePlans.find((p) => p.status === "DRAFT");
  assert.ok(draft2);
  journey = await decideJourneyCarePlan(
    {
      patientId,
      planId: draft2.id,
      action: "edit",
      actor: "clinician@aksh.health",
      editedSections: draft2.sections.map((s) => ({
        ...s,
        items: [...s.items, "Edited item"],
      })),
    },
    { scopeKey }
  );
  assert.equal(journey.carePlans.find((p) => p.id === draft2.id)?.status, "APPROVED");

  console.log("diabetes-intelligence-journey: vertical slice PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
    if (prevUsePg !== undefined) process.env.USE_POSTGRES = prevUsePg;
    else delete process.env.USE_POSTGRES;
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
