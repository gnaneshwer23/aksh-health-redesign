/**
 * Phase E clinical spine — outcomes / learning closed loop.
 * Invariants: ehrWrite:false · autoRetrain:false · liveEmis:false · physiologicalTwin:false · modelUpdated:false.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";

import {
  SPINE_OUTCOMES_HONESTY,
  assertGovernedEvaluationAllowed,
  buildCareActionsFromEvents,
  buildOutcomesLoopStatus,
  captureSpineOutcome,
  listSpineCareActions,
  submitGovernedEvaluation
} from "../lib/clinical-spine/outcomes-loop";
import { recordLearningEvent } from "../lib/repositories/learning-event-repository";

const scopeKey = `phase_e_${Date.now()}`;
const dataDir = path.join(process.cwd(), "data");

async function run() {
  assert.equal(SPINE_OUTCOMES_HONESTY.ehrWrite, false);
  assert.equal(SPINE_OUTCOMES_HONESTY.liveEmis, false);
  assert.equal(SPINE_OUTCOMES_HONESTY.physiologicalTwin, false);
  assert.equal(SPINE_OUTCOMES_HONESTY.autoRetrain, false);
  assert.equal(SPINE_OUTCOMES_HONESTY.modelUpdated, false);
  assert.equal(SPINE_OUTCOMES_HONESTY.hitlRequired, true);

  // --- Care action (HITL) on shared learning store ---
  const { event: careAction } = await recordLearningEvent(
    {
      patientId: "P001",
      caseId: "case-phase-e",
      queueItemId: "qi-phase-e-1",
      agentLabel: "GUARDIAN",
      predictionId: "pred-phase-e-guardian-1",
      predictionSummary: "Phase E interaction draft",
      decision: "accept",
      decisionActor: "phase-e-gp@aksh.health",
      decisionNotes: "Accepted for follow-up (HITL)",
      outcomeKind: "follow_up_scheduled",
      outcomeSummary: "Outcome pending 30-day review"
    },
    { scopeKey, shieldDualWrite: false }
  );
  assert.equal(careAction.autoRetrainTriggered, false);
  assert.equal(careAction.linksToEventId ?? null, null);

  const actions = await listSpineCareActions({
    scopeKey,
    patientId: "P001",
    limit: 50
  });
  assert.ok(actions.actions.some((a) => a.learningEventId === careAction.id));
  const open = actions.actions.find((a) => a.learningEventId === careAction.id);
  assert.ok(open);
  assert.equal(open.loopStage, "awaiting_outcome");
  assert.equal(open.hasEventualOutcome, false);

  // --- Capture eventual outcome (clinician) ---
  const captured = await captureSpineOutcome(
    {
      sourceEventId: careAction.id,
      outcomeKind: "care_action_completed",
      outcomeSummary: "30-day med review completed (phase-e)",
      reporterRole: "clinician"
    },
    { scopeKey, actor: "phase-e-gp@aksh.health" }
  );
  assert.equal(captured.linked, true);
  assert.equal(captured.autoRetrain, false);
  assert.equal(captured.modelUpdated, false);
  assert.equal(captured.ehrWrite, false);
  assert.equal(captured.liveEmis, false);
  assert.equal(captured.physiologicalTwin, false);
  assert.equal(captured.sourceEventId, careAction.id);

  const after = await listSpineCareActions({ scopeKey, patientId: "P001" });
  const closed = after.actions.find((a) => a.learningEventId === careAction.id);
  assert.ok(closed);
  assert.equal(closed.loopStage, "outcome_linked");
  assert.equal(closed.hasEventualOutcome, true);

  // --- Patient-reported outcome on a second care action ---
  const { event: care2 } = await recordLearningEvent(
    {
      patientId: "P002",
      agentLabel: "ORACLE",
      predictionId: "pred-phase-e-oracle-1",
      decision: "accept",
      decisionActor: "phase-e-gp@aksh.health",
      outcomeKind: "unknown"
    },
    { scopeKey, shieldDualWrite: false }
  );
  const patientOutcome = await captureSpineOutcome(
    {
      sourceEventId: care2.id,
      outcomeKind: "adverse_event_none",
      outcomeSummary: "Feeling stable (patient-reported)",
      reporterRole: "patient"
    },
    { scopeKey, actor: "patient-phase-e@aksh.health" }
  );
  assert.equal(patientOutcome.reporterRole, "patient");
  assert.equal(patientOutcome.autoRetrain, false);

  // --- Loop status ---
  const status = await buildOutcomesLoopStatus({ scopeKey, patientId: "P001" });
  assert.equal(status.autoRetrain, false);
  assert.equal(status.modelUpdated, false);
  assert.ok(status.stages.includes("care_action"));
  assert.ok(status.stages.includes("eventual_outcome"));
  assert.ok(status.stages.includes("governed_evaluation"));
  assert.ok(status.outcomeLinkedCount >= 1);
  assert.ok(status.careActionCount >= 1);

  // --- Governed evaluation: block propose without gates ---
  const blocked = assertGovernedEvaluationAllowed({
    proposedAction: "propose_model_update",
    gates: [
      { gateId: "G-ML-1", signed: true },
      { gateId: "G-ML-2", signed: false },
      { gateId: "G-ML-3", signed: false }
    ],
    rationale: "Want to bump model"
  });
  assert.equal(blocked.ok, false);

  const rejected = await submitGovernedEvaluation(
    {
      learningEventIdsReviewed: [careAction.id],
      gates: [
        { gateId: "G-ML-1", signed: false },
        { gateId: "G-ML-2", signed: false },
        { gateId: "G-ML-3", signed: false }
      ],
      proposedAction: "propose_model_update",
      rationale: "Unsafe propose without gates",
      actor: "phase-e-admin@aksh.health"
    },
    { scopeKey }
  );
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.autoRetrain, false);
  assert.equal(rejected.modelUpdated, false);
  assert.ok(rejected.blockedReason?.includes("G-ML"));

  // --- Governed evaluation: no_change always ok ---
  const noChange = await submitGovernedEvaluation(
    {
      learningEventIdsReviewed: [careAction.id, care2.id],
      gates: [],
      proposedAction: "no_change",
      rationale: "Outcomes reviewed; keep current model",
      actor: "phase-e-admin@aksh.health"
    },
    { scopeKey }
  );
  assert.equal(noChange.accepted, true);
  assert.equal(noChange.autoRetrain, false);
  assert.equal(noChange.modelUpdated, false);
  assert.equal(noChange.evaluation?.autoRetrainTriggered, false);

  // --- Signed gates allow propose_model_update recording (still no auto-retrain) ---
  const approved = await submitGovernedEvaluation(
    {
      learningEventIdsReviewed: [careAction.id],
      gates: [
        { gateId: "G-ML-1", signed: true, signer: "eng-lead" },
        { gateId: "G-ML-2", signed: true, signer: "cso-rehearsal" },
        { gateId: "G-ML-3", signed: true, signer: "release-auth" }
      ],
      proposedAction: "propose_model_update",
      rationale: "Eval harness green; manual release only",
      actor: "phase-e-admin@aksh.health"
    },
    { scopeKey }
  );
  assert.equal(approved.accepted, true);
  assert.equal(approved.autoRetrain, false);
  assert.equal(approved.modelUpdated, false);
  assert.equal(approved.evaluation?.status, "approved_for_manual_release");
  assert.equal(approved.evaluation?.autoRetrainTriggered, false);
  assert.equal(approved.evaluation?.modelUpdated, false);

  // classify helper
  const classified = buildCareActionsFromEvents([careAction]);
  assert.equal(classified[0]?.loopStage, "awaiting_outcome");

  // --- UI / docs / routes ---
  const outcomesRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/outcomes/route.ts"),
    "utf8"
  );
  assert.ok(outcomesRoute.includes("captureSpineOutcome"));
  assert.ok(outcomesRoute.includes("autoRetrain"));
  assert.equal(/export async function PUT/.test(outcomesRoute), false);

  const evalRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/governed-evaluation/route.ts"),
    "utf8"
  );
  assert.ok(evalRoute.includes("submitGovernedEvaluation"));
  assert.ok(evalRoute.includes("propose_model_update"));

  const captureUi = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/dashboard/precision-health/SpineOutcomesCapturePanel.tsx"
    ),
    "utf8"
  );
  assert.ok(captureUi.includes("/api/clinical-spine/outcomes"));
  assert.ok(captureUi.includes("autoRetrain:false"));

  const evalUi = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/dashboard/precision-health/GovernedEvaluationPanel.tsx"
    ),
    "utf8"
  );
  assert.ok(evalUi.includes("G-ML-1"));
  assert.ok(evalUi.includes("propose_model_update"));
  assert.ok(evalUi.includes("autoRetrain"));

  const gpPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/gp/patients/[id]/page.tsx"),
    "utf8"
  );
  assert.ok(gpPage.includes("SpineOutcomesCapturePanel"));

  const companion = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/PatientCompanion.tsx"),
    "utf8"
  );
  assert.ok(companion.includes("SpineOutcomesCapturePanel"));
  assert.ok(companion.includes('mode="patient"'));

  const learningPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/admin/learning/page.tsx"),
    "utf8"
  );
  assert.ok(learningPage.includes("GovernedEvaluationPanel"));

  const spine = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spine.includes("spine-phase-e-outcomes"));
  assert.ok(spine.includes("/api/clinical-spine/outcomes"));

  const checklist = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_E.md"),
    "utf8"
  );
  assert.ok(checklist.includes("liveEmis: false"));
  assert.ok(checklist.includes("autoRetrain: false"));
  assert.ok(checklist.includes("physiologicalTwin: false"));
  assert.ok(checklist.includes("Phase F next"));
  assert.ok(checklist.includes("never auto-retrain") || checklist.includes("Never autonomous"));

  // cleanup scoped stores
  for (const name of [
    `learning-events.${scopeKey}.json`,
    `governed-evaluations.${scopeKey}.json`
  ]) {
    const file = path.join(dataDir, name);
    if (fs.existsSync(file)) await unlink(file).catch(() => undefined);
  }

  console.log(
    `Phase E clinical spine checks passed (care=${careAction.id}; outcome=${captured.outcomeEventId}; eval=${approved.evaluation?.id}).`
  );
}

void run();
