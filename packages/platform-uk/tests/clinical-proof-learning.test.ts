import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { mkdir, readFile, unlink } from "fs/promises";

import {
  LEARNING_LOOP_INVARIANTS,
  assertNoAutoRetrain,
  buildLearningEvent,
  buildLinkedOutcomeEvent
} from "../lib/clinical-proof/learning-loop";
import {
  recordLearningEvent,
  listLearningEvents,
  linkLearningOutcome
} from "../lib/repositories/learning-event-repository";

async function run() {
  assert.ok(LEARNING_LOOP_INVARIANTS.noAutoRetrain.includes("never"));
  assert.ok(LEARNING_LOOP_INVARIANTS.hitlMandatory.includes("clinician"));

  const event = buildLearningEvent({
    agentLabel: "GUARDIAN",
    predictionId: "pred-guardian-p002-1",
    predictionSummary: "Aspirin + Apixaban interaction draft",
    decision: "accept",
    decisionActor: "Dr Proof",
    outcomeKind: "care_action_completed",
    outcomeSummary: "Clinician accepted interaction warning; meds reviewed",
    patientId: "P002",
    caseId: "case-learn-1"
  });

  assertNoAutoRetrain(event);
  assert.equal(event.autoRetrainTriggered, false);
  assert.equal(event.modelUpdated, false);
  assert.equal(event.ehrWrite, false);
  assert.equal(event.hitlRequired, true);

  assert.throws(
    () =>
      buildLearningEvent({
        agentLabel: "ORACLE",
        predictionId: "x",
        decision: "approve" as "accept",
        decisionActor: "Dr",
        outcomeKind: "unknown"
      }),
    /HITL decision required/
  );

  // File-path recorder (force file by using isolated scope; works with or without Postgres)
  const scopeKey = `learn_test_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  const { event: stored, source } = await recordLearningEvent(
    {
      agentLabel: "ORACLE",
      predictionId: "pred-oracle-p018-1",
      decision: "edit",
      decisionActor: "Dr Proof",
      decisionNotes: "Adjusted risk narrative",
      outcomeKind: "follow_up_scheduled",
      outcomeSummary: "HF/renal follow-up booked",
      patientId: "P018",
      outcomeMetric: { name: "days_to_follow_up", value: 7, unit: "days" }
    },
    { scopeKey, shieldDualWrite: false }
  );

  assert.ok(source === "postgres" || source === "file");
  assertNoAutoRetrain(stored);

  const listed = await listLearningEvents({ scopeKey, limit: 20 });
  assert.ok(listed.events.some((e) => e.id === stored.id || e.predictionId === stored.predictionId));

  // Eventual outcome link (append-only — never mutates source)
  const deferred = await recordLearningEvent(
    {
      agentLabel: "GUARDIAN",
      predictionId: "pred-guardian-deferred-1",
      decision: "accept",
      decisionActor: "Dr Proof",
      outcomeKind: "unknown",
      outcomeSummary: "Outcome pending follow-up",
      patientId: "P002"
    },
    { scopeKey, shieldDualWrite: false }
  );
  assert.equal(deferred.event.outcomeKind, "unknown");

  const linkedBuilt = buildLinkedOutcomeEvent(deferred.event, {
    outcomeKind: "care_action_completed",
    outcomeSummary: "30-day med review completed",
    decisionActor: "Dr Proof"
  });
  assert.equal(linkedBuilt.linksToEventId, deferred.event.id);
  assertNoAutoRetrain(linkedBuilt);

  const linked = await linkLearningOutcome(
    deferred.event.id,
    {
      outcomeKind: "follow_up_scheduled",
      outcomeSummary: "HF clinic booked",
      decisionActor: "Dr Proof",
      outcomeMetric: { name: "days_to_follow_up", value: 14, unit: "days" }
    },
    { scopeKey, shieldDualWrite: false }
  );
  assert.equal(linked.event.linksToEventId, deferred.event.id);
  assert.equal(linked.event.outcomeKind, "follow_up_scheduled");
  assertNoAutoRetrain(linked.event);
  assert.equal(linked.sourceEvent.outcomeKind, "unknown", "Source row must remain unchanged");

  // API contract: append-only (no PUT/DELETE/PATCH)
  const routePath = path.join(process.cwd(), "app/api/learning/events/route.ts");
  const route = fs.readFileSync(routePath, "utf8");
  assert.ok(route.includes("export async function GET"));
  assert.ok(route.includes("export async function POST"));
  assert.equal(/export async function PUT/.test(route), false);
  assert.equal(/export async function DELETE/.test(route), false);
  assert.equal(/export async function PATCH/.test(route), false);
  assert.ok(route.includes("autoRetrainTriggered: false"));
  assert.ok(route.includes("modelUpdated: false"));

  const outcomeRoutePath = path.join(
    process.cwd(),
    "app/api/learning/events/[id]/outcome/route.ts"
  );
  const outcomeRoute = fs.readFileSync(outcomeRoutePath, "utf8");
  assert.ok(outcomeRoute.includes("export async function POST"));
  assert.ok(outcomeRoute.includes("linkLearningOutcome"));
  assert.ok(outcomeRoute.includes("autoRetrainTriggered: false"));
  assert.equal(/export async function PUT/.test(outcomeRoute), false);
  assert.equal(/export async function PATCH/.test(outcomeRoute), false);

  // Repo must hard-code FALSE for retrain/update columns
  const repoPath = path.join(process.cwd(), "lib/repositories/learning-event-repository.ts");
  const repo = fs.readFileSync(repoPath, "utf8");
  assert.ok(repo.includes("FALSE, FALSE, FALSE"));
  assert.equal(/\bUPDATE\s+aksh\.learning_events\b/i.test(repo), false);
  assert.equal(/\bDELETE\s+FROM\s+aksh\.learning_events\b/i.test(repo), false);

  // Governed release SOP stub present
  const sop = fs.readFileSync(
    path.join(process.cwd(), "docs/GOVERNED_MODEL_RELEASE_SOP.md"),
    "utf8"
  );
  assert.ok(sop.includes("No auto-retrain"));
  assert.ok(sop.includes("G-ML-1"));

  // Cleanup scoped file if created
  const scopedFile = path.join(dataDir, `learning-events.${scopeKey}.json`);
  try {
    await readFile(scopedFile, "utf8");
    await unlink(scopedFile);
  } catch {
    // postgres-only path — nothing to clean
  }

  console.log(
    `Continuous-learning recorder contract passed (source=${source}; eventual outcome link ok).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
