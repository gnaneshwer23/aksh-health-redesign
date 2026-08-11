/**
 * C5 (docs/PHASED_BUILD_PLAN_C.md, minimum bar — implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-1): Diabetes MVP loop slice.
 * Proves Accepting a diabetes coaching draft produces a real learning_events
 * row with a diabetes-specific agentLabel, and that the existing Learning
 * domain (buildOutcomesLoopStatus) buckets it correctly — no double
 * counting, no new loopStage introduced.
 */

import assert from "node:assert/strict";

import { buildDiabetesRiskContribution, recordDiabetesCoachingAccept } from "../lib/disease-modules/diabetes";
import { buildOutcomesLoopStatus } from "../lib/clinical-spine/outcomes-loop";
import { listLearningEvents } from "../lib/repositories/learning-event-repository";

const DIABETES_AGENT_LABELS = new Set(["NUTRITION_DIABETES", "EXERCISE_DIABETES", "BEHAVIOUR_DIABETES"]);

async function testAcceptProducesDiabetesLabelledLearningEvent() {
  const scopeKey = `c5_diabetes_test_${Date.now()}`;
  const patientId = "P002"; // diabetes-flagged demo patient, reused from B3/clinical-spine-diabetes.test.ts

  const { coachingDrafts } = buildDiabetesRiskContribution({ patientId, patientLabel: "Test Patient" });
  assert.ok(coachingDrafts.length >= 1, "diabetes composite must produce at least one coaching draft to accept");

  const nutritionDraft = coachingDrafts.find((d) => d.moduleId === "NUTRITION");
  assert.ok(nutritionDraft, "a NUTRITION coaching draft must be present for this fixture");

  const { event, source, shieldAuditWriteFailed } = await recordDiabetesCoachingAccept(
    { draft: nutritionDraft!, decisionActor: "c5-test@aksh.health" },
    { scopeKey }
  );

  assert.equal(event.agentLabel, "NUTRITION_DIABETES", "learning event agentLabel must be the draft's diabetes-specific coaching agent id");
  assert.ok(DIABETES_AGENT_LABELS.has(event.agentLabel), "agentLabel must be a diabetes-labelled agent id");
  assert.equal(event.patientId, patientId);
  assert.equal(event.decision, "accept");
  assert.equal(event.outcomeKind, "follow_up_scheduled");
  assert.equal(event.ehrWrite, false);
  assert.equal(event.autoRetrainTriggered, false);
  assert.equal(event.modelUpdated, false);
  assert.equal(event.hitlRequired, true);
  assert.equal(shieldAuditWriteFailed, typeof shieldAuditWriteFailed === "boolean" ? shieldAuditWriteFailed : false, "shieldAuditWriteFailed must be an honest boolean, never silently swallowed");
  assert.ok(["postgres", "file"].includes(source));

  const { events } = await listLearningEvents({ scopeKey, limit: 10 });
  assert.ok(events.some((e) => e.id === event.id), "the accepted diabetes coaching learning event must be durably listable in this scope");

  console.log(`Diabetes learning loop: Accept -> learning_events row with agentLabel=${event.agentLabel} (source=${source}).`);
}

async function testOutcomesLoopBucketsWithoutDoubleCountingOrNewStage() {
  const scopeKey = `c5_diabetes_test_${Date.now()}_loop`;
  const patientId = "P002";

  const { coachingDrafts } = buildDiabetesRiskContribution({ patientId, patientLabel: "Test Patient" });
  const exerciseDraft = coachingDrafts.find((d) => d.moduleId === "EXERCISE");
  assert.ok(exerciseDraft, "an EXERCISE coaching draft must be present for this fixture");

  const before = await buildOutcomesLoopStatus({ scopeKey, patientId });
  assert.equal(before.careActionCount, 0, "fresh scope must start with zero care actions");

  const { event } = await recordDiabetesCoachingAccept(
    { draft: exerciseDraft!, decisionActor: "c5-test@aksh.health" },
    { scopeKey }
  );

  const after = await buildOutcomesLoopStatus({ scopeKey, patientId });
  assert.equal(after.careActionCount, 1, "exactly one new care action must appear — no double counting");
  assert.equal(after.awaitingOutcomeCount, 1, "an accepted diabetes coaching draft starts in awaiting_outcome, same as every other agent's Accept");
  assert.equal(after.outcomeLinkedCount, 0);
  assert.equal(after.noActionRequiredCount, 0);

  const action = after.openActions.find((a) => a.learningEventId === event.id);
  assert.ok(action, "the new care action must appear in openActions (awaiting_outcome)");
  assert.equal(action?.agentLabel, "EXERCISE_DIABETES");
  assert.equal(action?.loopStage, "awaiting_outcome", "no new loopStage value is introduced by this phase");

  // Second accept (same patient, different module) must be additive, not double-counted.
  const behaviourDraft = coachingDrafts.find((d) => d.moduleId === "BEHAVIOUR");
  assert.ok(behaviourDraft);
  await recordDiabetesCoachingAccept({ draft: behaviourDraft!, decisionActor: "c5-test@aksh.health" }, { scopeKey });

  const afterSecond = await buildOutcomesLoopStatus({ scopeKey, patientId });
  assert.equal(afterSecond.careActionCount, 2, "a second accepted diabetes coaching draft adds exactly one more care action");

  console.log("Diabetes learning loop: buildOutcomesLoopStatus buckets diabetes coaching accepts additively — no double-counting, no new loopStage.");
}

async function main() {
  await testAcceptProducesDiabetesLabelledLearningEvent();
  await testOutcomesLoopBucketsWithoutDoubleCountingOrNewStage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
