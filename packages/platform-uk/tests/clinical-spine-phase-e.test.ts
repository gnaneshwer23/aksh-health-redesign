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

  // --- B2: outcomes-loop honesty — Reject must not masquerade as a real captured outcome ---
  // FR-LEARN-014: unknown outcomeKind + no link stays awaiting_outcome indefinitely — never auto-closed.
  const { event: unknownDeferred } = await recordLearningEvent(
    {
      patientId: "P001",
      agentLabel: "ORACLE",
      predictionId: "pred-phase-e-fr-learn-014",
      decision: "edit",
      decisionActor: "phase-e-gp@aksh.health",
      outcomeKind: "unknown"
    },
    { scopeKey, shieldDualWrite: false }
  );
  const stillAwaiting = buildCareActionsFromEvents([unknownDeferred]);
  assert.equal(stillAwaiting[0]?.loopStage, "awaiting_outcome", "FR-LEARN-014: unknown outcomeKind must stay awaiting_outcome, never auto-close");

  // Reject: outcomeKind stays "care_action_deferred" (correct — nothing to follow up), but the loop
  // stage must be a distinct "no_action_required", never indistinguishable from a real outcome.
  const { event: rejectedEvent } = await recordLearningEvent(
    {
      patientId: "P001",
      caseId: "case-phase-e",
      queueItemId: "qi-phase-e-reject-1",
      agentLabel: "GUARDIAN",
      predictionId: "pred-phase-e-guardian-reject-1",
      predictionSummary: "Phase E interaction draft (rejected)",
      decision: "reject",
      decisionActor: "phase-e-gp@aksh.health",
      decisionNotes: "Rejected by reviewer",
      outcomeKind: "care_action_deferred"
    },
    { scopeKey, shieldDualWrite: false }
  );
  assert.equal(rejectedEvent.outcomeKind, "care_action_deferred");
  const rejectedClassified = buildCareActionsFromEvents([rejectedEvent]);
  assert.equal(
    rejectedClassified[0]?.loopStage,
    "no_action_required",
    "Reject must classify as no_action_required, not immediate_outcome (B2 honesty fix)"
  );
  assert.notEqual(rejectedClassified[0]?.loopStage, "immediate_outcome");

  // A genuinely-reported immediate outcome (not via Reject) still classifies as immediate_outcome.
  const { event: genuineImmediate } = await recordLearningEvent(
    {
      patientId: "P001",
      agentLabel: "GUARDIAN",
      predictionId: "pred-phase-e-guardian-immediate-1",
      decision: "accept",
      decisionActor: "phase-e-gp@aksh.health",
      outcomeKind: "adverse_event_none"
    },
    { scopeKey, shieldDualWrite: false }
  );
  const immediateClassified = buildCareActionsFromEvents([genuineImmediate]);
  assert.equal(immediateClassified[0]?.loopStage, "immediate_outcome");

  // --- Two distinct ratios: dispositionCompleteRatio (workload) vs realOutcomeCaptureRatio (honesty) ---
  const ratioScope = `phase_e_ratio_${Date.now()}`;
  await recordLearningEvent(
    {
      patientId: "P900",
      agentLabel: "GUARDIAN",
      predictionId: "pred-ratio-awaiting",
      decision: "edit",
      decisionActor: "ratio-gp@aksh.health",
      outcomeKind: "unknown"
    },
    { scopeKey: ratioScope, shieldDualWrite: false }
  );
  const { event: ratioRejected } = await recordLearningEvent(
    {
      patientId: "P900",
      agentLabel: "GUARDIAN",
      predictionId: "pred-ratio-rejected",
      decision: "reject",
      decisionActor: "ratio-gp@aksh.health",
      outcomeKind: "care_action_deferred"
    },
    { scopeKey: ratioScope, shieldDualWrite: false }
  );
  const { event: ratioAccepted } = await recordLearningEvent(
    {
      patientId: "P900",
      agentLabel: "GUARDIAN",
      predictionId: "pred-ratio-accepted",
      decision: "accept",
      decisionActor: "ratio-gp@aksh.health",
      outcomeKind: "follow_up_scheduled"
    },
    { scopeKey: ratioScope, shieldDualWrite: false }
  );
  await captureSpineOutcome(
    {
      sourceEventId: ratioAccepted.id,
      outcomeKind: "care_action_completed",
      outcomeSummary: "Follow-up completed (ratio test)",
      reporterRole: "clinician"
    },
    { scopeKey: ratioScope, actor: "ratio-gp@aksh.health" }
  );
  const ratioStatus = await buildOutcomesLoopStatus({ scopeKey: ratioScope });
  // 4 care actions total: 1 awaiting, 1 no_action_required (reject), 1 accepted+awaiting-until-linked
  // now linked, plus the accept's own row is a source (not counted again). careActionCount counts
  // source rows only (link rows excluded), so: awaiting-edit, rejected, accepted(now linked) = 3.
  assert.equal(ratioStatus.careActionCount, 3);
  assert.equal(ratioStatus.awaitingOutcomeCount, 1);
  assert.equal(ratioStatus.noActionRequiredCount, 1);
  assert.equal(ratioStatus.outcomeLinkedCount, 1);
  // dispositionCompleteRatio: 2 of 3 have a disposition closure (reject + linked accept) = 0.667
  assert.equal(ratioStatus.dispositionCompleteRatio, Math.round((2 / 3) * 1000) / 1000);
  // realOutcomeCaptureRatio: only the linked accept is a real captured outcome = 1/3 (excludes reject)
  assert.equal(ratioStatus.realOutcomeCaptureRatio, Math.round((1 / 3) * 1000) / 1000);
  assert.ok(
    ratioStatus.realOutcomeCaptureRatio < ratioStatus.dispositionCompleteRatio,
    "realOutcomeCaptureRatio must never exceed dispositionCompleteRatio when a Reject is present"
  );
  assert.ok(ratioRejected.id, "sanity: rejected event recorded");

  for (const name of [`learning-events.${ratioScope}.json`, `governed-evaluations.${ratioScope}.json`]) {
    const file = path.join(dataDir, name);
    if (fs.existsSync(file)) await unlink(file).catch(() => undefined);
  }

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
  // B2: two distinct, separately-labeled ratios — no blended loopCompleteRatio left unlabeled.
  assert.ok(captureUi.includes("dispositionCompleteRatio"));
  assert.ok(captureUi.includes("realOutcomeCaptureRatio"));
  assert.ok(captureUi.includes("Disposition complete"));
  assert.ok(captureUi.includes("Real outcome captured"));
  assert.equal(/\bloopCompleteRatio\b/.test(captureUi), false);

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
  assert.ok(spine.includes("dispositionCompleteRatio"));
  assert.ok(spine.includes("realOutcomeCaptureRatio"));
  assert.equal(/\bloopCompleteRatio\b/.test(spine), false);

  const outcomesLoopLib = fs.readFileSync(
    path.join(process.cwd(), "lib/clinical-spine/outcomes-loop.ts"),
    "utf8"
  );
  assert.equal(/\bloopCompleteRatio\b/.test(outcomesLoopLib), false);
  assert.ok(outcomesLoopLib.includes("no_action_required"));

  const learningDoc = fs.readFileSync(
    path.join(process.cwd(), "docs/CONTINUOUS_LEARNING.md"),
    "utf8"
  );
  assert.ok(learningDoc.includes("dispositionCompleteRatio"));
  assert.ok(learningDoc.includes("realOutcomeCaptureRatio"));

  const checklist = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_E.md"),
    "utf8"
  );
  assert.ok(checklist.includes("liveEmis: false"));
  assert.ok(checklist.includes("autoRetrain: false"));
  assert.ok(checklist.includes("physiologicalTwin: false"));
  assert.ok(checklist.includes("Phase F"));
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
