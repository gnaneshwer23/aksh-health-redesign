/**
 * Phase 3 — Medication and personalised care (synthetic, file-store path).
 * ehrWrite must stay false; interactions labeled synthetic stub; no prescribe/adjust;
 * clinician Accept/Edit/Reject on safety reviews and care plans.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "medcare-phase3-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    seedAndBuildMedicationPersonalisedCare,
    startMedCareReconciliation,
    decideMedCareReconciliation,
    draftMedicationSafetyReview,
    decideMedicationSafetyReview,
    applyCarePlanTemplate,
    decideMedCarePlan,
    setPatientGoalStatus,
    advanceMedCareTask,
    handoffMedCareTask,
    INTERACTION_SOURCE_HONESTY,
  } = await import("../lib/diabetes-intelligence");
  const { capability } = await import("../lib/status/capabilities");

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P002";
  const now = Date.parse("2026-10-29T12:00:00.000Z");

  assert.equal(INTERACTION_SOURCE_HONESTY.kind, "synthetic_stub");
  assert.equal(INTERACTION_SOURCE_HONESTY.licensedDrugDatabase, false);

  let snap = await seedAndBuildMedicationPersonalisedCare(patientId, {
    scopeKey,
    now,
    actor: "clinician@aksh.health",
  });
  assert.equal(snap.synthetic, true);
  assert.equal(snap.ehrWrite, false);
  assert.equal(snap.hitlRequired, true);
  assert.equal(snap.autonomousPrescribe, false);
  assert.equal(snap.autonomousAdjust, false);
  assert.equal(snap.validatedCds, false);
  assert.equal(snap.clinicalValidationClaim, false);
  assert.ok(snap.medications.length > 0, "cohort medications present");
  assert.ok(snap.safetyFlags.length > 0, "safety flags seeded");
  assert.ok(snap.goals.length >= 2, "goals seeded");
  assert.ok(snap.assignedTasks.length >= 1, "tasks seeded");
  assert.ok(snap.handoffs.length >= 1, "handoffs seeded");
  assert.equal(snap.allergyInteractions.source.licensedDrugDatabase, false);
  assert.ok(
    snap.allergyInteractions.source.label.toLowerCase().includes("synthetic"),
    "interaction source clearly labeled"
  );
  assert.ok(
    snap.medicationReconciliations.some(
      (r) => r.status === "pending_clinician" || r.status === "in_progress"
    ),
    "med recon started"
  );
  assert.ok(snap.approvalHistory.length >= 1);

  // Extend recon workflow
  snap = await startMedCareReconciliation(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const pending = snap.medicationReconciliations.find((r) => r.status === "pending_clinician");
  assert.ok(pending);
  snap = await decideMedCareReconciliation(
    {
      patientId,
      runId: pending!.id,
      action: "complete",
      actor: "clinician@aksh.health",
      note: "Completed without prescribe",
    },
    { scopeKey }
  );
  assert.equal(
    snap.medicationReconciliations.find((r) => r.id === pending!.id)?.status,
    "completed"
  );
  assert.equal(snap.ehrWrite, false);

  // Safety review HITL
  snap = await draftMedicationSafetyReview(patientId, {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const draft = snap.safetyReviews.find((r) => r.status === "DRAFT");
  assert.ok(draft);
  assert.equal(draft!.ehrWrite, false);
  assert.equal(draft!.validatedCds, false);
  assert.equal(draft!.autonomousPrescribe, false);

  let rejected = false;
  try {
    await decideMedicationSafetyReview(
      {
        patientId,
        reviewId: draft!.id,
        action: "reject",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, "reject without reason fails");

  snap = await decideMedicationSafetyReview(
    {
      patientId,
      reviewId: draft!.id,
      action: "accept",
      actor: "clinician@aksh.health",
      reason: "Reviewed synthetic flags — counselling only",
    },
    { scopeKey }
  );
  assert.equal(snap.safetyReviews.find((r) => r.id === draft!.id)?.status, "APPROVED");
  assert.ok(snap.safetyFlags.every((f) => f.status !== "pending_review" || !draft!.flagIds.includes(f.id)));

  // Care plan template + HITL
  snap = await applyCarePlanTemplate(patientId, "polypharmacy_review", {
    scopeKey,
    createdBy: "clinician@aksh.health",
  });
  const plan = snap.carePlans.find((p) => p.status === "DRAFT");
  assert.ok(plan);
  assert.equal(plan!.templateId, "polypharmacy_review");
  assert.equal(plan!.ehrWrite, false);
  assert.equal(plan!.autonomousPrescribe, false);
  assert.ok(plan!.sections.length >= 2);

  snap = await decideMedCarePlan(
    {
      patientId,
      planId: plan!.id,
      action: "edit",
      actor: "clinician@aksh.health",
      editedSections: plan!.sections.map((s) =>
        s.id === "safety"
          ? { ...s, items: [...s.items, "Edited note: follow up in clinic"] }
          : s
      ),
    },
    { scopeKey }
  );
  assert.equal(snap.carePlans.find((p) => p.id === plan!.id)?.status, "APPROVED");
  assert.ok(
    snap.carePlans
      .find((p) => p.id === plan!.id)
      ?.sections.some((s) => s.items.some((i) => i.includes("Edited note")))
  );

  // Goals / tasks / handoffs
  const goal = snap.goals[0];
  assert.ok(goal);
  snap = await setPatientGoalStatus(
    {
      patientId,
      goalId: goal.id,
      status: "active",
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  assert.equal(snap.goals.find((g) => g.id === goal.id)?.status, "active");

  const task = snap.assignedTasks.find((t) => t.status === "open" || t.status === "handed_off");
  assert.ok(task);
  if (task!.status === "open") {
    snap = await advanceMedCareTask(
      {
        patientId,
        taskId: task!.id,
        status: "in_progress",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
    assert.equal(snap.assignedTasks.find((t) => t.id === task!.id)?.status, "in_progress");
  }

  const openOrProgress = snap.assignedTasks.find(
    (t) => t.status === "open" || t.status === "in_progress"
  );
  if (openOrProgress) {
    snap = await handoffMedCareTask(
      {
        patientId,
        taskId: openOrProgress.id,
        fromRole: "gp",
        toRole: "clinical-pharmacist",
        summary: "Handoff for medicines counselling (synthetic)",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
    assert.ok(snap.handoffs.some((h) => h.relatedTaskId === openOrProgress.id));
    assert.equal(
      snap.assignedTasks.find((t) => t.id === openOrProgress.id)?.status,
      "handed_off"
    );
  }

  assert.ok(snap.approvalHistory.length >= 3);
  assert.equal(snap.ehrWrite, false);
  assert.ok(snap.educationalResources.every((e) => e.synthetic === true));

  const cap = capability("medication_personalised_care");
  assert.equal(cap.status, "synthetic_demo");
  assert.ok(cap.evidence.includes("tests/medication-personalised-care.test.ts"));

  console.log(
    "medication-personalised-care: recon, stub interactions, safety HITL, templates, goals, tasks — PASS"
  );
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
    rmSync(tmp, { recursive: true, force: true });
  });
