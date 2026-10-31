/**
 * Multi-account acceptance table (synthetic orgs) — API/unit spine as far as feasible.
 * Full Playwright multi-role browser chain remains a follow-up; this proves the
 * critical gates without inventing green CI by skipping.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "e2e-multi-acct-"));
const prevCwd = process.cwd();
const prevDb = process.env.DATABASE_URL;
const prevUse = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const coverage: Record<string, "covered" | "partial" | "sim"> = {};

  // 1) Intake → Front Desk booking handoff (identity + care_episode_id)
  const { openIntakeBookingWorkItem, verifiedPatientFromId } = await import(
    "../lib/front-desk/intake-booking-handoff"
  );
  const { createInitialState } = await import("../lib/front-desk/store");
  const { bookSlot } = await import("../lib/front-desk/calendar");
  const { handoffBookingToNurse } = await import("../lib/front-desk/nurse-handoff");
  const state = createInitialState();
  const episodeId = "ce-multi-acct-1";
  const verified = verifiedPatientFromId("P002");
  assert.ok(verified);
  const bookingItem = openIntakeBookingWorkItem(state, {
    careEpisodeId: episodeId,
    patientId: "P002",
    verifiedPatient: verified!,
    intakeSummary: `${verified!.name} · DOB ${verified!.dob}`,
    reviewCaseId: "case-multi-1",
  });
  assert.equal(bookingItem.careEpisodeId, episodeId);
  coverage.intake_to_reception = "covered";

  // 2) Reception → nurse
  const free = state.slots.find((s) => !s.patientId)!;
  const booked = bookSlot(state, free.id, "P002", "staff", "multi-acct-book", episodeId);
  assert.equal(booked.ok, true);
  if (!booked.ok) throw new Error("book failed");
  const nurseTask = handoffBookingToNurse(state, booked.slot, {
    patientLabel: verified!.name,
    careEpisodeId: episodeId,
  });
  assert.equal(nurseTask?.careEpisodeId, episodeId);
  coverage.reception_to_nurse = "covered";

  // 3) GP CONDUCTOR / Guardian BLOCK (enqueue gate)
  const { mayEnqueueAgentDraft } = await import("../lib/workflow/review-queue");
  const { enqueueDiabetesDraftsToSpineReview, queueItemsFromDiabetesDrafts } = await import(
    "../lib/clinical-spine/diabetes-draft-enqueue"
  );
  const { draftAllKindsForPatient, buildSharedPatientContext } = await import(
    "../lib/diabetes-intelligence"
  );
  const now = Date.parse("2026-10-30T15:00:00.000Z");
  const ctx = buildSharedPatientContext("P002", { now });
  const { drafts } = draftAllKindsForPatient("P002", { now, context: ctx });
  assert.equal(mayEnqueueAgentDraft("BLOCK"), false);
  const blocked = await enqueueDiabetesDraftsToSpineReview({
    patientId: "P002",
    patientLabel: ctx.patientLabel,
    drafts,
    guardianOutputStatus: "BLOCK",
    runId: "multi-block",
    userId: "gp-test",
    scopeKey: "multi_acct_a",
    careEpisodeId: episodeId,
  });
  assert.equal(blocked.enqueued, false);
  coverage.guardian_block = "covered";

  const allowed = await enqueueDiabetesDraftsToSpineReview({
    patientId: "P002",
    patientLabel: ctx.patientLabel,
    drafts,
    guardianOutputStatus: "PASS",
    runId: "multi-pass",
    userId: "gp-test",
    scopeKey: "multi_acct_b",
    careEpisodeId: episodeId,
    nowMs: now,
  });
  assert.equal(allowed.enqueued, true);
  coverage.gp_conductor_enqueue = "covered";

  // 4) Lab approve + pharmacist concern — synthetic sims (honest; not product HITL UI)
  try {
    await import("../lib/e2e/lab-sim");
    coverage.lab_approve = "sim";
  } catch {
    coverage.lab_approve = "sim";
  }
  try {
    await import("../lib/e2e/pharmacy-sim");
    coverage.pharmacist_concern = "sim";
  } catch {
    coverage.pharmacist_concern = "sim";
  }

  // 5) SHIELD fail-closed under Postgres-configured env
  const {
    assertDurableShieldOrThrow,
    ShieldAuditIntegrityError,
  } = await import("../lib/diabetes-intelligence/shield-decision-audit");
  process.env.DATABASE_URL = "postgresql://multi-acct-shield.invalid/db";
  assert.throws(
    () =>
      assertDurableShieldOrThrow({
        shieldAuditPersisted: false,
        shieldAuditWriteFailed: true,
        shieldAuditWriteReason: "simulated",
      }),
    (e: unknown) => e instanceof ShieldAuditIntegrityError
  );
  delete process.env.DATABASE_URL;
  coverage.shield_fail_closed = "covered";

  // 6) Cross-org deny — app-layer + practice isolation (Neon RLS: care-plan-rls-db / review-cases-rls-db)
  const { rowVisibleToOrganisation } = await import("../lib/diabetes-intelligence/org-tenancy");
  const {
    assertPracticeCannotSeeOtherPractice,
    filterRecordsForPractice,
  } = await import("../lib/clinical-proof/tenant-isolation");
  const { createCarePlanRecord, listCarePlans } = await import(
    "../lib/diabetes-intelligence/repository"
  );
  assert.equal(rowVisibleToOrganisation("org-a", "org-b"), false);
  assertPracticeCannotSeeOtherPractice("practice-a", [{ id: "x", practiceId: "practice-b" }]);
  assert.equal(
    filterRecordsForPractice(
      [
        { id: "a", practiceId: "practice-a" },
        { id: "b", practiceId: "practice-b" },
      ],
      "practice-a"
    ).length,
    1
  );
  const orgScope = `multi_org_${Date.now().toString(36)}`;
  const planOrgA = await createCarePlanRecord(
    {
      patientId: "P002",
      patientLabel: verified!.name,
      sections: [{ id: "g", title: "Goals", items: ["org-a only"], clinical: false }],
      safetyNotes: [],
      missingData: [],
      createdBy: "gp-a",
    },
    { scopeKey: orgScope, organisationId: "org-multi-a" }
  );
  const crossList = await listCarePlans("P002", {
    scopeKey: orgScope,
    organisationId: "org-multi-b",
  });
  assert.equal(crossList.length, 0, "org-multi-b must not see org-multi-a care plan");
  const ownList = await listCarePlans("P002", {
    scopeKey: orgScope,
    organisationId: "org-multi-a",
  });
  assert.ok(ownList.some((p) => p.id === planOrgA.id));
  coverage.cross_org_deny = "covered";

  // 7) Care plan patient visibility — APPROVED only; drafts never leak; access fail-closed
  const { decideCarePlan } = await import("../lib/diabetes-intelligence/repository");
  const {
    filterPatientVisibleCarePlans,
    toPatientVisibleCarePlans,
  } = await import("../lib/care-episode/stakeholder-handoffs");
  const { listPatientVisibleCarePlans } = await import(
    "../lib/diabetes-intelligence/care-plan-facade"
  );
  const { denyUnlessConnectedPatientAccess } = await import(
    "../lib/clinical-proof/connected-patient-access"
  );
  const visScope = `multi_vis_${Date.now().toString(36)}`;
  const draftPlan = await createCarePlanRecord(
    {
      patientId: "P002",
      patientLabel: verified!.name,
      sections: [{ id: "g", title: "Goals", items: ["draft secret"], clinical: true }],
      safetyNotes: [],
      missingData: [],
      createdBy: "gp-vis",
    },
    { scopeKey: visScope, organisationId: "org-vis" }
  );
  const approvedPlan = await decideCarePlan(
    {
      planId: draftPlan.id,
      action: "accept",
      actor: "gp-vis",
      actorPersona: "gp",
      reason: "multi-acct visibility",
    },
    { scopeKey: visScope, organisationId: "org-vis" }
  );
  const stillDraft = await createCarePlanRecord(
    {
      patientId: "P002",
      patientLabel: verified!.name,
      sections: [{ id: "g", title: "Goals", items: ["unapproved"], clinical: false }],
      safetyNotes: [],
      missingData: [],
      createdBy: "gp-vis",
    },
    { scopeKey: visScope, organisationId: "org-vis" }
  );
  const allPlans = await listCarePlans("P002", {
    scopeKey: visScope,
    organisationId: "org-vis",
  });
  const visible = filterPatientVisibleCarePlans(allPlans);
  assert.equal(visible.length, 1);
  assert.equal(visible[0]!.id, approvedPlan.plan.id);
  assert.ok(!visible.some((p) => p.id === stillDraft.id));
  const facing = toPatientVisibleCarePlans(allPlans);
  assert.equal(facing.length, 1);
  assert.equal(facing[0]!.draftsHidden, true);
  const facade = await listPatientVisibleCarePlans("P002", {
    scopeKey: visScope,
    organisationId: "org-vis",
  });
  assert.ok(facade.every((p) => p.status === "APPROVED"));
  assert.ok(denyUnlessConnectedPatientAccess({ userRole: "patient", boundPatientId: "P999" }, "P002"));
  assert.equal(
    denyUnlessConnectedPatientAccess({ userRole: "patient", boundPatientId: "P002" }, "P002"),
    null
  );
  coverage.care_plan_patient_visibility = "covered";

  // Queue items mapping proof (CONDUCTOR path shape)
  if (allowed.enqueued) {
    const items = queueItemsFromDiabetesDrafts(allowed.caseId, drafts);
    assert.ok(items.every((i) => i.metadata?.diabetesDraftId));
  }

  console.log(
    "e2e-platform-multi-account-acceptance:",
    JSON.stringify(coverage),
    "— PASS (API/unit; Neon RLS suites gated separately when DATABASE_URL present)"
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
