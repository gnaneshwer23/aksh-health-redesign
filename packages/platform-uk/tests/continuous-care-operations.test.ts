/**
 * Phase 4 — Continuous care / longitudinal operations (synthetic, file-store path).
 * ehrWrite must stay false; no autonomous clinical actions; HITL on escalations;
 * every workflow has owner, status, timestamps, decision history, measurable outcome.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "ccare-phase4-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    seedAndBuildContinuousCare,
    advanceContinuousFollowUp,
    advanceAppointment,
    advancePatientUpdate,
    setContinuousNotificationPrefs,
    advanceCarePlanProgress,
    decideStaffEscalation,
    buildContinuousCareWorklist,
  } = await import("../lib/diabetes-intelligence");
  const { capability } = await import("../lib/status/capabilities");

  const scopeKey = `test_${Date.now()}`;
  const patientId = "P002";
  const now = Date.parse("2026-10-29T12:00:00.000Z");

  let snap = await seedAndBuildContinuousCare(patientId, {
    scopeKey,
    now,
    actor: "clinician@aksh.health",
  });

  assert.equal(snap.synthetic, true);
  assert.equal(snap.ehrWrite, false);
  assert.equal(snap.hitlRequired, true);
  assert.equal(snap.autonomousClinicalAction, false);
  assert.equal(snap.clinicalValidationClaim, false);

  assert.ok(snap.followUpWorklist.length >= 3, "follow-up worklist seeded");
  assert.ok(snap.appointments.length >= 1, "appointments seeded");
  assert.ok(snap.patientReportedUpdates.length >= 1, "patient updates seeded");
  assert.ok(snap.notificationPreferences, "notification prefs seeded");
  assert.ok(snap.escalationQueue.length >= 1, "escalations seeded");
  assert.ok(snap.carePlanProgress.length >= 1, "plan progress seeded");
  assert.ok(snap.decisionHistory.length >= 1, "decision history present");
  assert.equal(snap.analytics.synthetic, true);
  assert.equal(snap.analytics.safety.autonomousClinicalActions, 0);
  assert.equal(snap.analytics.safety.ehrWrites, 0);
  assert.ok(snap.analytics.openFollowUps >= 1);

  for (const f of snap.followUpWorklist) {
    assert.ok(f.ownerRole, "follow-up has owner");
    assert.ok(f.status, "follow-up has status");
    assert.ok(f.createdAt && f.updatedAt, "follow-up has timestamps");
    assert.ok(f.decisionHistory.length >= 1, "follow-up has decision history");
    assert.ok(f.measurableOutcome?.metric, "follow-up has measurable outcome");
    assert.equal(f.ehrWrite, false);
    assert.equal(f.autonomousClinicalAction, false);
  }

  // Complete a follow-up → completed-action tracking
  const openFu = snap.followUpWorklist.find((f) => f.status === "open");
  assert.ok(openFu);
  snap = await advanceContinuousFollowUp(
    {
      patientId,
      itemId: openFu!.id,
      status: "completed",
      note: "Completed synthetic follow-up",
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  assert.equal(snap.followUpWorklist.find((f) => f.id === openFu!.id)?.status, "completed");
  assert.ok(snap.completedActions.some((c) => c.sourceRefId === openFu!.id));
  assert.equal(snap.completedActions[0]?.ehrWrite, false);
  assert.ok(snap.completedActions[0]?.measurableOutcome.metric);

  // Appointment coordination
  const appt = snap.appointments[0];
  assert.ok(appt);
  snap = await advanceAppointment(
    {
      patientId,
      appointmentId: appt.id,
      status: "confirmed",
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  assert.equal(snap.appointments.find((a) => a.id === appt.id)?.status, "confirmed");
  assert.equal(snap.appointments.find((a) => a.id === appt.id)?.hitlRequired, true);

  // Patient-reported update triage
  const upd = snap.patientReportedUpdates.find((u) => u.status === "submitted");
  assert.ok(upd);
  assert.equal(upd!.verifiedByClinician, false);
  snap = await advancePatientUpdate(
    {
      patientId,
      updateId: upd!.id,
      status: "acknowledged",
      actor: "nurse@aksh.health",
    },
    { scopeKey }
  );
  assert.equal(snap.patientReportedUpdates.find((u) => u.id === upd!.id)?.status, "acknowledged");

  // Notification preferences
  snap = await setContinuousNotificationPrefs(
    {
      patientId,
      channels: { email: true, sms: true, inApp: true, push: false },
      actor: "patient-proxy@aksh.health",
    },
    { scopeKey }
  );
  assert.equal(snap.notificationPreferences?.channels.sms, true);

  // Care-plan progress
  const prog = snap.carePlanProgress[0];
  assert.ok(prog);
  const openMilestone = prog.milestones.find((m) => !m.done);
  assert.ok(openMilestone);
  snap = await advanceCarePlanProgress(
    {
      patientId,
      progressId: prog.id,
      milestoneId: openMilestone!.id,
      milestoneDone: true,
      actor: "clinician@aksh.health",
    },
    { scopeKey }
  );
  assert.ok(
    snap.carePlanProgress
      .find((p) => p.id === prog.id)
      ?.milestones.some((m) => m.id === openMilestone!.id && m.done)
  );
  assert.ok((snap.carePlanProgress.find((p) => p.id === prog.id)?.progressPct ?? 0) > prog.progressPct);

  // Escalation HITL — reject without reason fails
  const draft = snap.escalationQueue.find((e) => e.status === "DRAFT");
  assert.ok(draft);
  assert.equal(draft!.hitlRequired, true);
  assert.equal(draft!.ehrWrite, false);
  assert.equal(draft!.autonomousClinicalAction, false);

  let rejected = false;
  try {
    await decideStaffEscalation(
      {
        patientId,
        escalationId: draft!.id,
        action: "reject",
        actor: "clinician@aksh.health",
      },
      { scopeKey }
    );
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, "reject without reason fails");

  snap = await decideStaffEscalation(
    {
      patientId,
      escalationId: draft!.id,
      action: "accept",
      actor: "clinician@aksh.health",
      reason: "Accepted for nurse triage — synthetic",
    },
    { scopeKey }
  );
  assert.equal(snap.escalationQueue.find((e) => e.id === draft!.id)?.status, "accepted");

  snap = await decideStaffEscalation(
    {
      patientId,
      escalationId: draft!.id,
      action: "resolve",
      actor: "nurse@aksh.health",
      reason: "Resolved after phone check — no EHR write",
    },
    { scopeKey }
  );
  assert.equal(snap.escalationQueue.find((e) => e.id === draft!.id)?.status, "resolved");
  assert.ok(snap.completedActions.some((c) => c.sourceRefId === draft!.id));

  // Worklists
  const gpList = await buildContinuousCareWorklist({ scopeKey });
  assert.ok(Array.isArray(gpList));
  assert.ok(gpList.every((i) => i.synthetic === true && i.ehrWrite === false));

  const nurseList = await buildContinuousCareWorklist({ scopeKey, roleFilter: "nurse" });
  assert.ok(nurseList.every((i) => i.ownerRole === "nurse"));

  assert.ok(snap.decisionHistory.length >= 5);
  assert.equal(snap.ehrWrite, false);
  assert.equal(snap.analytics.safety.autonomousClinicalActions, 0);

  const cap = capability("continuous_care_operations");
  assert.equal(cap.status, "synthetic_demo");
  assert.ok(cap.evidence.includes("tests/continuous-care-operations.test.ts"));

  console.log(
    "continuous-care-operations: worklists, appointments, updates, prefs, escalations HITL, progress, analytics — PASS"
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
