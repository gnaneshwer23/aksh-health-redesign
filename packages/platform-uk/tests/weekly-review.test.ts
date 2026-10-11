/**
 * Week 12 pilot weekly review: week arithmetic and discussion prompts (pure), then against the database the funnel,
 * staff decisions (top-ranked or not), read-back failures, hand-offs, sign-off rules (admins only, complete weeks
 * only, frozen figures, append-only addenda) and organisation isolation. DB part skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { addToWaitlist, applyAction, getWorkflow, ingestSlot } from "../lib/access/service";
import { getWeeklyReview, lastCompleteWeek, listSignOffs, mondayOf, parseWeekStart, reviewPrompts, signOffWeek, type WeeklyReview } from "../lib/access/weekly-review";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

const rejects = (p: Promise<unknown>, status: number, pattern?: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status && (!pattern || pattern.test(e.message)));

function pure() {
  assert.equal(mondayOf("2026-10-11"), "2026-10-05", "Sunday belongs to the week starting the previous Monday");
  assert.equal(mondayOf("2026-10-05"), "2026-10-05");
  assert.equal(mondayOf("2026-01-01"), "2025-12-29", "weeks cross year ends");
  // 23:30 UTC Sunday is already Monday in Auckland: the last complete week moves on there first.
  const now = new Date("2026-10-11T23:30:00Z");
  assert.equal(lastCompleteWeek(now, "UTC"), "2026-09-28");
  assert.equal(lastCompleteWeek(now, "Pacific/Auckland"), "2026-10-05");
  assert.equal(parseWeekStart(null, now, "UTC"), "2026-09-28");
  assert.throws(() => parseWeekStart("2026-10-06", now, "UTC"), /Monday/);
  assert.throws(() => parseWeekStart("2026-02-30", now, "UTC"), /YYYY-MM-DD/);
  assert.throws(() => parseWeekStart("2026-10-12", now, "UTC"), /not started/);

  const base: Pick<WeeklyReview, "funnel" | "fill" | "staff" | "handoffs" | "connector" | "dataGaps" | "week"> = {
    week: { start: "2026-09-28", end: "2026-10-05", complete: true, mode: "live_shadow" },
    funnel: { received: 12, withdrawn: 0, eligible: 12, ranked: 10, noCandidates: 2, offered: 9, contactApproved: 9, accepted: 6, filled: 5, bookedOutsideMetric: 0, expired: 1, failedSafe: 0, handedOff: 0, stillOpen: 0 },
    fill: { ratePct: 41.7, ci95: [19.3, 68], baselinePct: 30, previousWeekPct: 40 },
    staff: { selections: 9, tookTopRanked: 9, choseOther: 0, notRecorded: 0, skips: 0, skipReasons: [], offersEdited: 0, deferrals: 0 },
    handoffs: { created: 0, urgent: 0, soon: 0, routine: 0, closed: 0, openOverdue: 0, acknowledgedLate: 0 },
    connector: { events: 0, byResult: [] },
    dataGaps: { missingFields: [], exclusions: [] },
  };
  assert.deepEqual(reviewPrompts(base), [`1 slot expired before anyone was booked.`]);
  const busy = reviewPrompts({
    ...base,
    funnel: { ...base.funnel, failedSafe: 2, eligible: 0, stillOpen: 1 },
    staff: { ...base.staff, choseOther: 1 },
    handoffs: { ...base.handoffs, openOverdue: 1 },
    connector: { events: 3, byResult: [{ result: "STALE_VERSION_IGNORED", count: 2 }, { result: "ACCEPTED", count: 1 }] },
    week: { ...base.week, complete: false },
  });
  assert.match(busy[0]!, /2 bookings were not found on read-back/, "read-back failures come first");
  assert.match(busy[1]!, /1 hand-off is open past the due time/);
  assert.ok(busy.some((p) => /No slots were received/.test(p)));
  assert.ok(busy.some((p) => /someone other than the top-ranked patient 1 time\./.test(p)));
  assert.ok(busy.some((p) => /2 schedule messages were rejected or ignored/.test(p)), "only non-success connector results count");
  assert.ok(busy.some((p) => /not over/.test(p)));
  const swing = reviewPrompts({ ...base, fill: { ...base.fill, ratePct: 60, previousWeekPct: 40 } });
  assert.ok(swing.some((p) => /rose 20 points/.test(p)));
  console.log("weekly-review: week arithmetic and prompts — PASS");
}

async function user(label: string, role: string) {
  const id = randomUUID();
  const email = `wr-${label}-${id.slice(0, 8)}@akshhealth.test`;
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, email]);
  return { userId: id, email, displayName: `Test ${label}`, role };
}
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

async function db() {
  if (!isPostgresConfigured()) return console.log("weekly-review: DB part skipped (no DATABASE_URL)");
  await assertNotProductionDatabase(getPgPool(), "weekly review test");
  const tag = randomUUID().slice(0, 6);
  const admin = await user("admin", "practice-manager");
  const org = await createOrganisation(admin, { name: `Review Clinic ${tag}`, kind: "clinic", region: "Europe", locale: { timezone: "UTC" } });
  const adminCtx = await loadNetworkContext(admin.userId, admin.role);
  const inv = await createInvite(adminCtx, org.id, { kind: "staff", role: "nurse" });
  const nurse = await user("nurse", "nurse");
  await acceptStaffInvite(nurse, { code: inv.code });
  const ctx = await loadNetworkContext(nurse.userId, nurse.role);

  const pts = await importPatients(ctx, org.id, {
    patients: ["Ada", "Ben", "Cy"].map((n, i) => ({ recordRef: `${tag}-${i}`, givenName: n, familyName: "Review", dateOfBirth: "1970-01-01" })),
  });
  const [ada, ben, cy] = pts.map((p) => p.id);
  await addToWaitlist(ctx, org.id, { patientId: ada!, appointmentType: "diabetes_review", reason: "overdue_care", careGap: "HbA1c due", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: ben!, appointmentType: "diabetes_review", reason: "patient_request", contactChannel: "sms" });
  await addToWaitlist(ctx, org.id, { patientId: cy!, appointmentType: "diabetes_review", reason: "patient_request" }); // no contact preference

  const slot = (ref: string) => ingestSlot(ctx, org.id, { source: "manual", sourceRef: `${ref}-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(26), durationMin: 20, offerExpiresAt: inHours(20) });
  const ranked = async (workflowId: string) =>
    (await getWorkflow(ctx, workflowId))!.candidates.filter((c: { rank: number | null }) => c.rank !== null).sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank);

  // Slot 1: staff take the top-ranked patient; booked and verified.
  const s1 = await slot("s1");
  await applyAction(ctx, s1.workflowId, { action: "match", idempotencyKey: `m1-${tag}` });
  const r1 = await ranked(s1.workflowId);
  await applyAction(ctx, s1.workflowId, { action: "select", idempotencyKey: `sel1-${tag}`, candidateId: r1[0].id });
  await applyAction(ctx, s1.workflowId, { action: "approve_contact", idempotencyKey: `ap1-${tag}` });
  await applyAction(ctx, s1.workflowId, { action: "record_response", idempotencyKey: `rr1-${tag}`, response: "accepted" });
  await applyAction(ctx, s1.workflowId, { action: "confirm_booking", idempotencyKey: `cb1-${tag}`, confirmed: true, sourceReference: "Schedule checked" });

  // Slot 2: staff skip the top patient, then the read-back fails (hand-off, never counted as filled).
  const s2 = await slot("s2");
  await applyAction(ctx, s2.workflowId, { action: "match", idempotencyKey: `m2-${tag}` });
  const r2 = await ranked(s2.workflowId);
  assert.equal(r2.length, 1, "Ada is booked; Ben is the only ranked candidate left");
  await applyAction(ctx, s2.workflowId, { action: "skip", idempotencyKey: `sk2-${tag}`, candidateId: r2[0].id, reason: "Asked not to be called this week" });
  await applyAction(ctx, s2.workflowId, { action: "handoff", idempotencyKey: `ho2-${tag}`, reason: "No one left to offer", priority: "urgent" });

  // Slot 3: a second ranked patient exists only if we add one; offer Ben after Dee is added and ranked above him.
  const [dee] = (await importPatients(ctx, org.id, { patients: [{ recordRef: `${tag}-d`, givenName: "Dee", familyName: "Review", dateOfBirth: "1970-01-01" }] })).map((p) => p.id);
  await addToWaitlist(ctx, org.id, { patientId: dee!, appointmentType: "diabetes_review", reason: "overdue_care", careGap: "Foot check due", contactChannel: "phone" });
  const s3 = await slot("s3");
  await applyAction(ctx, s3.workflowId, { action: "match", idempotencyKey: `m3-${tag}` });
  const r3 = await ranked(s3.workflowId);
  assert.ok(r3.length >= 2);
  const notTop = r3.find((c: { patient_id: string }) => c.patient_id === ben) ?? r3[1];
  await applyAction(ctx, s3.workflowId, { action: "select", idempotencyKey: `sel3-${tag}`, candidateId: notTop.id });
  await applyAction(ctx, s3.workflowId, { action: "approve_contact", idempotencyKey: `ap3-${tag}` });
  await applyAction(ctx, s3.workflowId, { action: "record_response", idempotencyKey: `rr3-${tag}`, response: "accepted" });
  await applyAction(ctx, s3.workflowId, { action: "confirm_booking", idempotencyKey: `cb3-${tag}`, confirmed: false, sourceReference: "Slot taken in schedule" });

  const thisWeek = mondayOf(new Date().toISOString().slice(0, 10));
  const rep = await getWeeklyReview(ctx, org.id, thisWeek);
  assert.equal(rep.week.complete, false);
  assert.equal(rep.week.mode, "rehearsal", "not live yet");
  assert.equal(rep.funnel.received, 3);
  assert.equal(rep.funnel.eligible, 3);
  assert.equal(rep.funnel.filled, 1);
  assert.equal(rep.fill.ratePct, 33.3);
  assert.equal(rep.funnel.offered, 2);
  assert.equal(rep.funnel.accepted, 2);
  assert.equal(rep.funnel.failedSafe, 1);
  assert.equal(rep.funnel.handedOff, 2, "the manual hand-off and the read-back failure");
  assert.equal(rep.staff.selections, 2);
  assert.equal(rep.staff.tookTopRanked, 1);
  assert.equal(rep.staff.choseOther, 1);
  assert.equal(rep.staff.skips, 1);
  assert.deepEqual(rep.staff.skipReasons, [{ reason: "Asked not to be called this week", count: 1 }]);
  assert.equal(rep.handoffs.created, 2);
  assert.equal(rep.handoffs.urgent, 1);
  assert.equal(rep.handoffs.soon, 1);
  assert.ok(rep.dataGaps.exclusions.some((e) => e.code === "NO_CONTACT_PREFERENCE"));
  assert.ok(rep.timeliness.medianMinutesToOffer !== null && rep.timeliness.medianMinutesToOffer >= 0);
  assert.ok(rep.timeliness.medianHoursBookedBeforeStart! > 20);
  assert.match(rep.prompts[0]!, /not found on read-back/);
  assert.ok(rep.prompts.some((p) => /not over/.test(p)));

  // Sign-off: not before the week ends; admins only; figures frozen; corrections are addenda.
  await rejects(signOffWeek(adminCtx, org.id, { weekStart: thisWeek, summary: "Too soon" }), 409, /WEEK_NOT_OVER/);
  const lastWeek = lastCompleteWeek(new Date(), "UTC");
  await rejects(signOffWeek(ctx, org.id, { weekStart: lastWeek, summary: "Nurse cannot sign" }), 403);
  await rejects(signOffWeek(adminCtx, org.id, { weekStart: lastWeek, summary: "   " }), 400, /SUMMARY_REQUIRED/);
  const signed = await signOffWeek(adminCtx, org.id, { weekStart: lastWeek, summary: "Quiet week before go-live.", actionsAgreed: "Connect the schedule", attendees: "Practice manager, Aksh" });
  assert.equal(signed.report.week.start, lastWeek);
  await signOffWeek(adminCtx, org.id, { weekStart: lastWeek, summary: "Addendum: schedule connected on Friday." });
  const signOffs = await listSignOffs(ctx, org.id, lastWeek);
  assert.equal(signOffs.length, 2, "the nurse can read sign-offs; an addendum keeps the original");
  assert.equal(signOffs[1]!.summary, "Quiet week before go-live.");
  assert.equal(signOffs[1]!.reviewedBy, admin.userId);
  assert.equal(signOffs[1]!.snapshot.reportVersion, "pilot-weekly-review-v1");
  await assert.rejects(getPgPool().query(`UPDATE aksh.pilot_weekly_reviews SET summary = 'changed' WHERE organisation_id = $1`, [org.id]), /append-only/);
  const audits = await getPgPool().query(`SELECT count(*)::int AS n FROM aksh.network_audit_events WHERE organisation_id = $1 AND action = 'pilot.weekly_review_signed'`, [org.id]);
  assert.equal(audits.rows[0].n, 2);

  // Isolation: another organisation cannot read or sign this one's review.
  const other = await user("other", "practice-manager");
  await createOrganisation(other, { name: `Other ${tag}`, kind: "clinic" });
  const otherCtx = await loadNetworkContext(other.userId, other.role);
  await rejects(getWeeklyReview(otherCtx, org.id), 403);
  await rejects(listSignOffs(otherCtx, org.id), 403);
  await rejects(signOffWeek({ ...otherCtx, adminOrgIds: [org.id] }, org.id, { weekStart: lastWeek, summary: "forged" }), 403);
  await rejects(getWeeklyReview(ctx, org.id, "2026-10-06"), 400, /Monday/);

  console.log("weekly-review: funnel, staff decisions, read-back failure, hand-offs, sign-off rules, append-only, isolation — PASS");
}

pure();
db().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
