/**
 * Real workspace: what production shows. Pure routing rules (who may open which page, where everything else goes),
 * then against the database the Today counts and the next setup step. DB part skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { addToWaitlist, applyAction, ingestSlot } from "../lib/access/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { isRealWorkspace, REAL_ROLES, realHomeFor, realWorkspaceRedirect } from "../lib/env/workspace";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients } from "../lib/network/service";
import { getToday } from "../lib/workspace/today";

function pure() {
  assert.equal(isRealWorkspace({ AKSH_ENVIRONMENT: "production" }), true, "production is always real");
  assert.equal(isRealWorkspace({ AKSH_ENVIRONMENT: "production", AKSH_REAL_WORKSPACE: "false" }), true, "and cannot opt back into demo");
  assert.equal(isRealWorkspace({ AKSH_ENVIRONMENT: "simulation" }), false);
  assert.equal(isRealWorkspace({ AKSH_ENVIRONMENT: "simulation", AKSH_REAL_WORKSPACE: "true" }), true, "rehearse production elsewhere");
  assert.equal(isRealWorkspace({}), false);

  // Staff: the real pages pass; every demo surface goes to Today.
  for (const ok of ["/dashboard/today", "/dashboard/access", "/dashboard/access/review", "/dashboard/network", "/dashboard/organisation", "/dashboard/security", "/dashboard/platform"]) {
    assert.equal(realWorkspaceRedirect(ok, "practice-manager"), null, ok);
  }
  for (const demo of ["/dashboard", "/dashboard/gp", "/dashboard/gp/patients", "/dashboard/admin", "/dashboard/admin/integrations", "/dashboard/front-desk", "/dashboard/ics", "/dashboard/hospital", "/dashboard/nurse/alerts", "/review", "/cases/1", "/intake", "/workspace"]) {
    assert.equal(realWorkspaceRedirect(demo, "gp"), "/dashboard/today", demo);
  }
  assert.equal(realWorkspaceRedirect("/dashboard/today-ish", "gp"), "/dashboard/today", "prefixes match whole segments");
  // CGM monitoring is for clinicians only.
  assert.equal(realWorkspaceRedirect("/dashboard/monitoring", "nurse"), null);
  assert.equal(realWorkspaceRedirect("/dashboard/monitoring", "practice-manager"), "/dashboard/today");
  // Patients: their own page and security only.
  assert.equal(realWorkspaceRedirect("/dashboard/patient", "patient"), null);
  assert.equal(realWorkspaceRedirect("/dashboard/security", "patient"), null);
  assert.equal(realWorkspaceRedirect("/dashboard/access", "patient"), "/dashboard/patient");
  assert.equal(realWorkspaceRedirect("/dashboard/today", "patient"), "/dashboard/patient");
  // Pages outside the dashboard are untouched.
  for (const p of ["/", "/signin", "/privacy", "/api/today"]) assert.equal(realWorkspaceRedirect(p, "gp"), null, p);
  assert.equal(realHomeFor("patient"), "/dashboard/patient");
  assert.equal(realHomeFor("nurse"), "/dashboard/today");
  for (const r of ["ics-lead", "hospital-executive", "researcher"]) assert.equal(REAL_ROLES.has(r), false, `${r} is not offered yet`);
  console.log("real-workspace: environment flag, staff/clinician/patient routing — PASS");
}

async function user(label: string) {
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `rw-${label}-${id.slice(0, 8)}@akshhealth.test`]);
  return id;
}
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

async function db() {
  if (!isPostgresConfigured()) return console.log("real-workspace: DB part skipped (no DATABASE_URL)");
  await assertNotProductionDatabase(getPgPool(), "real workspace test");
  const tag = randomUUID().slice(0, 6);

  // Not in any organisation yet: zeros and "join your clinic".
  const loner = await user("loner");
  const lonerToday = await getToday(await loadNetworkContext(loner, "nurse"));
  assert.equal(lonerToday.setup.step, "create_or_join");
  assert.equal(lonerToday.organisations.length, 0);
  assert.equal(lonerToday.slots.toWork, 0);

  const adminId = await user("admin");
  const admin = { userId: adminId, email: `a-${tag}@akshhealth.test`, displayName: "Admin", role: "practice-manager" };
  const org = await createOrganisation(admin, { name: `Today Clinic ${tag}`, kind: "clinic", locale: { timezone: "UTC" } });
  let adminCtx = await loadNetworkContext(adminId, "practice-manager");
  let t = await getToday(adminCtx);
  assert.equal(t.setup.step, "add_patients");
  assert.equal(t.organisations[0]!.isAdmin, true);
  assert.equal(t.cgm, null, "managers do not get clinical worklists");
  assert.equal(t.readingsToReview, null);

  const inv = await createInvite(adminCtx, org.id, { kind: "staff", role: "nurse" });
  const nurseId = await user("nurse");
  await acceptStaffInvite({ userId: nurseId, email: `n-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { code: inv.code });
  const ctx = await loadNetworkContext(nurseId, "nurse");
  const [p] = await importPatients(ctx, org.id, { patients: [{ recordRef: `${tag}-1`, givenName: "Ada", familyName: "Today", dateOfBirth: "1970-01-01" }] });
  adminCtx = await loadNetworkContext(adminId, "practice-manager");
  assert.equal((await getToday(adminCtx)).setup.step, "add_waitlist");
  await addToWaitlist(ctx, org.id, { patientId: p!.id, appointmentType: "diabetes_review", reason: "overdue_care", contactChannel: "sms" });
  assert.equal((await getToday(adminCtx)).setup.step, "go_live");

  // Two slots: one closing within 4 hours, one waiting for read-back.
  await ingestSlot(ctx, org.id, { source: "manual", sourceRef: `a-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(6), durationMin: 20, offerExpiresAt: inHours(3) });
  const b = await ingestSlot(ctx, org.id, { source: "manual", sourceRef: `b-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(30), durationMin: 20, offerExpiresAt: inHours(24) });
  await applyAction(ctx, b.workflowId, { action: "match", idempotencyKey: `m-${tag}` });
  const cand = (await getPgPool().query(`SELECT id FROM aksh.access_candidates WHERE workflow_id = $1 AND rank IS NOT NULL ORDER BY rank LIMIT 1`, [b.workflowId])).rows[0];
  await applyAction(ctx, b.workflowId, { action: "select", idempotencyKey: `s-${tag}`, candidateId: cand.id });
  await applyAction(ctx, b.workflowId, { action: "approve_contact", idempotencyKey: `ap-${tag}` });
  await applyAction(ctx, b.workflowId, { action: "record_response", idempotencyKey: `r-${tag}`, response: "accepted" });

  t = await getToday(ctx);
  assert.equal(t.organisations.length, 1);
  assert.equal(t.organisations[0]!.isAdmin, false);
  assert.equal(t.organisations[0]!.patients, 1);
  assert.equal(t.organisations[0]!.staff, 2);
  assert.equal(t.slots.toWork, 1, "the open slot; the accepted one waits for read-back instead");
  assert.equal(t.slots.offersClosingSoon, 1);
  assert.equal(t.slots.awaitingReadBack, 1);
  assert.ok(t.cgm, "clinicians get the CGM worklist");
  assert.equal(typeof t.readingsToReview, "number");

  // The work list: one item per thing to do, urgent first, each with why, due and a link to the exact item.
  const mine = t.work.filter((w) => w.organisation === t.organisations[0]!.name);
  const closing = mine.find((w) => w.kind === "slot")!;
  assert.equal(closing.priority, 0, "an offer closing within 4 hours is urgent");
  assert.match(closing.why, /Offer closes within 4 hours/);
  assert.match(closing.href, /^\/dashboard\/access\?slot=/);
  const readBack = mine.find((w) => w.kind === "read_back")!;
  assert.equal(readBack.href, `/dashboard/access?slot=${b.workflowId}`);
  assert.ok(t.work.indexOf(closing) < t.work.indexOf(readBack), "urgent before due soon");
  await applyAction(ctx, b.workflowId, { action: "complaint", idempotencyKey: `c-${tag}`, note: "Asked to be called after 5pm" });
  await getPgPool().query(
    `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by) VALUES ($1, 'glucose', 6.2, 'mmol/L', NOW() - INTERVAL '1 hour', 'patient_reported', false, $2)`,
    [p!.id, nurseId]
  );
  t = await getToday(ctx);
  const ho = t.work.find((w) => w.kind === "handoff" && w.title === "Hand-off: Complaint raised");
  assert.ok(ho, "an open hand-off is listed");
  assert.equal(ho!.href, `/dashboard/access?slot=${b.workflowId}`);
  const rd = t.work.find((w) => w.kind === "readings" && w.href === `/dashboard/network?patient=${p!.id}`);
  assert.ok(rd && /1 reading from Ada Today to check/.test(rd.title), "unverified shared readings are listed per patient");
  assert.ok(!(await getToday(adminCtx)).work.some((w) => w.kind === "readings"), "managers do not get clinical items");

  // Another organisation's staff see none of it.
  const otherId = await user("other");
  await createOrganisation({ userId: otherId, email: `o-${tag}@akshhealth.test`, displayName: "Other", role: "practice-manager" }, { name: `Other ${tag}`, kind: "clinic" });
  const other = await getToday(await loadNetworkContext(otherId, "practice-manager"));
  assert.equal(other.slots.toWork + other.slots.awaitingReadBack, 0);
  assert.ok(!other.work.some((w) => w.organisation === t.organisations[0]!.name || w.href.includes(b.workflowId)), "no work leaks across organisations");
  assert.ok(!other.organisations.some((o) => o.id === org.id));
  console.log("real-workspace: Today counts, work list (order, reasons, links, hand-offs, readings), setup steps, clinician-only worklists, isolation — PASS");
}

pure();
db().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
