/**
 * Milestone A5 — multi-account golden journey (audit §11.2 flow) as far as the
 * auth/API harness allows. Synthetic orgs only. File-store / in-process path —
 * not a live browser multi-role Playwright chain.
 *
 * Flow: patient → reception → nurse → GP → Guardian → lab → pharmacist →
 * care plan → patient visibility → ops.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { ClinicalContextPackage } from "../lib/context-engine/types";

const tmp = mkdtempSync(path.join(tmpdir(), "a5-golden-"));
const prevCwd = process.cwd();
const prevDb = process.env.DATABASE_URL;
const prevUse = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

type Coverage = "covered" | "partial" | "sim";

async function main() {
  process.env.ENABLE_LLM_SYNTHESIS = "false";
  process.env.ENABLE_LLM_GUARDIAN = "false";
  process.env.ENABLE_LLM_ORACLE = "false";
  process.env.ENABLE_LLM_DR_ASSIST = "false";
  process.env.ENABLE_LLM_NEXUS = "false";

  const coverage: Record<string, Coverage> = {};
  const scopeKey = `a5g-${randomUUID().slice(0, 8)}`;
  const patientId = "P002";

  const { verifiedPatientFromId, openIntakeBookingWorkItem } = await import(
    "../lib/front-desk/intake-booking-handoff"
  );
  const { createInitialState } = await import("../lib/front-desk/store");
  const { bookSlot } = await import("../lib/front-desk/calendar");
  const { handoffBookingToNurse, listOpenNurseObservationTasks } = await import(
    "../lib/front-desk/nurse-handoff"
  );
  const {
    resetCareEpisodeStoreForTests,
    createCareEpisode,
    correlateCareEpisodeStage,
    integrateNurseObservationsStage,
    integrateClinicalReviewStage,
    handoffGpToPharmacist,
    getCareEpisode,
    trackLabReferralDraftStatuses,
    applyDraftStatusTransition,
    filterPatientVisibleCarePlans,
    toPatientVisibleCarePlans,
  } = await import("../lib/care-episode");
  const { mayEnqueueAgentDraft } = await import("../lib/workflow/review-queue");
  const { enqueueDiabetesDraftsToSpineReview, queueItemsFromDiabetesDrafts } = await import(
    "../lib/clinical-spine/diabetes-draft-enqueue"
  );
  const { draftAllKindsForPatient, buildSharedPatientContext } = await import(
    "../lib/diabetes-intelligence"
  );
  const { createCarePlanRecord, decideCarePlan } = await import(
    "../lib/diabetes-intelligence/repository"
  );
  const { completeLabResult, markLabDelayed } = await import("../lib/e2e/lab-sim");
  const { documentPharmacyBarrier, createCoordinationTaskFromPharmacyEvent } = await import(
    "../lib/e2e/pharmacy-sim"
  );
  const { E2E_SOURCE } = await import("../lib/e2e/types");
  const {
    claimOrRecoverDurableAgentRun,
    finalizeDurableAgentRun,
    resetDurableAgentRunStoreForTests,
  } = await import("../lib/agents/execution-run-store");
  const { buildOpsRunVisibility } = await import("../lib/agents/ops-run-visibility");
  const { evaluateGuardianGateway } = await import("../lib/guardian-gateway");
  const { runAgentOrchestration } = await import("../lib/clinical-proof/agent-orchestration");

  await resetCareEpisodeStoreForTests(scopeKey);
  await resetDurableAgentRunStoreForTests(scopeKey);

  // --- 1) Patient identity (synthetic) ---
  const verified = verifiedPatientFromId(patientId);
  assert.ok(verified, "synthetic P002 must resolve");
  assert.ok(verified!.name);
  coverage.patient_identity = "covered";

  // Durable care episode first (product store assigns id); Front Desk threads it.
  const created = await createCareEpisode({
    patientId,
    patientLabel: verified!.name,
    createdBy: "reception-a5",
    scopeKey,
    organisationId: "org-synth-a5",
    pathway: "synthetic_gp_journey",
    initialStatus: "intake",
    idempotencyKey: `a5-golden:${patientId}:${scopeKey}`,
    metadata: { a5Golden: true },
  });
  const episodeId = created.id;
  assert.match(episodeId, /^ce-/);

  // --- 2) Patient intake → reception booking ---
  const state = createInitialState();
  const bookingItem = openIntakeBookingWorkItem(state, {
    careEpisodeId: episodeId,
    patientId,
    verifiedPatient: verified!,
    intakeSummary: `${verified!.name} · DOB ${verified!.dob} · A5 golden`,
    reviewCaseId: `case-a5-${randomUUID().slice(0, 6)}`,
  });
  assert.equal(bookingItem.careEpisodeId, episodeId);
  coverage.patient_to_reception = "covered";

  // --- 3) Reception → nurse ---
  const free = state.slots.find((s) => !s.patientId);
  assert.ok(free);
  const booked = bookSlot(state, free!.id, patientId, "staff", "a5-book", episodeId);
  assert.equal(booked.ok, true);
  if (!booked.ok) throw new Error("booking failed");
  const nurseTask = handoffBookingToNurse(state, booked.slot, {
    patientLabel: verified!.name,
    careEpisodeId: episodeId,
  });
  assert.ok(nurseTask);
  assert.equal(nurseTask!.careEpisodeId, episodeId);
  assert.ok(listOpenNurseObservationTasks(state).some((t) => t.careEpisodeId === episodeId));
  coverage.reception_to_nurse = "covered";

  // --- 4) Nurse → GP (care-episode spine) ---
  const intake = await correlateCareEpisodeStage({
    patientId,
    patientLabel: verified!.name,
    actor: "reception-a5",
    scopeKey,
    careEpisodeId: episodeId,
    stage: "intake",
    linkId: bookingItem.id,
  });
  assert.equal(intake.careEpisodeId, episodeId);

  const nurse = await integrateNurseObservationsStage({
    patientId,
    actor: "nurse-a5",
    scopeKey,
    careEpisodeId: episodeId,
    vitalsSampleId: `vitals-a5-${randomUUID().slice(0, 6)}`,
  });
  assert.equal(nurse.careEpisodeId, episodeId);
  assert.equal(nurse.gpHandoffCreated, true);
  coverage.nurse_to_gp = "covered";

  // --- 5) GP CONDUCTOR + Guardian PASS → enqueue ---
  const orch = await runAgentOrchestration({
    patientId,
    careEpisodeId: episodeId,
    correlationId: `corr-a5-${randomUUID().slice(0, 8)}`,
    scopeKey,
    expectedScopeKey: scopeKey,
    agentTimeoutMs: 10_000,
    overallTimeoutMs: 30_000,
  });
  assert.equal(orch.ehrWrite, false);
  assert.equal(orch.hitlRequired, true);
  assert.ok(orch.execution.agents.length >= 5);

  const clinicalCtx = {
    schemaVersion: "aksh-context-1.0",
    contextId: "ctx-a5-golden",
    assembledAt: new Date().toISOString(),
    purpose: "clinical_decision_support",
    liveEmis: false,
    patient_context: { patientId, label: verified!.name },
    encounter_context: { lastEncounterDate: null, nextAppointmentDate: null },
    clinical_history: { conditions: [], flags: [] },
    conditions: [],
    medications: [],
    allergies: [],
    observations: [],
    laboratory_results: [],
    procedures: [],
    relevant_guidelines: [],
    evidence: [
      {
        id: "e-a5",
        title: "fixture",
        kind: "fact",
        citation: "mock",
        provenance: "test",
      },
    ],
    risk_factors: [],
    missing_information: [],
    uncertainties: [],
    provenance: [],
    dataSource: "mock",
  } as ClinicalContextPackage;
  const gateway = evaluateGuardianGateway({
    context: clinicalCtx,
    modelId: "aksh-nexus-synthetic-v1",
    environment: "synthetic",
    userText: "routine diabetes review — synthetic A5",
  });
  assert.notEqual(gateway.output_status, "BLOCK");
  assert.equal(mayEnqueueAgentDraft(gateway.output_status), true);

  const now = Date.parse("2026-10-30T21:00:00.000Z");
  const ctx = buildSharedPatientContext(patientId, { now });
  const { drafts } = draftAllKindsForPatient(patientId, { now, context: ctx });
  const enqueued = await enqueueDiabetesDraftsToSpineReview({
    patientId,
    patientLabel: ctx.patientLabel,
    drafts,
    guardianOutputStatus: "PASS",
    runId: `a5-pass-${randomUUID().slice(0, 6)}`,
    userId: "gp-a5",
    scopeKey,
    careEpisodeId: episodeId,
    nowMs: now,
  });
  assert.equal(enqueued.enqueued, true);
  const queueItems = queueItemsFromDiabetesDrafts(enqueued.caseId, drafts);
  assert.ok(queueItems.every((i) => i.metadata?.diabetesDraftId));
  coverage.gp_conductor_guardian = "covered";

  // --- 6) Lab (draft tracking product + lab-sim result) ---
  const review = await integrateClinicalReviewStage({
    patientId,
    actor: "gp-a5",
    scopeKey,
    careEpisodeId: episodeId,
    reviewCaseId: enqueued.caseId,
  });
  assert.equal(review.careEpisodeId, episodeId);

  const reviewCase = {
    id: enqueued.caseId,
    userId: "gp-a5",
    patientId,
    careEpisodeId: episodeId,
    patientLabel: verified!.name,
    status: "pending_review" as const,
    updatedAt: new Date().toISOString(),
    summary: "A5 golden lab draft",
    reviewQueueItems: [
      {
        id: "q-lab-a5",
        agentId: "REFERRAL" as const,
        itemType: "lab_order" as const,
        status: "DRAFT" as const,
        title: "HbA1c",
        summary: "lab draft",
        content: "draft only",
      },
    ],
    input: {} as never,
    safetyContext: {} as never,
    draft: {} as never,
    auditEvents: [],
  };
  const labSnaps = trackLabReferralDraftStatuses(reviewCase);
  assert.equal(labSnaps.length, 1);
  assert.equal(labSnaps[0]!.status, "DRAFT");
  assert.equal(labSnaps[0]!.ehrWrite, false);
  const labItem = reviewCase.reviewQueueItems[0]!;
  const acceptedLab = applyDraftStatusTransition(labItem, "ACCEPTED");
  assert.equal(acceptedLab.status, "ACCEPTED");

  const meta = {
    isSynthetic: true as const,
    source: E2E_SOURCE,
    batchId: "a5-golden",
    generatedAt: new Date().toISOString(),
    liveEmis: false as const,
  };
  const orderedLab = {
    id: "lab-a5-1",
    orderId: "ord-a5-1",
    laboratoryId: "lab-synth-a5",
    patientId,
    testCode: "HbA1c",
    testName: "HbA1c",
    status: "ordered" as const,
    resultFlag: "missing" as const,
    value: null,
    unit: "mmol/mol",
    orderedAt: new Date().toISOString(),
    resultedAt: null,
    metadata: meta,
  };
  const delayed = markLabDelayed({ event: orderedLab, actor: "lab-a5" });
  assert.equal(delayed.event.status, "delayed");
  const completed = completeLabResult({
    event: delayed.event,
    value: 58,
    unit: "mmol/mol",
    actor: "lab-a5",
  });
  assert.equal(completed.event.status, "completed");
  assert.equal(completed.ehrWrite, false);
  coverage.lab = "sim";

  // --- 7) Pharmacist (integrateClinicalReviewStage may already open the task; handoff is idempotent) ---
  assert.equal(review.pharmacistHandoffCreated, true);
  const pharm = await handoffGpToPharmacist({
    patientId,
    actor: "gp-a5",
    scopeKey,
    careEpisodeId: episodeId,
    reviewCaseId: enqueued.caseId,
  });
  assert.equal(pharm.created, false, "idempotent GP→pharmacist after clinical review");
  assert.equal(pharm.careEpisodeId, episodeId);
  assert.ok(pharm.task);

  const pharmacyEvent = {
    id: "pharm-a5-1",
    pharmacyId: "pharm-synth-a5",
    patientId,
    kind: "adherence_issue" as const,
    medication: "metformin",
    status: "failed" as const,
    occurredAt: new Date().toISOString(),
    metadata: meta,
  };
  const coord = createCoordinationTaskFromPharmacyEvent({
    event: pharmacyEvent,
    actor: "pharmacist-a5",
  });
  assert.ok(coord.id);
  const documented = documentPharmacyBarrier(
    coord,
    "adherence concern — synthetic A5",
    "pharmacist-a5"
  );
  assert.equal(documented.status, "documented");
  assert.equal(documented.ehrWrite, false);
  coverage.pharmacist = "sim";

  // --- 8) Care plan → patient visibility ---
  const plan = await createCarePlanRecord(
    {
      patientId,
      patientLabel: verified!.name,
      sections: [
        {
          id: "goals",
          title: "Goals",
          items: ["Confirm HbA1c follow-up"],
          clinical: false,
        },
      ],
      safetyNotes: [],
      missingData: [],
      createdBy: "gp-a5",
    },
    { scopeKey, organisationId: "org-synth-a5" }
  );
  assert.equal(plan.status, "DRAFT");
  assert.equal(plan.ehrWrite, false);

  const decided = await decideCarePlan(
    {
      planId: plan.id,
      action: "accept",
      actor: "gp-a5",
      actorPersona: "gp",
      reason: "A5 synthetic approval",
    },
    { scopeKey, organisationId: "org-synth-a5" }
  );
  assert.equal(decided.plan.status, "APPROVED");

  const visible = filterPatientVisibleCarePlans([plan, decided.plan]);
  assert.equal(visible.length, 1);
  assert.equal(visible[0]!.id, decided.plan.id);
  const patientFacing = toPatientVisibleCarePlans([plan, decided.plan]);
  assert.equal(patientFacing.length, 1);
  assert.equal(patientFacing[0]!.draftsHidden, true);
  coverage.care_plan_patient = "covered";

  // --- 9) Ops visibility (PHI-safe) ---
  const claim = await claimOrRecoverDurableAgentRun({
    scopeKey,
    patientId: `${patientId}-Sensitive-Label`,
    patientLabel: "SHOULD_NEVER_LEAK_A5",
    correlationId: `corr-ops-a5-${randomUUID().slice(0, 6)}`,
    idempotencyKey: `a5-ops-${randomUUID().slice(0, 8)}`,
    organisationId: "org-synth-a5",
    careEpisodeId: episodeId,
  });
  assert.equal(claim.outcome, "claimed");
  await finalizeDurableAgentRun({
    ...claim.record,
    status: "completed",
    guardianOutcome: "PASS",
    reviewStatus: "queued",
    draftEnqueueAllowed: true,
    shieldAuditPersisted: true,
    completedAt: new Date().toISOString(),
    execution: {
      ...claim.record.execution,
      status: "completed",
      completedAt: new Date().toISOString(),
      durationMs: 12,
    },
  });
  const ops = await buildOpsRunVisibility({ scopeKey, limit: 20 });
  assert.ok(ops.total >= 1);
  assert.equal(ops.phiLeakage, false);
  const blob = JSON.stringify(ops);
  assert.doesNotMatch(blob, /SHOULD_NEVER_LEAK_A5/);
  assert.doesNotMatch(blob, /Sensitive-Label/);
  coverage.ops = "covered";

  // --- Episode continuity proof ---
  const episode = await getCareEpisode(episodeId, scopeKey);
  assert.ok(episode);
  assert.ok(episode!.tasks.some((t) => t.ownerRole === "gp"));
  assert.ok(episode!.tasks.some((t) => t.ownerRole === "pharmacist"));

  const summary = {
    mode: "api_unit",
    browserPlaywright: false,
    careEpisodeId: episodeId,
    coverage,
  };
  console.log(
    "milestone-a5-golden-journey:",
    JSON.stringify(summary),
    "— PASS (API/unit; Playwright multi-role browser chain NOT executed)"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDb;
    if (prevUse === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUse;
    rmSync(tmp, { recursive: true, force: true });
  });
