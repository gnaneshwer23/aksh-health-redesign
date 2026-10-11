/**
 * PRD v1.1 pilot features against the database: approved offer templates (PA-04/PA-108), pilot stages (§10.3), the
 * complaint and staff-time guardrails (§10.2), the capability register (PA-10/§8.1) and the pilot readout
 * (§10.3/§17). Pure checks first (template rules, readout aggregation). DB part skips without DATABASE_URL.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { getCapabilityRegister } from "../lib/access/capabilities";
import { aggregateWeeks, getPilotReport, pilotReportCsv } from "../lib/access/pilot-report";
import { addToWaitlist, applyAction, getWorkflow, ingestSlot, listHandoffs } from "../lib/access/service";
import { approveTemplate, DEFAULT_TEMPLATE, listTemplates, renderTemplate, SAMPLE_FACTS, templateProblems } from "../lib/access/templates";
import { getWeeklyReview, mondayOf } from "../lib/access/weekly-review";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { setPilotStage } from "../lib/golive/service";
import { withTenant } from "../lib/network/db";
import { loadNetworkContext } from "../lib/network/context";
import { acceptStaffInvite, createInvite, createOrganisation, importPatients, NetworkError } from "../lib/network/service";

const rejects = (p: Promise<unknown>, status: number, pattern?: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof NetworkError && e.status === status && (!pattern || pattern.test(e.message)));
const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

function pure() {
  assert.deepEqual(templateProblems(DEFAULT_TEMPLATE), [], "the built-in default is valid");
  assert.match(renderTemplate(DEFAULT_TEMPLATE, SAMPLE_FACTS), /^Hello Sam, Your clinic has an earlier diabetes review available on .+ at Main site\. Reply YES by .+ STOP/);
  assert.match(renderTemplate("Hi {givenName}{site}, reply by {replyBy} for {when}. STOP to opt out.", { ...SAMPLE_FACTS, site: null }), /^Hi Sam, reply by/, "no site, no ' at'");
  const bad = templateProblems("Hi {givenName}, your {diagnosis} review is on {when}.");
  assert.ok(bad.some((p) => /Unknown placeholder: \{diagnosis\}/.test(p)), "clinical facts cannot be inserted");
  assert.ok(bad.some((p) => /\{replyBy\}/.test(p)));
  assert.ok(bad.some((p) => /STOP/.test(p)));
  assert.ok(templateProblems("x").some((p) => /too short/.test(p)));
  console.log("prd-v11: template rules — PASS");
}

async function user(label: string) {
  const id = randomUUID();
  await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `prd-${label}-${id.slice(0, 8)}@akshhealth.test`]);
  return id;
}

async function db() {
  if (!isPostgresConfigured()) return console.log("prd-v11: DB part skipped (no DATABASE_URL)");
  await assertNotProductionDatabase(getPgPool(), "PRD v1.1 pilot tests");
  const tag = randomUUID().slice(0, 6);
  const adminId = await user("admin");
  const org = await createOrganisation({ userId: adminId, email: `a-${tag}@akshhealth.test`, displayName: "Admin", role: "practice-manager" }, { name: `Pilot ${tag}`, kind: "clinic", locale: { timezone: "UTC" } });
  const admin = await loadNetworkContext(adminId, "practice-manager");
  const inv = await createInvite(admin, org.id, { kind: "staff", role: "nurse" });
  const nurseId = await user("nurse");
  await acceptStaffInvite({ userId: nurseId, email: `n-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { code: inv.code });
  const ctx = await loadNetworkContext(nurseId, "nurse");

  // Templates: admins approve versions; invalid wording is refused; drafts use the latest version and record it.
  await rejects(approveTemplate(ctx, org.id, { body: DEFAULT_TEMPLATE }), 403);
  await rejects(approveTemplate(admin, org.id, { body: "Hello {givenName}, your HbA1c is {hba1c}. Come in {when}." }), 400, /TEMPLATE_INVALID/);
  const v1 = await approveTemplate(admin, org.id, { body: "Hi {givenName}, {organisationName} can see you for a {appointmentType} on {when}{site}. Reply YES by {replyBy}. Reply STOP to opt out.", note: "Clinic wording" });
  assert.equal(v1.version, 1);
  const listed = await listTemplates(ctx, org.id);
  assert.equal(listed.active.version, "org-template-v1");
  assert.equal(listed.versions.length, 1);
  await assert.rejects(getPgPool().query(`UPDATE aksh.offer_templates SET body = 'x' WHERE organisation_id = $1`, [org.id]), /append-only/);

  const [p] = await importPatients(ctx, org.id, { patients: [{ recordRef: `${tag}-1`, givenName: "Rae", familyName: "Pilot", dateOfBirth: "1970-01-01" }] });
  await addToWaitlist(ctx, org.id, { patientId: p!.id, appointmentType: "diabetes_review", reason: "overdue_care", contactChannel: "sms" });
  const s = await ingestSlot(ctx, org.id, { source: "manual", sourceRef: `s-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", site: "North", startsAt: inHours(30), durationMin: 20, offerExpiresAt: inHours(24) });
  await applyAction(ctx, s.workflowId, { action: "match", idempotencyKey: `m-${tag}` });
  const cand = (await getWorkflow(ctx, s.workflowId))!.candidates.find((c: { rank: number | null }) => c.rank !== null);
  await applyAction(ctx, s.workflowId, { action: "select", idempotencyKey: `sel-${tag}`, candidateId: cand.id });
  const wf = await getWorkflow(ctx, s.workflowId);
  assert.match(wf!.offer_text, /^Hi Rae, Pilot .+ can see you for a diabetes review on .+ at North\. Reply YES by/, "draft uses the approved wording");
  const tv = await getPgPool().query(`SELECT template_version, contact_mode FROM aksh.access_workflows WHERE id = $1`, [s.workflowId]);
  assert.equal(tv.rows[0].template_version, "org-template-v1");
  assert.equal(tv.rows[0].contact_mode, "shadow", "organisations start in shadow mode");

  // Complaint and staff time: recorded on the slot; the complaint goes to a person.
  await applyAction(ctx, s.workflowId, { action: "complaint", idempotencyKey: `c-${tag}`, note: "Patient unhappy about being called at work" });
  await applyAction(ctx, s.workflowId, { action: "log_time", idempotencyKey: `t1-${tag}`, minutes: 6 });
  await applyAction(ctx, s.workflowId, { action: "log_time", idempotencyKey: `t2-${tag}`, minutes: 4 });
  assert.ok((await listHandoffs(ctx)).some((h: { workflow_id: string; reason: string }) => h.workflow_id === s.workflowId && h.reason === "Complaint raised"));
  const week = await getWeeklyReview(ctx, org.id, mondayOf(new Date().toISOString().slice(0, 10)));
  assert.equal(week.guardrails.complaints, 1);
  assert.equal(week.guardrails.staffMinutes, 10);
  assert.equal(week.guardrails.slotsTimed, 1);
  assert.equal(week.guardrails.staffMinutesPerSlot, 10);
  assert.ok(week.prompts.some((x) => /complaint/.test(x)));

  // Pilot stage: never from a tenant session; only an Aksh reviewer, only after go-live, with a reason.
  await assert.rejects(withTenant(admin, (c) => c.query(`UPDATE aksh.organisations SET pilot_stage = 'staff_assisted' WHERE id = $1`, [org.id])), /STATUS_CHANGE/);
  const reviewer = await user("reviewer");
  await getPgPool().query(`INSERT INTO aksh.platform_admins (user_id, granted_by) VALUES ($1, 'test')`, [reviewer]);
  try {
    await rejects(setPilotStage(reviewer, org.id, { stage: "staff_assisted", note: "Provider approved" }), 409, /STAGE_NOT_LIVE/);
    await getPgPool().query(`UPDATE aksh.organisations SET status = 'live_read_only', verified_at = NOW() - INTERVAL '1 day' WHERE id = $1`, [org.id]);
    await rejects(setPilotStage(adminId, org.id, { stage: "staff_assisted", note: "self-promotion" }), 404); // reviewer routes hide themselves
    const moved = await setPilotStage(reviewer, org.id, { stage: "staff_assisted", note: "Provider approved staff-assisted test, weeks 6–8" });
    assert.equal(moved.previous, "shadow");
    await rejects(setPilotStage(reviewer, org.id, { stage: "staff_assisted", note: "again" }), 409, /STAGE_UNCHANGED/);
    const s2 = await ingestSlot(ctx, org.id, { source: "manual", sourceRef: `s2-${tag}`, sourceVersion: 1, appointmentType: "diabetes_review", startsAt: inHours(40), durationMin: 20, offerExpiresAt: inHours(30) });
    assert.equal((await getPgPool().query(`SELECT contact_mode FROM aksh.access_workflows WHERE id = $1`, [s2.workflowId])).rows[0].contact_mode, "staff_executed", "new slots follow the stage");

    // Capability register: stage, versions, connector capabilities and literal honesty fields.
    const reg = await getCapabilityRegister(ctx, org.id);
    assert.equal(reg.workflow.mode, "staff_assisted");
    assert.equal(reg.workflow.templateVersion, "org-template-v1");
    assert.equal(reg.stageHistory[0]!.stage, "staff_assisted");
    assert.equal(reg.connectors.capabilities.write, false);
    assert.equal(reg.honesty.liveEmis, false);
    assert.equal(reg.honesty.messagesSentByAksh, false);
    assert.equal(reg.honesty.bookingConfirmedOnlyByReadBack, true);
    const outsider = await user("outsider");
    await rejects(getCapabilityRegister(await loadNetworkContext(outsider, "nurse"), org.id), 403);
  } finally {
    await getPgPool().query(`DELETE FROM aksh.platform_admins WHERE user_id = $1`, [reviewer]);
  }

  // Pilot readout over complete weeks: reproduces the weekly totals, states its limitations, exports CSV.
  const thisWeek = mondayOf(new Date().toISOString().slice(0, 10));
  const report = await getPilotReport(ctx, org.id, { from: thisWeek, to: thisWeek });
  assert.equal(report.window.weeks, 1);
  assert.equal(report.primary.eligible, week.funnel.eligible + 1, "the second slot belongs to the same week");
  assert.equal(report.guardrails.patientAccess.complaints, 1);
  assert.equal(report.guardrails.staffTime.minutes, 10);
  assert.ok(report.limitations.some((l) => /not a causal estimate/.test(l)));
  assert.ok(report.limitations.some((l) => /not signed off/.test(l)));
  assert.match(pilotReportCsv(report), /^# pilot-readout-v1 · slot-fill-v1\.2/);
  const agg = aggregateWeeks([week, week], new Set([week.week.start]), { freed: 40, filled: 10, ratePct: 25, staffMinutesPerSlot: 12 });
  assert.equal(agg.primary.eligible, week.funnel.eligible * 2, "aggregation sums weeks");
  assert.equal(agg.guardrails.staffTime.baselinePerSlot, 12);

  console.log("prd-v11: templates, shadow → staff-assisted stage, complaints, staff time, capability register, pilot readout — PASS");
}

pure();
db().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
