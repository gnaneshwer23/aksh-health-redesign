import assert from "node:assert/strict";

import { runHitlStagingSimWritebackChain } from "../lib/clinical-proof/hitl-writeback-chain";
import { listSimulatedEhrWrites, resetEhrWritebackSimForTests } from "../lib/clinical-proof/ehr-writeback-sim";
import { buildOutcomesLoopStatus, captureSpineOutcome, listSpineCareActions } from "../lib/clinical-spine/outcomes-loop";
import {
  recordSpineQueueDecisions,
  resolveSpinePatientId,
} from "../lib/clinical-spine/queue-decision";
import { buildDiabetesRiskContribution } from "../lib/disease-modules/diabetes";
import { recordDiabetesCoachingAccept } from "../lib/disease-modules/diabetes/learning";
import {
  assertGoldenHitlScenario,
  findAdherencePharmacyEvents,
} from "../lib/e2e/hitl-intervention-assertions";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import { generateE2EDataset } from "../lib/e2e/generator";
import {
  diabetesCoachingDraftToInterventionSummary,
  coachingDraftToInterventionSummary,
} from "../lib/intervention/adapters";
import { describePendingInterventionDrafts } from "../lib/intervention/list-pending";
import { buildNutritionCoachingDraft } from "../lib/precision-health/coaching";
import { findLearningEventById, listLearningEvents } from "../lib/repositories/learning-event-repository";
import { reviewCases as seedCases } from "../lib/mock-data";
import { updateQueueItemDecision } from "../lib/workflow/review-queue";
import type { ReviewCase } from "../lib/types";

const SCENARIO_0005 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0005")!;
const SCENARIO_0010 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0010")!;
const SCENARIO_0015 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0015")!;
const SCENARIO_0021 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0021")!;

function minimalPatelCase(): ReviewCase {
  const seeded =
    seedCases.find((c) => c.id === "case-patel-demo") ??
    seedCases.find((c) => c.scenarioId === "PATEL-DEMO") ??
    seedCases[0];
  if (!seeded) throw new Error("No seed review cases available");

  const soap =
    seeded.reviewQueueItems?.find((i) => i.itemType === "soap_note") ??
    seeded.reviewQueueItems?.[0];

  return {
    ...seeded,
    id: "case-patel-demo",
    scenarioId: "PATEL-DEMO",
    patientLabel: "Mr James Patel — T2D + DVT (P002)",
    reviewQueueItems: soap
      ? [
          {
            ...soap,
            id: "q-soap-e2e",
            status: "DRAFT",
            decidedBy: undefined,
            decidedAt: undefined,
            rejectionReason: undefined,
            content: soap.content ?? soap.summary,
          },
        ]
      : [
          {
            id: "q-soap-e2e",
            agentId: "SYNTHESIS",
            itemType: "soap_note",
            status: "DRAFT",
            title: "SOAP draft",
            summary: "Synthetic HITL rehearsal draft",
          },
        ],
  };
}

async function run() {
  process.env.ENABLE_DIABETES_MODULE = "true";
  const dataset = generateE2EDataset({ seed: 20260812 });
  const cohortE = dataset.patients.find((p) => p.cohortId === "E");
  const cohortH = dataset.patients.find((p) => p.cohortId === "H");
  assert.ok(cohortE && cohortH);

  // --- AKSH-E2E-0005: adherence engagement / RECOMMEND ---
  const adherencePharm = findAdherencePharmacyEvents(dataset.pharmacyEvents, cohortE.id);
  assert.ok(adherencePharm.length >= 1, "cohort E must have adherence_issue pharmacy events");

  const diabetes = buildDiabetesRiskContribution({
    patientId: "P002",
    patientLabel: "Mr James Patel",
  });
  const diabetesDrafts = diabetes.coachingDrafts.map(diabetesCoachingDraftToInterventionSummary);
  const nutrition = buildNutritionCoachingDraft({
    patientId: "P002",
    patientLabel: "Mr James Patel",
  });
  const pending = describePendingInterventionDrafts("P002", [
    ...diabetesDrafts,
    coachingDraftToInterventionSummary(nutrition),
  ]);

  const result0005 = assertGoldenHitlScenario(SCENARIO_0005, {
    generatorPatient: cohortE,
    pharmacyEvents: dataset.pharmacyEvents,
    pendingInterventions: pending,
  });
  assert.equal(result0005.ok, true, result0005.errors.join("; "));

  // --- AKSH-E2E-0010: clinician Reject → learning disposition, not clinical outcome ---
  resetEhrWritebackSimForTests();
  const rejectScope = `e2e_hitl_reject_${Date.now()}`;
  const existing = minimalPatelCase();
  assert.equal(resolveSpinePatientId(existing), "P002");

  const rejected = updateQueueItemDecision(existing, "q-soap-e2e", "REJECTED", {
    decidedBy: "Dr E2E Hitl",
    rejectionReason: "Clinically inappropriate for this visit — defer recommendation",
  });
  const rejectSpine = await recordSpineQueueDecisions({
    existing,
    next: rejected,
    scopeKey: rejectScope,
    actor: "Dr E2E Hitl",
  });
  assert.equal(rejectSpine.ehrWrite, false);
  assert.equal(rejectSpine.autoRetrain, false);
  assert.equal(rejectSpine.learningEventIds.length, 1);

  const rejectEventLookup = await findLearningEventById(rejectSpine.learningEventIds[0]!, {
    scopeKey: rejectScope,
  });
  assert.ok(rejectEventLookup.event);
  const rejectLoop = await buildOutcomesLoopStatus({ scopeKey: rejectScope, patientId: "P002" });
  const { actions: rejectActions } = await listSpineCareActions({
    scopeKey: rejectScope,
    patientId: "P002",
  });
  const rejectAction = rejectActions.find((a) => a.learningEventId === rejectEventLookup.event!.id);
  assert.equal(rejectAction?.loopStage, "no_action_required");
  assert.equal(rejectLoop.noActionRequiredCount, 1);

  const chain = runHitlStagingSimWritebackChain({
    caseId: "e2e-hitl-reject-chain",
    clinicianId: "gp-e2e-hitl",
    clinicianName: "Dr E2E Hitl",
  });
  assert.equal(chain.reject.staged, false);
  assert.equal(chain.reject.simWritesBefore, chain.reject.simWritesAfter);

  const result0010 = assertGoldenHitlScenario(SCENARIO_0010, {
    event: rejectEventLookup.event,
    careAction: rejectAction,
    loop: rejectLoop,
    rejectStaging: {
      simWritesBefore: chain.reject.simWritesBefore,
      simWritesAfter: chain.reject.simWritesAfter,
      staged: chain.reject.staged,
    },
  });
  assert.equal(result0010.ok, true, result0010.errors.join("; "));

  // --- AKSH-E2E-0015: Accept → awaiting outcome → linked improvement ---
  const acceptScope = `e2e_hitl_accept_${Date.now()}`;
  const acceptExisting = minimalPatelCase();
  const accepted = updateQueueItemDecision(acceptExisting, "q-soap-e2e", "ACCEPTED", {
    decidedBy: "Dr E2E Hitl",
  });
  const acceptSpine = await recordSpineQueueDecisions({
    existing: acceptExisting,
    next: accepted,
    scopeKey: acceptScope,
    actor: "Dr E2E Hitl",
    offerHealthPlan: true,
  });
  assert.ok(acceptSpine.healthPlanId);
  assert.equal(acceptSpine.ehrWrite, false);

  const acceptEventLookup = await findLearningEventById(acceptSpine.learningEventIds[0]!, {
    scopeKey: acceptScope,
  });
  assert.ok(acceptEventLookup.event);

  const beforeOutcome = await buildOutcomesLoopStatus({
    scopeKey: acceptScope,
    patientId: "P002",
  });
  const awaiting = beforeOutcome.openActions.find(
    (a) => a.learningEventId === acceptEventLookup.event!.id
  );
  assert.equal(awaiting?.loopStage, "awaiting_outcome");

  const captured = await captureSpineOutcome(
    {
      sourceEventId: acceptEventLookup.event!.id,
      outcomeKind: "care_action_completed",
      outcomeSummary: "Follow-up HbA1c improved after HITL-accepted care plan (synthetic).",
      outcomeMetric: { name: "hba1c", value: 7.0, unit: "%" },
      reporterRole: "clinician",
      healthPlanId: acceptSpine.healthPlanId ?? undefined,
    },
    { scopeKey: acceptScope, actor: "Dr E2E Hitl" }
  );
  assert.equal(captured.linked, true);
  assert.equal(captured.ehrWrite, false);
  assert.equal(captured.autoRetrain, false);

  const outcomeEventLookup = await findLearningEventById(captured.outcomeEventId, {
    scopeKey: acceptScope,
  });
  assert.ok(outcomeEventLookup.event);

  const afterOutcome = await buildOutcomesLoopStatus({
    scopeKey: acceptScope,
    patientId: "P002",
  });
  const { actions: afterActions } = await listSpineCareActions({
    scopeKey: acceptScope,
    patientId: "P002",
  });
  const linked = afterActions.find((a) => a.learningEventId === acceptEventLookup.event!.id);
  assert.equal(linked?.loopStage, "outcome_linked");
  assert.equal(afterOutcome.outcomeLinkedCount, 1);

  // Also prove diabetes coaching Accept path produces honest learning (intervention domain)
  const coaching = buildDiabetesRiskContribution({
    patientId: "P002",
    patientLabel: "Mr James Patel",
  });
  const nutritionDraft = coaching.coachingDrafts.find((d) => d.moduleId === "NUTRITION");
  assert.ok(nutritionDraft);
  const { event: diabetesAccept } = await recordDiabetesCoachingAccept(
    { draft: nutritionDraft!, decisionActor: "Dr E2E Hitl" },
    { scopeKey: acceptScope }
  );
  assert.equal(diabetesAccept.ehrWrite, false);
  assert.equal(diabetesAccept.decision, "accept");

  const listed = await listLearningEvents({ scopeKey: acceptScope, limit: 20 });
  assert.ok(listed.events.some((e) => e.id === acceptEventLookup.event!.id));
  assert.ok(listed.events.some((e) => e.id === diabetesAccept.id));

  const result0015 = assertGoldenHitlScenario(SCENARIO_0015, {
    acceptEvent: acceptEventLookup.event,
    acceptCareAction: awaiting,
    outcomeEvent: outcomeEventLookup.event,
    outcomeCareAction: linked,
    healthPlanId: acceptSpine.healthPlanId,
    generatorImproving: cohortH,
  });
  assert.equal(result0015.ok, true, result0015.errors.join("; "));

  // --- AKSH-E2E-0021: Clinician Modify/edit — DRAFT stays DRAFT, learning=edit, no health plan ---
  const editScope = `e2e_hitl_edit_${Date.now()}`;
  const editExisting = minimalPatelCase();
  const originalContent =
    editExisting.reviewQueueItems?.[0]?.content ??
    editExisting.reviewQueueItems?.[0]?.summary ??
    "Synthetic HITL rehearsal draft";
  const editedContent =
    "Clinician-modified SOAP: continue metformin, add lifestyle counselling, repeat HbA1c in 3 months. Draft only.";
  const edited = updateQueueItemDecision(editExisting, "q-soap-e2e", "DRAFT", {
    decidedBy: "Dr E2E Hitl",
    content: editedContent,
  });
  const editSpine = await recordSpineQueueDecisions({
    existing: editExisting,
    next: edited,
    scopeKey: editScope,
    actor: "Dr E2E Hitl",
    offerHealthPlan: true,
  });
  assert.equal(editSpine.ehrWrite, false);
  assert.equal(editSpine.autoRetrain, false);
  assert.equal(editSpine.healthPlanId, null, "edit must not create health plan");
  assert.equal(editSpine.learningEventIds.length, 1);

  const editEventLookup = await findLearningEventById(editSpine.learningEventIds[0]!, {
    scopeKey: editScope,
  });
  assert.ok(editEventLookup.event);
  const editedItem = edited.reviewQueueItems?.find((i) => i.id === "q-soap-e2e");
  assert.equal(editedItem?.status, "DRAFT");

  const result0021 = assertGoldenHitlScenario(SCENARIO_0021, {
    event: editEventLookup.event,
    itemStatus: editedItem!.status,
    originalContent,
    editedContent: editedItem!.content ?? editedContent,
    healthPlanId: editSpine.healthPlanId,
    ehrWrite: editSpine.ehrWrite,
  });
  assert.equal(result0021.ok, true, result0021.errors.join("; "));

  assert.equal(listSimulatedEhrWrites(5).length >= 1, true);

  console.log(
    `E2E HITL/intervention passed (${SCENARIO_0005.testId} adherence+drafts; ${SCENARIO_0010.testId} reject; ${SCENARIO_0015.testId} accept→outcome; ${SCENARIO_0021.testId} edit/Modify; simWrites=${listSimulatedEhrWrites(5).length}).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
