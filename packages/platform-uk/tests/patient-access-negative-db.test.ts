/**
 * Commercial Execution PRD v1.1 §14: the additional Patient Access negative tests, one named case each, against the
 * database. Cases already covered elsewhere are re-asserted here so the PRD list maps to one file.
 * Skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { addToWaitlist, applyAction, getWorkflow, ingestSlot, listHandoffs } from "../lib/access/service";
import { getWeeklyReview, mondayOf } from "../lib/access/weekly-review";
import { FILLED_SQL } from "../lib/access/measurement";
import { adapterEnvironment, authenticate, CONNECTOR_CAPABILITIES, createKey, receiveAppointments, receiveSlots } from "../lib/connector/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

const rejects = (p: Promise<unknown>, status: number, pattern?: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status && (!pattern || pattern.test(e.message)));
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const ranked = async (ctx: Awaited<ReturnType<typeof loadNetworkContext>>, wfId: string) =>
  (await getWorkflow(ctx, wfId))!.candidates as { id: string; patient_id: string; rank: number | null; exclusion_codes: string[] }[];

async function user(label: string) {
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `neg-${label}-${id.slice(0, 8)}@akshhealth.test`]);
  return id;
}

async function run() {
  if (!isPostgresConfigured()) return console.log("patient-access-negative-db: skipped (no DATABASE_URL)");
  await assertNotProductionDatabase(getPgPool(), "patient access negative tests");
  const tag = randomUUID().slice(0, 6);
  const adminId = await user("admin");
  const org = await createOrganisation({ userId: adminId, email: `a-${tag}@akshhealth.test`, displayName: "Admin", role: "practice-manager" }, { name: `Negative ${tag}`, kind: "clinic", locale: { timezone: "UTC" } });
  const adminCtx = await loadNetworkContext(adminId, "practice-manager");
  const inv = await createInvite(adminCtx, org.id, { kind: "staff", role: "nurse" });
  const nurseId = await user("nurse");
  await acceptStaffInvite({ userId: nurseId, email: `n-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { code: inv.code });
  const ctx = await loadNetworkContext(nurseId, "nurse");

  const pts = await importPatients(ctx, org.id, {
    patients: ["Ana", "Bo", "Cai", "Dev", "Eli"].map((n, i) => ({ recordRef: `${tag}-${i}`, givenName: n, familyName: "Neg", dateOfBirth: "1970-01-01" })),
  });
  const [ana, bo, cai, dev, eli] = pts.map((p) => p.id);
  await addToWaitlist(ctx, org.id, { patientId: ana!, appointmentType: "diabetes_review", reason: "overdue_care", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: bo!, appointmentType: "diabetes_review", reason: "patient_request", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: cai!, appointmentType: "diabetes_review", reason: "patient_request" }); // no contact preference
  await addToWaitlist(ctx, org.id, { patientId: dev!, appointmentType: "diabetes_review", reason: "clinician_request", contactChannel: "phone", earliest: inHours(24 * 10).slice(0, 10) });
  await addToWaitlist(ctx, org.id, { patientId: eli!, appointmentType: "diabetes_review", reason: "clinician_request", contactChannel: "sms" });
  const slot = (ref: string, startH = 30, closeH = 24) =>
    ingestSlot(ctx, org.id, { source: "manual", sourceRef: `${ref}-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(startH), durationMin: 20, offerExpiresAt: inHours(closeH) });

  // 1. Duplicate slot event: the same source event is recognised, not a second workflow.
  const s1 = await slot("dup");
  const s1b = await slot("dup");
  assert.equal(s1b.replay, true);
  assert.equal(s1b.workflowId, s1.workflowId);

  // 2. Expired slot: an event whose offer window has already closed is refused.
  await rejects(slot("expired", 1, -1), 400, /OFFER_WINDOW_CLOSED/);

  // 3. Missing contact preference and 4. overlapping constraints (earliest date): listed with reasons, not offered.
  await applyAction(ctx, s1.workflowId, { action: "match", idempotencyKey: `m1-${tag}` });
  let c = await ranked(ctx, s1.workflowId);
  assert.ok(c.find((x) => x.patient_id === cai)!.exclusion_codes.includes("NO_CONTACT_PREFERENCE"));
  assert.ok(c.find((x) => x.patient_id === dev)!.exclusion_codes.includes("BEFORE_EARLIEST_DATE"));

  // 5. Retry after timeout: the same idempotency key acts once.
  const top = c.filter((x) => x.rank !== null).sort((a, b) => a.rank! - b.rank!)[0]!;
  assert.equal(top.patient_id, ana);
  await applyAction(ctx, s1.workflowId, { action: "select", idempotencyKey: `sel-${tag}`, candidateId: top.id });
  const again = await applyAction(ctx, s1.workflowId, { action: "select", idempotencyKey: `sel-${tag}`, candidateId: top.id });
  assert.equal(again.replay, true);
  const selects = await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.access_actions WHERE workflow_id = $1 AND action_type = 'select'`, [s1.workflowId]);
  assert.equal(selects.rows[0].n, 1, "one logical action");

  // 6. Same patient offered multiple slots: while Ana holds a live offer she is not offered a second slot.
  const s2 = await slot("second");
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2-${tag}` });
  // Her entry is "offered", so she is not a candidate at all (another appointment type would show ALREADY_HOLDS_OFFER).
  const anaOnS2 = (await ranked(ctx, s2.workflowId)).find((x) => x.patient_id === ana);
  assert.ok(!anaOnS2 || anaOnS2.rank === null, "not offered a second slot while holding one");

  // 7. Opt-out: "asked to stop" stops every future offer to that patient, and is counted.
  await applyAction(ctx, s1.workflowId, { action: "approve_contact", idempotencyKey: `ap-${tag}` });
  const optOut = await applyAction(ctx, s1.workflowId, { action: "record_response", idempotencyKey: `stop-${tag}`, response: "opted_out" });
  assert.equal(optOut.result_code, "OPTED_OUT");
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2b-${tag}` });
  assert.ok((await ranked(ctx, s2.workflowId)).find((x) => x.patient_id === ana)!.exclusion_codes.includes("OPTED_OUT"), "suppression applied before any outreach");

  // 8. Unreachable: recorded, the patient keeps their place, and is not offered the same slot again.
  c = await ranked(ctx, s2.workflowId);
  const boCand = c.find((x) => x.patient_id === bo && x.rank !== null)!;
  await applyAction(ctx, s2.workflowId, { action: "select", idempotencyKey: `s2sel-${tag}`, candidateId: boCand.id });
  await applyAction(ctx, s2.workflowId, { action: "approve_contact", idempotencyKey: `s2ap-${tag}` });
  const unr = await applyAction(ctx, s2.workflowId, { action: "record_response", idempotencyKey: `s2r-${tag}`, response: "unreachable" });
  assert.equal(unr.result_code, "UNREACHABLE");
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2c-${tag}` });
  assert.ok((await ranked(ctx, s2.workflowId)).find((x) => x.patient_id === bo)!.exclusion_codes.includes("UNREACHABLE"));
  assert.equal((await getPgPool().query(`SELECT status FROM aksh.waitlist_entries WHERE patient_id = $1`, [bo])).rows[0].status, "waiting");

  // 9. Escalated during contact: goes to a named hand-off queue with a due time; nothing disappears.
  const eliCand = (await ranked(ctx, s2.workflowId)).find((x) => x.patient_id === eli && x.rank !== null)!;
  await applyAction(ctx, s2.workflowId, { action: "select", idempotencyKey: `s2sel2-${tag}`, candidateId: eliCand.id });
  await applyAction(ctx, s2.workflowId, { action: "approve_contact", idempotencyKey: `s2ap2-${tag}` });
  const esc = await applyAction(ctx, s2.workflowId, { action: "record_response", idempotencyKey: `s2esc-${tag}`, response: "escalated" });
  assert.equal(esc.to_state, "HANDOFF");
  const ho = (await listHandoffs(ctx)).filter((h: { workflow_id: string }) => h.workflow_id === s2.workflowId);
  assert.equal(ho.length, 1);
  assert.equal(ho[0].reason, "Escalated during contact");

  // 10. Write acknowledged but read-back fails: never booked, a person resolves it.
  const s3 = await slot("readback");
  await applyAction(ctx, s3.workflowId, { action: "match", idempotencyKey: `m3-${tag}` });
  const s3c = (await ranked(ctx, s3.workflowId)).find((x) => x.rank !== null)!;
  await applyAction(ctx, s3.workflowId, { action: "select", idempotencyKey: `s3sel-${tag}`, candidateId: s3c.id });
  await applyAction(ctx, s3.workflowId, { action: "approve_contact", idempotencyKey: `s3ap-${tag}` });
  await applyAction(ctx, s3.workflowId, { action: "record_response", idempotencyKey: `s3r-${tag}`, response: "accepted" });
  const failed = await applyAction(ctx, s3.workflowId, { action: "confirm_booking", idempotencyKey: `s3c-${tag}`, confirmed: false, sourceReference: "Not in schedule" });
  assert.equal(failed.to_state, "FAILED_SAFE");
  const booked = await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id WHERE w.id = $1 AND ${FILLED_SQL}`, [s3.workflowId]);
  assert.equal(booked.rows[0].n, 0, "not counted as filled");

  // 11. Denied staff role: a patient account cannot act on the queue.
  await rejects(applyAction({ ...ctx, role: "patient" }, s3.workflowId, { action: "match", idempotencyKey: `pt-${tag}` }), 403);

  // 12. Out-of-order event and 13. stale availability, through the schedule connector.
  const created = await createKey(adminCtx, org.id, { name: "Schedule" });
  const key = await authenticate(`Bearer ${created.key}`);
  const free = (version: number, status = "free") => ({ slots: [{ id: `C-${tag}`, version, status, appointmentType: "diabetes_review", start: inHours(40), durationMin: 20 }] });
  assert.equal((await receiveSlots(key, free(2))).results[0]!.result, "ACCEPTED");
  const late = (await receiveSlots(key, free(1))).results[0]!;
  assert.equal(late.result, "STALE_VERSION_IGNORED", "an older version arriving late is ignored");
  assert.equal((await receiveSlots(key, free(3, "busy"))).results[0]!.result, "WITHDRAWN", "taken before anyone was offered it: withdrawn");

  // 14. Unknown identity: a booking without the patient's record number is reported, not guessed.
  const ap = await receiveAppointments(key, { appointments: [{ id: `A-${tag}`, status: "booked", slotId: `${s1.workflowId}` }] });
  assert.notEqual(ap.results[0]!.result, "BOOKED_VERIFIED");

  // 15. Source-mode honesty: connections declare a read-only environment and deny every write capability.
  assert.equal(adapterEnvironment({ AKSH_ENVIRONMENT: "simulation" }), "sandbox");
  assert.equal(adapterEnvironment({ AKSH_ENVIRONMENT: "production" }), "production-read-only");
  for (const cap of ["book", "amend", "cancel", "stage", "write"] as const) assert.equal(CONNECTOR_CAPABILITIES[cap], false, `${cap} denied`);

  // 16. Simulation slots never enter the measured denominator; 17. guardrails are reported.
  await ingestSlot(ctx, org.id, { source: "simulation", sourceRef: `sim-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(30), durationMin: 20, offerExpiresAt: inHours(24) }).catch(() => undefined);
  const rep = await getWeeklyReview(ctx, org.id, mondayOf(new Date().toISOString().slice(0, 10)));
  const realSlots = await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.access_slots WHERE organisation_id = $1 AND source <> 'simulation'`, [org.id]);
  assert.equal(rep.funnel.received, realSlots.rows[0].n, "simulation slots excluded");
  assert.equal(rep.guardrails.bookingIssues, 1);
  assert.equal(rep.guardrails.bookingChecks, 1);
  assert.equal(rep.guardrails.bookingIssuesPer100, 100);
  assert.equal(rep.guardrails.duplicateBookings, 0);
  assert.equal(rep.guardrails.optOutsRecorded, 1);
  assert.equal(rep.responses.unreachable, 1);
  assert.equal(rep.responses.escalated, 1);

  console.log("patient-access-negative-db: PRD v1.1 §14 cases (duplicate, expired, constraints, retry, multiple offers, opt-out, unreachable, escalation, read-back failure, role, out-of-order, stale, identity, adapter honesty, denominator, guardrails) — PASS");
}

run().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
