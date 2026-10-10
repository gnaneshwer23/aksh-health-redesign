/**
 * Cancelled-slot workflow against the database: idempotency, state guards, shadow mode, read-back before "booked",
 * declines return patients to the list, failed read-back is handed off, and organisations cannot see each other's
 * queues. Skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { accessMetrics, addToWaitlist, applyAction, getWorkflow, ingestSlot, listQueue } from "../lib/access/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

async function user(label: string, role: string) {
  const id = randomUUID();
  const email = `acc-${label}-${id.slice(0, 8)}@akshhealth.test`;
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, email]);
  return { userId: id, email, displayName: `Test ${label}`, role };
}
const rejects = (p: Promise<unknown>, status: number, pattern?: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status && (!pattern || pattern.test(e.message)));
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

async function run() {
  if (!isPostgresConfigured()) return console.log("access-workflow-db: skipped (no DATABASE_URL)");
  const tag = randomUUID().slice(0, 6);
  const admin = await user("admin", "practice-manager");
  const org = await createOrganisation(admin, { name: `Access Clinic ${tag}`, kind: "clinic", region: "Europe", locale: { timezone: "UTC" } });
  const adminCtx = await loadNetworkContext(admin.userId, admin.role);
  const inv = await createInvite(adminCtx, org.id, { kind: "staff", role: "nurse" });
  const nurse = await user("nurse", "nurse");
  await acceptStaffInvite(nurse, { code: inv.code });
  const ctx = await loadNetworkContext(nurse.userId, nurse.role);

  const pts = await importPatients(ctx, org.id, {
    patients: ["Ada", "Ben", "Cy", "Dee"].map((n, i) => ({ recordRef: `${tag}-${i}`, givenName: n, familyName: "Test", dateOfBirth: "1970-01-01" })),
  });
  const [ada, ben, cy, dee] = pts.map((p) => p.id);
  await addToWaitlist(ctx, org.id, { patientId: ben!, appointmentType: "diabetes_review", reason: "patient_request", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: ada!, appointmentType: "diabetes_review", reason: "overdue_care", careGap: "HbA1c due", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: cy!, appointmentType: "diabetes_review", reason: "patient_request" }); // no contact preference
  await addToWaitlist(ctx, org.id, { patientId: dee!, appointmentType: "diabetes_review", reason: "patient_request", contactChannel: "phone" });
  const dup = await addToWaitlist(ctx, org.id, { patientId: ada!, appointmentType: "diabetes_review", reason: "overdue_care" });
  assert.equal(dup.duplicate, true, "same patient/type is not listed twice");

  // Stale and malformed slots are rejected; replays are recognised.
  await rejects(ingestSlot(ctx, org.id, { source: "manual", sourceRef: `stale-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(-1), durationMin: 20, offerExpiresAt: inHours(-2) }), 400, /SLOT_STALE/);
  await rejects(ingestSlot(ctx, org.id, { source: "manual", sourceRef: `bad-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(24), durationMin: 20, offerExpiresAt: inHours(30) }), 400, /OFFER_AFTER_START/);
  const slotIn = { source: "manual" as const, sourceRef: `s1-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(26), durationMin: 20, offerExpiresAt: inHours(20) };
  const s1 = await ingestSlot(ctx, org.id, slotIn);
  const s1again = await ingestSlot(ctx, org.id, slotIn);
  assert.equal(s1again.replay, true);
  assert.equal(s1again.workflowId, s1.workflowId);

  // Match: overdue care first, missing contact excluded with a visible reason.
  await applyAction(ctx, s1.workflowId, { action: "match", idempotencyKey: `match-${tag}` });
  let wf = await getWorkflow(ctx, s1.workflowId);
  const ranked = wf!.candidates.filter((c: { rank: number | null }) => c.rank !== null);
  assert.equal(ranked[0].patient_id, ada, "overdue care ranks first");
  assert.ok(wf!.candidates.find((c: { patient_id: string }) => c.patient_id === cy).exclusion_codes.includes("NO_CONTACT_PREFERENCE"));

  // State guards: cannot approve contact or confirm before an offer exists.
  await rejects(applyAction(ctx, s1.workflowId, { action: "approve_contact", idempotencyKey: `early-${tag}` }), 409, /INVALID_TRANSITION/);
  await rejects(applyAction(ctx, s1.workflowId, { action: "confirm_booking", idempotencyKey: `early2-${tag}`, confirmed: true, sourceReference: "x" }), 409, /INVALID_TRANSITION/);

  // Select is idempotent: a double click with the same key acts once.
  const sel = await applyAction(ctx, s1.workflowId, { action: "select", idempotencyKey: `sel-${tag}`, candidateId: ranked[0].id });
  const selAgain = await applyAction(ctx, s1.workflowId, { action: "select", idempotencyKey: `sel-${tag}`, candidateId: ranked[0].id });
  assert.equal(selAgain.replay, true);
  assert.equal(sel.to_state, "OFFER_DRAFTED");
  wf = await getWorkflow(ctx, s1.workflowId);
  assert.match(wf!.offer_text, /Ada/);
  assert.doesNotMatch(wf!.offer_text, /HbA1c/, "care-gap reason never appears in patient text");

  // Shadow mode: approval records that nothing was sent.
  const appr = await applyAction(ctx, s1.workflowId, { action: "approve_contact", idempotencyKey: `appr-${tag}` });
  assert.equal(appr.result_code, "NOT_SENT_SHADOW_MODE");

  // Accepted is not booked: it waits for read-back.
  const acc = await applyAction(ctx, s1.workflowId, { action: "record_response", idempotencyKey: `resp-${tag}`, response: "accepted" });
  assert.equal(acc.to_state, "PENDING_VERIFICATION");
  let m = await accessMetrics(ctx, org.id);
  assert.equal(m.booked_verified, 0, "no booking claimed before read-back");
  assert.equal(m.pending_verification, 1);
  const booked = await applyAction(ctx, s1.workflowId, { action: "confirm_booking", idempotencyKey: `conf-${tag}`, confirmed: true, sourceReference: "Schedule checked by reception" });
  assert.equal(booked.result_code, "BOOKED_VERIFIED");
  m = await accessMetrics(ctx, org.id);
  assert.equal(m.booked_verified, 1);

  // Second slot: a decline returns the patient to the list; a failed read-back is handed off, never "booked".
  const s2 = await ingestSlot(ctx, org.id, { ...slotIn, sourceRef: `s2-${tag}` });
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2-${tag}` });
  wf = await getWorkflow(ctx, s2.workflowId);
  const benCand = wf!.candidates.find((c: { patient_id: string; rank: number | null }) => c.patient_id === ben && c.rank !== null);
  assert.ok(benCand, "Ada is booked; Ben is next");
  await applyAction(ctx, s2.workflowId, { action: "select", idempotencyKey: `s2sel-${tag}`, candidateId: benCand.id });
  await applyAction(ctx, s2.workflowId, { action: "approve_contact", idempotencyKey: `s2ap-${tag}` });
  const dec = await applyAction(ctx, s2.workflowId, { action: "record_response", idempotencyKey: `s2r-${tag}`, response: "declined" });
  assert.equal(dec.to_state, "STAFF_REVIEW");
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2b-${tag}` });
  wf = await getWorkflow(ctx, s2.workflowId);
  const benRow = wf!.candidates.find((c: { patient_id: string }) => c.patient_id === ben);
  assert.ok(benRow.exclusion_codes.includes("DECLINED"), "Ben is not re-offered the slot he declined");
  const { rows: benEntry } = await getPgPool().query(`SELECT status FROM aksh.waitlist_entries WHERE patient_id = $1`, [ben]);
  assert.equal(benEntry[0].status, "waiting", "Ben keeps his place on the waiting list");
  const deeCand = wf!.candidates.find((c: { patient_id: string; rank: number | null }) => c.patient_id === dee && c.rank !== null);
  await applyAction(ctx, s2.workflowId, { action: "select", idempotencyKey: `s2sel2-${tag}`, candidateId: deeCand.id });
  await applyAction(ctx, s2.workflowId, { action: "approve_contact", idempotencyKey: `s2ap2-${tag}` });
  await applyAction(ctx, s2.workflowId, { action: "record_response", idempotencyKey: `s2r2-${tag}`, response: "accepted" });
  const failed = await applyAction(ctx, s2.workflowId, { action: "confirm_booking", idempotencyKey: `s2c-${tag}`, confirmed: false, sourceReference: "Schedule shows slot taken" });
  assert.equal(failed.to_state, "FAILED_SAFE");
  wf = await getWorkflow(ctx, s2.workflowId);
  assert.equal(wf!.handoffs.length, 1, "failed read-back creates a staff hand-off");

  // Isolation and roles.
  const otherAdmin = await user("other", "practice-manager");
  await createOrganisation(otherAdmin, { name: `Other ${tag}`, kind: "clinic" });
  const otherCtx = await loadNetworkContext(otherAdmin.userId, otherAdmin.role);
  assert.equal((await listQueue(otherCtx)).filter((q: { organisation_id: string }) => q.organisation_id === org.id).length, 0, "other organisation sees nothing");
  assert.equal(await getWorkflow(otherCtx, s1.workflowId), null);
  await rejects(applyAction({ ...ctx, role: "patient" }, s1.workflowId, { action: "match", idempotencyKey: `pt-${tag}` }), 403);
  await assert.rejects(getPgPool().query(`DELETE FROM aksh.access_actions WHERE workflow_id = $1`, [s1.workflowId]), /append-only/);

  console.log("access-workflow-db: idempotency, state guards, shadow mode, read-back, decline, failed-safe hand-off, isolation — PASS");
}

run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
