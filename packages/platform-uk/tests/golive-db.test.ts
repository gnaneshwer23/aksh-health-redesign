/**
 * Go-live and registration checks against the real database: the full path from sandbox to live (read-only), and every
 * guard on the way. Writes only test accounts on akshhealth.test; go-live and registration rows are append-only.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { addToWaitlist } from "../lib/access/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertSeedingAllowed } from "../lib/env/deployment";
import {
  approveGoLive,
  getGoLive,
  getReview,
  listReviewQueue,
  requestReview,
  returnGoLive,
  reviewItem,
  submitEvidence,
} from "../lib/golive/service";
import { updateOrganisation } from "../lib/network/admin";
import { loadNetworkContext } from "../lib/network/context";
import { withTenant } from "../lib/network/db";
import { recordRegistrationCheck, recordRegistrationCheckAsPlatform, registrationCheckSchema } from "../lib/network/registration";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

async function makeUser(label: string, role: string) {
  const id = randomUUID();
  const email = `golive-${label}-${id.slice(0, 8)}@akshhealth.test`;
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, email]);
  return { userId: id, email, displayName: `Test ${label}`, role };
}

async function rejects(p: Promise<unknown>, status: number, match?: RegExp) {
  await assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status && (!match || match.test(e.message)));
}

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

async function run() {
  if (!isPostgresConfigured()) return console.log("golive-db: skipped (no DATABASE_URL)");
  assertSeedingAllowed("golive-db"); // creates and approves test organisations: never against production
  const run = randomUUID().slice(0, 6);

  // A clinic whose creator is a GP (licensed: starts unverified), plus a nurse and a non-clinical manager.
  const gp = await makeUser("gp", "gp");
  const org = await createOrganisation(gp, { name: `Go-live Clinic ${run}`, kind: "clinic" });
  let gpCtx = await loadNetworkContext(gp.userId, gp.role);
  const nurse = await makeUser("nurse", "nurse");
  await acceptStaffInvite(nurse, { code: (await createInvite(gpCtx, org.id, { kind: "staff", role: "nurse" })).code });
  const manager = await makeUser("manager", "practice-manager");
  await acceptStaffInvite(manager, { code: (await createInvite(gpCtx, org.id, { kind: "staff", role: "practice-manager", isAdmin: true })).code });
  const managerCtx = await loadNetworkContext(manager.userId, manager.role);
  const nurseCtx = await loadNetworkContext(nurse.userId, nurse.role);
  const members = (await getPgPool().query<{ id: string; user_id: string; registration_status: string }>(`SELECT id, user_id, registration_status FROM aksh.memberships WHERE organisation_id = $1`, [org.id])).rows;
  const mid = (u: { userId: string }) => members.find((m) => m.user_id === u.userId)!.id;
  assert.equal(members.find((m) => m.user_id === gp.userId)!.registration_status, "unverified", "a GP who creates an organisation still needs a registration check");

  // Platform admin: a separate person.
  const reviewer = await makeUser("reviewer", "practice-manager");
  await getPgPool().query(`INSERT INTO aksh.platform_admins (user_id, granted_by) VALUES ($1, 'test')`, [reviewer.userId]);
  try {

  // --- registration checks
  await rejects(recordRegistrationCheck(gpCtx, org.id, mid(gp), { outcome: "verified", registry: "Medical register", registrationNumber: "GP-1", checkedOn: today }), 403, /SELF_CHECK/);
  await rejects(recordRegistrationCheck(nurseCtx, org.id, mid(gp), { outcome: "verified", registry: "Medical register", registrationNumber: "GP-1", checkedOn: today }), 403);
  await rejects(recordRegistrationCheck(managerCtx, org.id, mid(nurse), { outcome: "not_applicable", checkedOn: today }), 400);
  await recordRegistrationCheck(managerCtx, org.id, mid(gp), { outcome: "verified", registry: "Medical register", registrationNumber: "GP-1", checkedOn: today, evidenceRef: "register search result" });
  await recordRegistrationCheck(gpCtx, org.id, mid(nurse), { outcome: "verified", registry: "Nursing register", registrationNumber: "RN-2", checkedOn: today });
  await recordRegistrationCheck(gpCtx, org.id, mid(manager), { outcome: "not_applicable", checkedOn: today });

  // Database guards hold even if application checks were bypassed.
  await assert.rejects(
    withTenant(nurseCtx, (c) => c.query(`INSERT INTO aksh.registration_checks (organisation_id, membership_id, outcome, registry, registration_number, checked_on, checked_by, checked_by_kind, environment) VALUES ($1, $2, 'verified', 'x', 'y', $3, $4, 'org_admin', 'test')`, [org.id, mid(nurse), today, nurse.userId])),
    /SELF_CHECK/
  );
  const freshNurse = await makeUser("nurse2", "nurse");
  await acceptStaffInvite(freshNurse, { code: (await createInvite(gpCtx, org.id, { kind: "staff", role: "nurse" })).code });
  const freshId = (await getPgPool().query(`SELECT id FROM aksh.memberships WHERE user_id = $1`, [freshNurse.userId])).rows[0].id;
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`UPDATE aksh.memberships SET registration_status = 'verified' WHERE id = $1`, [freshId])), /REGISTRATION_STATUS/);
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`UPDATE aksh.organisations SET status = 'live' WHERE id = $1`, [org.id])), /STATUS_CHANGE/);
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`UPDATE aksh.registration_checks SET outcome = 'rejected' WHERE organisation_id = $1`, [org.id])), /append-only|permission denied/);
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`INSERT INTO aksh.golive_events (organisation_id, action, actor_user_id, actor_kind, environment) VALUES ($1, 'approved', $2, 'platform_admin', 'test')`, [org.id, gp.userId])), /row-level security/);
  await assert.rejects(withTenant(gpCtx, (c) => c.query(`SELECT 1 FROM aksh.platform_admins`)), /permission denied/);

  // --- checklist: not ready yet
  let s = await getGoLive(gpCtx, org.id);
  assert.equal(s.canRequest, false);
  assert.equal(s.autos.find((a) => a.key === "staff_verified")!.ok, false, "the new nurse is unchecked");
  await rejects(requestReview(gpCtx, org.id), 409, /NOT_READY/);
  await rejects(submitEvidence(nurseCtx, org.id, "dpa", {}), 403);
  await rejects(submitEvidence(gpCtx, org.id, "dpia", { completedOn: today, reference: "DPIA-1", residualRisk: "high" }), 400, /High residual risk/);
  await rejects(submitEvidence(gpCtx, org.id, "baseline", { periodStart: daysAgo(10), periodEnd: today, freedSlots: 10, filledSlots: 2, method: "Phone list" }), 400, /four weeks/);
  await rejects(submitEvidence(gpCtx, org.id, "safety_lead", { membershipId: freshId }), 400, /registration/);

  // Make it ready.
  await recordRegistrationCheck(gpCtx, org.id, freshId, { outcome: "verified", registry: "Nursing register", registrationNumber: "RN-3", checkedOn: today });
  gpCtx = await loadNetworkContext(gp.userId, gp.role);
  await updateOrganisation(gpCtx, org.id, { locale: { timezone: "Europe/Berlin", emergencyNumber: "112" } });
  const imported = await importPatients(gpCtx, org.id, { patients: [{ recordRef: `GL-${run}`, givenName: "Ada", familyName: "Example", dateOfBirth: "1960-01-01" }] } as never);
  await addToWaitlist(gpCtx, org.id, { patientId: (imported as unknown as { id: string }[])[0]!.id, appointmentType: "foot_check", reason: "overdue_care", contactChannel: "sms" } as never);
  const evidence: Record<string, unknown> = {
    dpa: { signedOn: today, signatoryName: "A Director", signatoryRole: "Director", documentRef: "DPA v1" },
    dpia: { completedOn: today, reference: "DPIA-1", residualRisk: "low" },
    safety_lead: { membershipId: mid(gp) },
    contact_channel: { channel: "sms", senderName: "Clinic", optOutWording: "Reply STOP to stop these messages." },
    baseline: { periodStart: daysAgo(40), periodEnd: daysAgo(2), freedSlots: 30, filledSlots: 9, method: "Reception phones the list" },
  };
  for (const [key, value] of Object.entries(evidence)) s = await submitEvidence(gpCtx, org.id, key, value);
  assert.equal(s.items.find((i) => i.key === "safety_lead")!.evidence!.registrationNumber, "GP-1", "safety lead evidence snapshots the checked registration");
  assert.equal(s.canRequest, true, `ready: ${s.blockers.join("; ")}`);
  s = await requestReview(gpCtx, org.id);
  assert.equal(s.org.status, "onboarding");

  // --- platform review
  await rejects(listReviewQueue(gp.userId), 404, /Not found/);
  const queue = await listReviewQueue(reviewer.userId);
  assert.ok(queue.some((q) => q.id === org.id && q.status === "onboarding"));
  await rejects(submitEvidence(gpCtx, org.id, "contact_channel", evidence.contact_channel), 409, /UNDER_REVIEW/);
  await rejects(submitEvidence(gpCtx, org.id, "dpa", { ...(evidence.dpa as object), signedOn: "2026-02-31" }), 400, /real date/);
  assert.equal(registrationCheckSchema.safeParse({ outcome: "verified", registry: "Nursing register", registrationNumber: "RN-2", checkedOn: "2026-02-30" }).success, false, "impossible dates are rejected");
  const na = registrationCheckSchema.parse({ outcome: "not_applicable", registry: "left over", registrationNumber: "XX-1", checkedOn: today });
  assert.equal(na.registry, undefined, "not applicable carries no register details");
  // A platform admin who is a member cannot review their own organisation.
  await getPgPool().query(`INSERT INTO aksh.platform_admins (user_id, granted_by) VALUES ($1, 'test')`, [manager.userId]);
  await rejects(getReview(manager.userId, org.id), 403, /CONFLICT_OF_INTEREST/);
  await rejects(approveGoLive(reviewer.userId, org.id), 409, /not accepted/);
  await rejects(reviewItem(reviewer.userId, org.id, "dpa", { decision: "rejected" }), 400);
  await reviewItem(reviewer.userId, org.id, "dpa", { decision: "rejected", note: "Attach the signed copy reference" });
  await submitEvidence(gpCtx, org.id, "dpa", { signedOn: today, signatoryName: "A Director", signatoryRole: "Director", documentRef: "DPA v1 signed copy" });
  for (const key of Object.keys(evidence)) await reviewItem(reviewer.userId, org.id, key, { decision: "accepted" });
  await rejects(submitEvidence(gpCtx, org.id, "baseline", evidence.baseline), 409, /BASELINE_LOCKED/);

  // Return, then request again and approve.
  await rejects(returnGoLive(reviewer.userId, org.id), 400);
  s = await returnGoLive(reviewer.userId, org.id, "Confirm the contact hours");
  assert.equal(s.org.status, "sandbox");
  s = await requestReview(gpCtx, org.id);
  s = await approveGoLive(reviewer.userId, org.id, "All evidence accepted");
  assert.equal(s.org.status, "live_read_only");
  assert.ok(s.org.verifiedAt);
  await rejects(submitEvidence(gpCtx, org.id, "dpa", evidence.dpa), 409, /live/);
  const actions = s.events.map((e) => e.action);
  for (const a of ["submitted", "rejected", "accepted", "requested", "returned", "approved"]) assert.ok(actions.includes(a as never), `history records ${a}`);
  await assert.rejects(getPgPool().query(`DELETE FROM aksh.golive_events WHERE organisation_id = $1`, [org.id]), /append-only/);
  // 027: the database itself refuses tenant evidence once live.
  await assert.rejects(
    withTenant(gpCtx, (c) => c.query(`INSERT INTO aksh.golive_events (organisation_id, item_key, action, evidence, actor_user_id, actor_kind, environment) VALUES ($1, 'dpa', 'submitted', '{}'::jsonb, $2, 'org_admin', 'test')`, [org.id, gp.userId])),
    /GOLIVE_CLOSED/
  );
  // Only an explicit purge (test-data cleanup) may remove append-only history.
  const purge = await getPgPool().connect();
  try {
    await purge.query("BEGIN");
    await purge.query("SET LOCAL aksh.purge_test_data = 'on'");
    const removed = await purge.query(`DELETE FROM aksh.registration_checks WHERE organisation_id = $1`, [org.id]);
    assert.ok((removed.rowCount ?? 0) > 0, "purge removes history");
    await purge.query("ROLLBACK");
  } finally {
    purge.release();
  }

  // Platform admin can check a registration when no one else in the organisation can.
  const solo = await makeUser("solo", "gp");
  const soloOrg = await createOrganisation(solo, { name: `Solo ${run}`, kind: "clinic" });
  const soloMember = (await getPgPool().query(`SELECT id FROM aksh.memberships WHERE organisation_id = $1`, [soloOrg.id])).rows[0].id;
  await recordRegistrationCheckAsPlatform(reviewer.userId, soloOrg.id, soloMember, { outcome: "verified", registry: "Medical register", registrationNumber: "GP-9", checkedOn: today });
  assert.equal((await getPgPool().query(`SELECT registration_status FROM aksh.memberships WHERE id = $1`, [soloMember])).rows[0].registration_status, "verified");

  } finally {
    // Revoke test reviewer rights even when an assertion above failed.
    await getPgPool().query(`DELETE FROM aksh.platform_admins WHERE user_id = ANY($1)`, [[reviewer.userId, manager.userId]]);
  }
  console.log("golive-db: registration checks, guards, checklist, review, return, approval, append-only history — PASS");
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
