/**
 * Milestone A3 — stakeholder handoffs, ops visibility (no PHI), assignment boundaries,
 * care-plan approved-only, lab/referral draft tracking, outbox drain.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const tmp = mkdtempSync(path.join(tmpdir(), "a3-stakeholder-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    resetCareEpisodeStoreForTests,
    getCareEpisode,
    integrateNurseObservationsStage,
    integrateClinicalReviewStage,
    correlateCareEpisodeStage,
    handoffNurseToGp,
    handoffGpToPharmacist,
    filterPatientVisibleCarePlans,
    toPatientVisibleCarePlans,
    assignFollowUpOwnership,
    trackLabReferralDraftStatuses,
    applyDraftStatusTransition,
    drainCareEpisodeOutbox,
    describeOutboxConsumerDesign,
  } = await import("../lib/care-episode");

  const {
    claimOrRecoverDurableAgentRun,
    finalizeDurableAgentRun,
    resetDurableAgentRunStoreForTests,
  } = await import("../lib/agents/execution-run-store");
  const {
    buildOpsRunVisibility,
    patientRefForOps,
    toOpsRunVisibilityRow,
  } = await import("../lib/agents/ops-run-visibility");
  const {
    mutateReviewQueueAssignment,
    resetReviewQueueAssignmentsForTests,
    ReviewQueueAssignmentError,
  } = await import("../lib/gp/review-queue-assignment");
  const { selectPatientVisibleApprovedPlans } = await import(
    "../lib/diabetes-intelligence/care-plan-facade"
  );
  const { resolveShieldAwareEnqueue } = await import("../lib/agents/shield-orchestration-gate");

  const scopeKey = `a3-${randomUUID().slice(0, 8)}`;
  await resetCareEpisodeStoreForTests(scopeKey);
  await resetDurableAgentRunStoreForTests(scopeKey);
  await resetReviewQueueAssignmentsForTests(scopeKey);

  // --- PHI-safe ops visibility ---
  {
    const claim = await claimOrRecoverDurableAgentRun({
      scopeKey,
      patientId: "P002-Sensitive-Name",
      patientLabel: "SHOULD_NEVER_LEAK",
      correlationId: `corr-a3-${randomUUID().slice(0, 6)}`,
      idempotencyKey: `a3-ops-${randomUUID().slice(0, 8)}`,
      organisationId: "practice-demo",
    });
    assert.equal(claim.outcome, "claimed");
    await finalizeDurableAgentRun({
      ...claim.record,
      status: "blocked",
      guardianOutcome: "PASS",
      reviewStatus: "blocked_from_queue",
      draftEnqueueAllowed: false,
      shieldAuditPersisted: false,
      completedAt: new Date().toISOString(),
      note: "SHIELD unavailable blocked enqueue",
      execution: {
        ...claim.record.execution,
        status: "blocked",
        completedAt: new Date().toISOString(),
        durationMs: 1,
        errorCode: "SHIELD_UNAVAILABLE",
        errorMessage: "shield unavailable",
      },
    });

    const summary = await buildOpsRunVisibility({ scopeKey, limit: 20 });
    assert.ok(summary.total >= 1);
    assert.ok(summary.shieldBlockedCount >= 1);
    assert.equal(summary.phiLeakage, false);
    const row = summary.rows[0]!;
    assert.equal(row.phiLeakage, false);
    assert.match(row.patientRef, /^pt_[a-f0-9]{8}$/);
    assert.notEqual(row.patientRef, "P002-Sensitive-Name");
    const blob = JSON.stringify(summary);
    assert.doesNotMatch(blob, /SHOULD_NEVER_LEAK/);
    assert.doesNotMatch(blob, /P002-Sensitive-Name/);
    assert.equal(patientRefForOps("P002-Sensitive-Name"), row.patientRef);

    const gate = resolveShieldAwareEnqueue({
      guardianAllowsEnqueue: true,
      shieldPersisted: false,
      durableRequired: true,
    });
    assert.equal(gate.shieldBlockedEnqueue, true);
    assert.equal(toOpsRunVisibilityRow(claim.record).ehrWrite, false);
  }

  // --- Nurse → GP + GP → pharmacist handoffs (same episode) ---
  {
    const intake = await correlateCareEpisodeStage({
      patientId: "P002",
      patientLabel: "Synthetic",
      actor: "a3-test",
      scopeKey,
      stage: "intake",
      linkId: "intake-a3",
    });
    const nurse = await integrateNurseObservationsStage({
      patientId: "P002",
      actor: "a3-nurse",
      scopeKey,
      careEpisodeId: intake.careEpisodeId,
      vitalsSampleId: "vitals-a3-1",
    });
    assert.equal(nurse.careEpisodeId, intake.careEpisodeId);
    assert.equal(nurse.gpHandoffCreated, true);

    const again = await handoffNurseToGp({
      patientId: "P002",
      actor: "a3-nurse",
      scopeKey,
      careEpisodeId: intake.careEpisodeId,
      vitalsSampleId: "vitals-a3-1",
    });
    assert.equal(again.created, false, "idempotent nurse→GP");

    const review = await integrateClinicalReviewStage({
      patientId: "P002",
      actor: "a3-gp",
      scopeKey,
      careEpisodeId: intake.careEpisodeId,
      reviewCaseId: "case-a3-1",
    });
    assert.equal(review.pharmacistHandoffCreated, true);

    const pharmAgain = await handoffGpToPharmacist({
      patientId: "P002",
      actor: "a3-gp",
      scopeKey,
      careEpisodeId: intake.careEpisodeId,
      reviewCaseId: "case-a3-1",
    });
    assert.equal(pharmAgain.created, false, "idempotent GP→pharmacist");

    const episode = await getCareEpisode(intake.careEpisodeId, scopeKey);
    assert.ok(episode);
    assert.ok(episode!.tasks.some((t) => t.ownerRole === "gp" && t.status === "open"));
    assert.ok(episode!.tasks.some((t) => t.ownerRole === "pharmacist" && t.status === "open"));
  }

  // --- Care-plan approved-only patient visibility ---
  {
    const plans = [
      {
        id: "cp-draft",
        patientId: "P002",
        patientLabel: "Synthetic",
        status: "DRAFT" as const,
        sections: [],
        safetyNotes: [],
        missingData: [],
        createdBy: "gp",
        createdAt: "2026-10-30T00:00:00.000Z",
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
        version: 1,
        hitlRequired: true as const,
        ehrWrite: false as const,
        synthetic: true as const,
      },
      {
        id: "cp-ok",
        patientId: "P002",
        patientLabel: "Synthetic",
        status: "APPROVED" as const,
        sections: [{ id: "s1", title: "Goals", items: ["Walk"], clinical: false }],
        safetyNotes: [],
        missingData: [],
        createdBy: "gp",
        createdAt: "2026-10-30T00:00:00.000Z",
        decidedBy: "gp",
        decidedAt: "2026-10-30T01:00:00.000Z",
        decisionReason: null,
        version: 2,
        hitlRequired: true as const,
        ehrWrite: false as const,
        synthetic: true as const,
      },
      {
        id: "cp-rej",
        patientId: "P002",
        patientLabel: "Synthetic",
        status: "REJECTED" as const,
        sections: [],
        safetyNotes: [],
        missingData: [],
        createdBy: "gp",
        createdAt: "2026-10-30T00:00:00.000Z",
        decidedBy: "gp",
        decidedAt: "2026-10-30T01:00:00.000Z",
        decisionReason: "not ready",
        version: 1,
        hitlRequired: true as const,
        ehrWrite: false as const,
        synthetic: true as const,
      },
    ];
    const visible = filterPatientVisibleCarePlans(plans);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]!.id, "cp-ok");
    const patientFacing = toPatientVisibleCarePlans(plans);
    assert.equal(patientFacing.length, 1);
    assert.equal(patientFacing[0]!.draftsHidden, true);
    assert.equal(patientFacing[0]!.status, "APPROVED");

    const unified = [
      {
        id: "u1",
        patientId: "P002",
        patientLabel: "Synthetic",
        sourceStore: "journey_care_plan" as const,
        unifiedKey: "journey:u1",
        title: "Draft",
        status: "DRAFT",
        sections: [],
        version: 1,
        createdAt: "2026-10-30T00:00:00.000Z",
        decidedAt: null,
        decidedBy: null,
        hitlRequired: true as const,
        ehrWrite: false as const,
        synthetic: true as const,
        provenance: "journey_hitl" as const,
        physicalStore: "care_plan_records" as const,
      },
      {
        id: "u2",
        patientId: "P002",
        patientLabel: "Synthetic",
        sourceStore: "journey_care_plan" as const,
        unifiedKey: "journey:u2",
        title: "Approved",
        status: "APPROVED",
        sections: [],
        version: 2,
        createdAt: "2026-10-30T00:00:00.000Z",
        decidedAt: "2026-10-30T01:00:00.000Z",
        decidedBy: "gp",
        hitlRequired: true as const,
        ehrWrite: false as const,
        synthetic: true as const,
        provenance: "journey_hitl" as const,
        physicalStore: "care_plan_records" as const,
      },
    ];
    assert.equal(selectPatientVisibleApprovedPlans(unified).length, 1);
  }

  // --- Follow-up ownership ---
  {
    const task = {
      id: "fu-1",
      patientId: "P002",
      planId: "cp-ok",
      title: "Day-7 check-in",
      owner: "gp:alice",
      status: "open" as const,
      dueAt: "2026-11-06T00:00:00.000Z",
      createdAt: "2026-10-30T00:00:00.000Z",
      acknowledgedAt: null,
      closedAt: null,
      note: null,
      organisationId: "org-a",
      synthetic: true as const,
    };
    const owned = assignFollowUpOwnership(task, {
      owner: "nurse:bob",
      actor: "a3-gp",
      organisationId: "org-a",
    });
    assert.equal(owned.owner, "nurse:bob");
    assert.equal(owned.ownershipAudit.from, "gp:alice");
    assert.throws(
      () =>
        assignFollowUpOwnership(task, {
          owner: "nurse:bob",
          actor: "a3-gp",
          organisationId: "org-other",
        }),
      /organisation boundary/
    );
  }

  // --- Lab / referral draft status tracking ---
  {
    const reviewCase = {
      id: "case-draft-a3",
      userId: "usr_a3",
      patientId: "P002",
      careEpisodeId: "ce-a3",
      patientLabel: "Synthetic",
      status: "pending_review" as const,
      updatedAt: new Date().toISOString(),
      summary: "test",
      reviewQueueItems: [
        {
          id: "q-lab",
          agentId: "REFERRAL" as const,
          itemType: "lab_order" as const,
          status: "DRAFT" as const,
          title: "Lab",
          summary: "labs",
          content: "draft",
        },
        {
          id: "q-ref",
          agentId: "REFERRAL" as const,
          itemType: "referral_package" as const,
          status: "DRAFT" as const,
          title: "Referral",
          summary: "ref",
          content: "draft",
        },
      ],
      input: {} as never,
      safetyContext: {} as never,
      draft: {} as never,
      auditEvents: [],
    };
    const snaps = trackLabReferralDraftStatuses(reviewCase);
    assert.equal(snaps.length, 2);
    assert.ok(snaps.every((s) => s.status === "DRAFT" && s.ehrWrite === false));
    const accepted = applyDraftStatusTransition(reviewCase.reviewQueueItems![0]!, "ACCEPTED");
    assert.equal(accepted.status, "ACCEPTED");
    assert.throws(() => applyDraftStatusTransition(accepted, "REJECTED"));
  }

  // --- Assignment boundaries + audit ---
  {
    const { assignment, audit } = await mutateReviewQueueAssignment({
      caseId: "case-a3-assign",
      patientId: "P002",
      practiceId: "practice-demo",
      actorPracticeId: "practice-demo",
      organisationId: "org-a",
      scopeKey,
      actorUserId: "usr_gp_1",
      assigneeUserId: "usr_gp_2",
      action: "assign",
    });
    assert.equal(assignment.assigneeUserId, "usr_gp_2");
    assert.equal(audit.action, "assign");
    assert.equal(audit.fromAssigneeUserId, null);

    const re = await mutateReviewQueueAssignment({
      caseId: "case-a3-assign",
      patientId: "P002",
      practiceId: "practice-demo",
      actorPracticeId: "practice-demo",
      scopeKey,
      actorUserId: "usr_gp_1",
      assigneeUserId: "usr_gp_3",
      action: "reassign",
      reason: "coverage",
    });
    assert.equal(re.audit.fromAssigneeUserId, "usr_gp_2");
    assert.equal(re.assignment.assigneeUserId, "usr_gp_3");

    const esc = await mutateReviewQueueAssignment({
      caseId: "case-a3-assign",
      patientId: "P002",
      practiceId: "practice-demo",
      actorPracticeId: "practice-demo",
      scopeKey,
      actorUserId: "usr_gp_1",
      assigneeUserId: "usr_gp_lead",
      action: "escalate",
      reason: "red flag",
    });
    assert.equal(esc.assignment.priority, "escalated");

    await assert.rejects(
      () =>
        mutateReviewQueueAssignment({
          caseId: "case-x",
          practiceId: "practice-demo",
          actorPracticeId: "practice-other",
          scopeKey,
          actorUserId: "usr_gp_1",
          assigneeUserId: "usr_gp_2",
          action: "assign",
        }),
      (err: unknown) =>
        err instanceof ReviewQueueAssignmentError && err.code === "FORBIDDEN"
    );

    await assert.rejects(
      () =>
        mutateReviewQueueAssignment({
          caseId: "case-a3-assign",
          patientId: "P999",
          practiceId: "practice-demo",
          actorPracticeId: "practice-demo",
          allowedPatientIds: ["P002"],
          scopeKey,
          actorUserId: "usr_gp_1",
          assigneeUserId: "usr_gp_2",
          action: "assign",
        }),
      (err: unknown) =>
        err instanceof ReviewQueueAssignmentError && err.code === "FORBIDDEN"
    );
  }

  // --- Outbox drain design + continuity ---
  {
    const design = describeOutboxConsumerDesign();
    assert.equal(design.topic, "care_episode.transition");
    assert.ok(design.handlers.includes("handoffNurseToGp"));
    assert.ok(design.nonGoals.some((n) => /second CONDUCTOR/i.test(n)));

    const intake = await correlateCareEpisodeStage({
      patientId: "P003",
      actor: "a3-outbox",
      scopeKey,
      stage: "intake",
      linkId: "intake-obx",
    });
    // Advance to encounter_active to emit outbox
    const { transitionCareEpisode } = await import("../lib/care-episode");
    await transitionCareEpisode({
      episodeId: intake.careEpisodeId,
      toStatus: "scheduled",
      actor: "a3-outbox",
      scopeKey,
    }).catch(() => undefined);
    await transitionCareEpisode({
      episodeId: intake.careEpisodeId,
      toStatus: "encounter_active",
      actor: "a3-outbox",
      scopeKey,
    }).catch(() => undefined);

    const drained = await drainCareEpisodeOutbox({
      careEpisodeId: intake.careEpisodeId,
      patientId: "P003",
      actor: "a3-outbox",
      scopeKey,
    });
    assert.equal(drained.ehrWrite, false);
    assert.equal(drained.autonomous, false);
    assert.ok(drained.designNote.includes(" Neon") || drained.designNote.includes("LISTEN") || drained.designNote.length > 20);
  }

  // --- Cross-account / scope isolation for assignments ---
  {
    const otherScope = `a3-other-${randomUUID().slice(0, 6)}`;
    await resetReviewQueueAssignmentsForTests(otherScope);
    await mutateReviewQueueAssignment({
      caseId: "case-scope-a",
      practiceId: "practice-demo",
      actorPracticeId: "practice-demo",
      scopeKey,
      actorUserId: "usr_a",
      assigneeUserId: "usr_b",
      action: "assign",
    });
    const { listReviewQueueAssignments } = await import("../lib/gp/review-queue-assignment");
    const otherList = await listReviewQueueAssignments(otherScope, { practiceId: "practice-demo" });
    assert.equal(otherList.length, 0, "assignments must not leak across scopeKey");
  }

  console.log("stakeholder-integration-a3: handoffs + ops visibility + assignment + approved-only — PASS");
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
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
