/**
 * Cancelled-slot fill workflow. Shadow mode by default: Aksh ranks candidates and drafts the offer, staff decide every
 * step, nothing is sent from the system, and a booking only counts once it is read back from the authoritative
 * schedule. Every action is idempotent (same key → same result, at most one logical action) and append-only audited.
 */
import type { PoolClient } from "pg";
import { z } from "zod";

import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { withTenant, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

import { FILL_DEFINITION, FILLED_SQL } from "./measurement";
import { evaluateCandidates, renderOffer, resolveSettings, RULE_VERSION, TEMPLATE_VERSION, type WaitlistFacts } from "./eligibility";
import { withPrivileged } from "@/lib/network/db";

const STAFF_ROLES = new Set(["gp", "nurse", "clinical-pharmacist", "practice-manager"]);

function requireStaff(ctx: NetworkContext, orgId?: string) {
  if (!STAFF_ROLES.has(ctx.role ?? "")) throw new NetworkError("Your role cannot work the access queue", 403);
  if (orgId && !ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
}

/**
 * A schedule connector (API key, role "connector") may report slots, confirm bookings it can read back, and withdraw or
 * hand off slots that were taken in the schedule. It never matches, drafts, approves or records patient responses.
 */
export const CONNECTOR_ROLE = "connector";
const CONNECTOR_ACTIONS = new Set(["confirm_booking", "withdraw", "handoff"]);
function requireStaffOrConnector(ctx: NetworkContext, orgId?: string, action?: string) {
  if (ctx.role === CONNECTOR_ROLE) {
    if (action && !CONNECTOR_ACTIONS.has(action)) throw new NetworkError("A schedule connector cannot take this step", 403);
    if (orgId && !ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
    return;
  }
  requireStaff(ctx, orgId);
}

const isoDateTime = z.string().datetime({ offset: true });

export const ingestSlotSchema = z.object({
  source: z.enum(["manual", "import", "partner_api", "simulation"]),
  sourceRef: z.string().min(1).max(80),
  sourceVersion: z.number().int().min(1).max(10_000).default(1),
  appointmentType: z.string().min(2).max(40),
  clinicianMembershipId: z.string().max(64).optional(),
  site: z.string().max(80).optional(),
  startsAt: isoDateTime,
  durationMin: z.number().int().min(5).max(240),
  offerExpiresAt: isoDateTime,
});

export const waitlistSchema = z.object({
  patientId: z.string().min(1).max(64),
  appointmentType: z.string().min(2).max(40),
  reason: z.enum(["overdue_care", "patient_request", "clinician_request"]),
  careGap: z.string().max(80).optional(),
  earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  preferredSites: z.array(z.string().max(80)).max(10).optional(),
  minNoticeHours: z.number().int().min(0).max(168).optional(),
  accessibilityNeeds: z.string().max(200).optional(),
  contactChannel: z.enum(["sms", "phone", "email", "app", "whatsapp"]).optional(),
});

export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("match"), idempotencyKey: z.string().min(8).max(120) }),
  z.object({ action: z.literal("select"), idempotencyKey: z.string().min(8).max(120), candidateId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("skip"), idempotencyKey: z.string().min(8).max(120), candidateId: z.string().min(1).max(64), reason: z.string().min(2).max(200) }),
  z.object({ action: z.literal("handoff"), idempotencyKey: z.string().min(8).max(120), reason: z.string().min(2).max(200), priority: z.enum(["routine", "soon", "urgent"]).optional() }),
  z.object({ action: z.literal("approve_contact"), idempotencyKey: z.string().min(8).max(120) }),
  z.object({ action: z.literal("record_response"), idempotencyKey: z.string().min(8).max(120), response: z.enum(["accepted", "declined", "no_response"]) }),
  z.object({
    action: z.literal("confirm_booking"),
    idempotencyKey: z.string().min(8).max(120),
    confirmed: z.boolean(),
    // Where the confirmation was read from (schedule reference or staff check). Required: no read-back, no booking.
    sourceReference: z.string().min(2).max(120),
  }),
  z.object({ action: z.literal("withdraw"), idempotencyKey: z.string().min(8).max(120), reason: z.string().min(2).max(200) }),
  // Staff may reword the drafted offer; the edit and its author are recorded.
  z.object({ action: z.literal("edit_offer"), idempotencyKey: z.string().min(8).max(120), text: z.string().trim().min(20).max(480) }),
  // Park the slot until later (never beyond the offer window).
  z.object({ action: z.literal("defer"), idempotencyKey: z.string().min(8).max(120), until: isoDateTime }),
]);
export type WorkflowAction = z.infer<typeof actionSchema>;

/** Record a slot event. Idempotent on (organisation, source, sourceRef); a lower or equal version is a replay. */
export async function ingestSlot(ctx: NetworkContext, orgId: string, input: z.infer<typeof ingestSlotSchema>) {
  requireStaffOrConnector(ctx, orgId);
  if (ctx.role === CONNECTOR_ROLE && input.source !== "partner_api") throw new NetworkError("Connectors report partner_api slots only", 403);
  const starts = new Date(input.startsAt).getTime();
  const expires = new Date(input.offerExpiresAt).getTime();
  if (starts <= Date.now()) throw new NetworkError("SLOT_STALE: the slot has already started", 400);
  if (expires > starts) throw new NetworkError("OFFER_AFTER_START: offers must expire before the slot starts", 400);

  return withTenant(ctx, async (client) => {
    const existing = await client.query<{ id: string; source_version: number; state: string }>(
      `SELECT id, source_version, state FROM aksh.access_slots WHERE organisation_id = $1 AND source = $2 AND source_ref = $3 FOR UPDATE`,
      [orgId, input.source, input.sourceRef]
    );
    const env = getDeploymentEnvironment();
    if (existing.rows[0]) {
      const slot = existing.rows[0];
      const wf = await client.query<{ id: string; state: string }>(`SELECT id, state FROM aksh.access_workflows WHERE slot_id = $1`, [slot.id]);
      if (input.sourceVersion <= slot.source_version) return { slotId: slot.id, workflowId: wf.rows[0]!.id, replay: true };
      // Newer version of the same slot (time or type changed): only accepted while nobody holds an offer for it.
      if (slot.state !== "available") throw new NetworkError("SLOT_CHANGED_AFTER_OFFER: hand off to staff", 409);
      await client.query(
        `UPDATE aksh.access_slots SET source_version = $2, appointment_type = $3, site = $4, starts_at = $5, duration_min = $6, offer_expires_at = $7 WHERE id = $1`,
        [slot.id, input.sourceVersion, input.appointmentType, input.site ?? null, input.startsAt, input.durationMin, input.offerExpiresAt]
      );
      return { slotId: slot.id, workflowId: wf.rows[0]!.id, replay: false, updated: true };
    }
    const slot = await client.query<{ id: string }>(
      `INSERT INTO aksh.access_slots (organisation_id, source, source_ref, source_version, appointment_type, clinician_membership_id, site, starts_at, duration_min, offer_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [orgId, input.source, input.sourceRef, input.sourceVersion, input.appointmentType, input.clinicianMembershipId ?? null, input.site ?? null, input.startsAt, input.durationMin, input.offerExpiresAt]
    );
    const wf = await client.query<{ id: string }>(
      `INSERT INTO aksh.access_workflows (organisation_id, slot_id, state, rule_version, environment) VALUES ($1, $2, 'SOURCE_VALIDATED', $3, $4) RETURNING id`,
      [orgId, slot.rows[0]!.id, RULE_VERSION, env]
    );
    await client.query(
      `INSERT INTO aksh.access_actions (organisation_id, workflow_id, action_type, idempotency_key, actor_user_id, from_state, to_state, result_code, detail, environment)
       VALUES ($1, $2, 'ingest', $3, $4, 'RECEIVED', 'SOURCE_VALIDATED', 'OK', $5::jsonb, $6)`,
      [orgId, wf.rows[0]!.id, `ingest:${orgId}:${input.source}:${input.sourceRef}:${input.sourceVersion}`, ctx.userId, JSON.stringify({ source: input.source, sourceRef: input.sourceRef }), env]
    );
    return { slotId: slot.rows[0]!.id, workflowId: wf.rows[0]!.id, replay: false };
  });
}

export async function addToWaitlist(ctx: NetworkContext, orgId: string, input: z.infer<typeof waitlistSchema>) {
  requireStaff(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const p = await client.query(`SELECT 1 FROM aksh.network_patients WHERE id = $1 AND organisation_id = $2`, [input.patientId, orgId]);
    if (!p.rowCount) throw new NetworkError("Patient not found in this organisation", 404);
    const dup = await client.query<{ id: string }>(
      `SELECT id FROM aksh.waitlist_entries WHERE organisation_id = $1 AND patient_id = $2 AND appointment_type = $3 AND status IN ('waiting', 'offered')`,
      [orgId, input.patientId, input.appointmentType]
    );
    if (dup.rows[0]) return { id: dup.rows[0].id, duplicate: true };
    const r = await client.query<{ id: string }>(
      `INSERT INTO aksh.waitlist_entries (organisation_id, patient_id, appointment_type, reason, care_gap, earliest, latest, preferred_sites, min_notice_hours, accessibility_needs, contact_channel, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [orgId, input.patientId, input.appointmentType, input.reason, input.careGap ?? null, input.earliest ?? null, input.latest ?? null, input.preferredSites ?? [], input.minNoticeHours ?? 2, input.accessibilityNeeds ?? null, input.contactChannel ?? null, ctx.userId]
    );
    return { id: r.rows[0]!.id, duplicate: false };
  });
}

type WorkflowRow = {
  id: string;
  organisation_id: string;
  slot_id: string;
  state: string;
  selected_candidate_id: string | null;
  contact_mode: string;
};

async function record(
  client: PoolClient,
  ctx: NetworkContext,
  wf: WorkflowRow,
  action: string,
  key: string,
  toState: string,
  resultCode: string,
  detail: Record<string, unknown> = {}
) {
  await client.query(
    `INSERT INTO aksh.access_actions (organisation_id, workflow_id, action_type, idempotency_key, actor_user_id, from_state, to_state, result_code, detail, environment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
    [wf.organisation_id, wf.id, action, key, ctx.userId, wf.state, toState, resultCode, JSON.stringify(detail), getDeploymentEnvironment()]
  );
  await client.query(`UPDATE aksh.access_workflows SET state = $2, updated_at = NOW() WHERE id = $1`, [wf.id, toState]);
}

function expectState(wf: WorkflowRow, allowed: string[], action: string) {
  if (!allowed.includes(wf.state)) throw new NetworkError(`INVALID_TRANSITION: cannot ${action} from ${wf.state}`, 409);
}

/** Apply one staff or service step. Replaying the same idempotency key returns the original result without acting again. */
export async function applyAction(ctx: NetworkContext, workflowId: string, input: WorkflowAction) {
  requireStaffOrConnector(ctx, undefined, input.action);
  const key = `${workflowId}:${input.idempotencyKey}`;
  return withTenant(ctx, async (client) => {
    const prior = await client.query<{ action_type: string; to_state: string; result_code: string; detail: Record<string, unknown> }>(
      `SELECT action_type, to_state, result_code, detail FROM aksh.access_actions WHERE idempotency_key = $1`,
      [key]
    );
    if (prior.rows[0]) return { ...prior.rows[0], replay: true };

    const wfRes = await client.query<WorkflowRow>(
      `SELECT id, organisation_id, slot_id, state, selected_candidate_id, contact_mode FROM aksh.access_workflows WHERE id = $1 FOR UPDATE`,
      [workflowId]
    );
    const wf = wfRes.rows[0];
    if (!wf) throw new NetworkError("Workflow not found", 404);
    const slot = (await client.query<{ id: string; appointment_type: string; site: string | null; starts_at: Date; duration_min: number; offer_expires_at: Date; state: string }>(
      `SELECT id, appointment_type, site, starts_at, duration_min, offer_expires_at, state FROM aksh.access_slots WHERE id = $1 FOR UPDATE`,
      [wf.slot_id]
    )).rows[0]!;

    // An expired offer window closes the workflow before any other step (unless a booking is awaiting read-back).
    if (slot.offer_expires_at.getTime() <= Date.now() && !["CLOSED", "PENDING_VERIFICATION", "HANDOFF", "FAILED_SAFE"].includes(wf.state)) {
      await client.query(`UPDATE aksh.access_slots SET state = 'expired' WHERE id = $1`, [slot.id]);
      await client.query(`UPDATE aksh.waitlist_entries SET status = 'waiting' WHERE id IN (SELECT waitlist_entry_id FROM aksh.access_candidates WHERE id = $1) AND status = 'offered'`, [wf.selected_candidate_id]);
      await client.query(`UPDATE aksh.access_workflows SET outcome = 'expired' WHERE id = $1`, [wf.id]);
      await record(client, ctx, wf, input.action, key, "CLOSED", "SLOT_EXPIRED");
      return { action_type: input.action, to_state: "CLOSED", result_code: "SLOT_EXPIRED", detail: {}, replay: false };
    }

    switch (input.action) {
      case "match": {
        expectState(wf, ["SOURCE_VALIDATED", "ELIGIBILITY_CHECKED", "STAFF_REVIEW"], "match");
        const entries = (await client.query<WaitlistFacts & { added_at: Date }>(
          `SELECT w.id, w.patient_id AS "patientId", w.appointment_type AS "appointmentType", w.reason, w.care_gap AS "careGap",
                  to_char(w.earliest, 'YYYY-MM-DD') AS earliest, to_char(w.latest, 'YYYY-MM-DD') AS latest,
                  w.preferred_sites AS "preferredSites", w.min_notice_hours AS "minNoticeHours", w.contact_channel AS "contactChannel",
                  w.opted_out AS "optedOut", w.status, w.added_at,
                  EXISTS (SELECT 1 FROM aksh.waitlist_entries o WHERE o.patient_id = w.patient_id AND o.status = 'offered' AND o.id <> w.id) AS "hasActiveOffer",
                  (SELECT count(*)::int FROM aksh.access_actions a WHERE a.organisation_id = w.organisation_id AND a.action_type = 'select'
                     AND a.detail->>'patientId' = w.patient_id AND a.created_at > NOW() - INTERVAL '30 days') AS "recentOffers"
           FROM aksh.waitlist_entries w WHERE w.organisation_id = $1 AND w.appointment_type = $2 AND w.status = 'waiting'`,
          [wf.organisation_id, slot.appointment_type]
        )).rows.map((e) => ({ ...e, addedAt: e.added_at.toISOString() }));
        const settings = resolveSettings((await client.query<{ access_settings: unknown }>(`SELECT access_settings FROM aksh.organisations WHERE id = $1`, [wf.organisation_id])).rows[0]?.access_settings);
        const results = evaluateCandidates(
          { appointmentType: slot.appointment_type, site: slot.site, startsAt: slot.starts_at.toISOString(), durationMin: slot.duration_min, offerExpiresAt: slot.offer_expires_at.toISOString() },
          entries,
          new Date(),
          settings
        );
        // Staff outcomes for this slot stick across re-matching: someone who declined or was skipped is not re-offered it.
        const sticky = new Map(
          (await client.query<{ waitlist_entry_id: string; codes: string[] }>(
            `SELECT waitlist_entry_id, ARRAY(SELECT unnest(exclusion_codes) INTERSECT SELECT unnest(ARRAY['DECLINED', 'NO_RESPONSE', 'STAFF_SKIPPED'])) AS codes
             FROM aksh.access_candidates WHERE workflow_id = $1`,
            [wf.id]
          )).rows.filter((r) => r.codes.length).map((r) => [r.waitlist_entry_id, r.codes])
        );
        for (const c of results) {
          const codes = sticky.get(c.waitlistEntryId);
          if (codes) {
            c.exclusionCodes = [...c.exclusionCodes, ...codes];
            c.rank = null;
          }
        }
        let next = 1;
        for (const c of results.filter((x) => x.rank !== null)) c.rank = next++;
        await client.query(`DELETE FROM aksh.access_candidates WHERE workflow_id = $1`, [wf.id]);
        for (const c of results) {
          await client.query(
            `INSERT INTO aksh.access_candidates (workflow_id, organisation_id, waitlist_entry_id, patient_id, rank, rules_passed, exclusion_codes, missing_fields, reasons)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [wf.id, wf.organisation_id, c.waitlistEntryId, c.patientId, c.rank, c.rulesPassed, c.exclusionCodes, c.missingFields, c.reasons]
          );
        }
        const eligible = results.filter((c) => c.rank !== null).length;
        if (!eligible) {
          await client.query(`UPDATE aksh.access_workflows SET outcome = 'no_candidates' WHERE id = $1`, [wf.id]);
          await record(client, ctx, wf, "match", key, "STAFF_REVIEW", "NO_ELIGIBLE_CANDIDATES", { evaluated: results.length });
          return { action_type: "match", to_state: "STAFF_REVIEW", result_code: "NO_ELIGIBLE_CANDIDATES", detail: { evaluated: results.length }, replay: false };
        }
        await record(client, ctx, wf, "match", key, "STAFF_REVIEW", "RANKED", { evaluated: results.length, eligible, ruleVersion: RULE_VERSION });
        return { action_type: "match", to_state: "STAFF_REVIEW", result_code: "RANKED", detail: { evaluated: results.length, eligible }, replay: false };
      }
      case "select": {
        expectState(wf, ["STAFF_REVIEW"], "select a candidate");
        const cand = (await client.query<{ id: string; waitlist_entry_id: string; patient_id: string; rank: number | null }>(
          `SELECT id, waitlist_entry_id, patient_id, rank FROM aksh.access_candidates WHERE id = $1 AND workflow_id = $2`,
          [input.candidateId, wf.id]
        )).rows[0];
        if (!cand) throw new NetworkError("Candidate not found", 404);
        if (cand.rank === null) throw new NetworkError("EXCLUDED_CANDIDATE: this patient did not pass the eligibility rules", 409);
        const entry = await client.query(`UPDATE aksh.waitlist_entries SET status = 'offered' WHERE id = $1 AND status = 'waiting' RETURNING id`, [cand.waitlist_entry_id]);
        if (!entry.rowCount) throw new NetworkError("CANDIDATE_NO_LONGER_WAITING: re-run matching", 409);
        const facts = (await client.query<{ given_name: string; org_name: string; timezone: string | null }>(
          `SELECT p.given_name, o.name AS org_name, o.locale->>'timezone' AS timezone FROM aksh.network_patients p JOIN aksh.organisations o ON o.id = $2 WHERE p.id = $1`,
          [cand.patient_id, wf.organisation_id]
        )).rows[0]!;
        const offer = renderOffer({
          givenName: facts.given_name,
          organisationName: facts.org_name,
          appointmentType: slot.appointment_type,
          startsAt: slot.starts_at.toISOString(),
          site: slot.site,
          offerExpiresAt: slot.offer_expires_at.toISOString(),
          timeZone: facts.timezone ?? undefined,
        });
        await client.query(`UPDATE aksh.access_slots SET state = 'offered' WHERE id = $1`, [slot.id]);
        await client.query(`UPDATE aksh.access_workflows SET selected_candidate_id = $2, offer_text = $3, template_version = $4 WHERE id = $1`, [wf.id, cand.id, offer, TEMPLATE_VERSION]);
        await record(client, ctx, wf, "select", key, "OFFER_DRAFTED", "OFFER_DRAFTED", { candidateId: cand.id, patientId: cand.patient_id, templateVersion: TEMPLATE_VERSION });
        return { action_type: "select", to_state: "OFFER_DRAFTED", result_code: "OFFER_DRAFTED", detail: { offer }, replay: false };
      }
      case "skip": {
        expectState(wf, ["STAFF_REVIEW"], "skip a candidate");
        const r = await client.query(
          `UPDATE aksh.access_candidates SET rank = NULL, exclusion_codes = array_append(exclusion_codes, 'STAFF_SKIPPED'), reasons = array_append(reasons, $3)
           WHERE id = $1 AND workflow_id = $2 RETURNING id`,
          [input.candidateId, wf.id, `Skipped by staff: ${input.reason}`]
        );
        if (!r.rowCount) throw new NetworkError("Candidate not found", 404);
        await record(client, ctx, wf, "skip", key, "STAFF_REVIEW", "SKIPPED", { candidateId: input.candidateId, reason: input.reason });
        return { action_type: "skip", to_state: "STAFF_REVIEW", result_code: "SKIPPED", detail: {}, replay: false };
      }
      case "handoff": {
        expectState(wf, ["SOURCE_VALIDATED", "STAFF_REVIEW", "OFFER_DRAFTED", "CONTACT_APPROVED", "RESPONSE_CAPTURED", "PENDING_VERIFICATION"], "hand off");
        const due = new Date(Date.now() + (input.priority === "urgent" ? 1 : input.priority === "soon" ? 4 : 24) * 3_600_000);
        await client.query(
          `INSERT INTO aksh.handoff_tasks (organisation_id, workflow_id, reason, context, priority, due_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [wf.organisation_id, wf.id, input.reason, `Slot ${slot.appointment_type} at ${slot.starts_at.toISOString()} · workflow was ${wf.state}`, input.priority ?? "routine", due.toISOString()]
        );
        await client.query(`UPDATE aksh.access_workflows SET outcome = 'handed_off' WHERE id = $1`, [wf.id]);
        await record(client, ctx, wf, "handoff", key, "HANDOFF", "HANDED_OFF", { reason: input.reason });
        return { action_type: "handoff", to_state: "HANDOFF", result_code: "HANDED_OFF", detail: {}, replay: false };
      }
      case "approve_contact": {
        expectState(wf, ["OFFER_DRAFTED"], "approve contact");
        // Shadow mode: approval is recorded, nothing leaves the system. Staff use their existing approved channel.
        const code = wf.contact_mode === "shadow" ? "NOT_SENT_SHADOW_MODE" : "STAFF_TO_SEND";
        await record(client, ctx, wf, "approve_contact", key, "CONTACT_APPROVED", code);
        return { action_type: "approve_contact", to_state: "CONTACT_APPROVED", result_code: code, detail: {}, replay: false };
      }
      case "record_response": {
        expectState(wf, ["CONTACT_APPROVED"], "record a response");
        const cand = (await client.query<{ id: string; waitlist_entry_id: string }>(`SELECT id, waitlist_entry_id FROM aksh.access_candidates WHERE id = $1`, [wf.selected_candidate_id])).rows[0]!;
        if (input.response === "accepted") {
          await client.query(`UPDATE aksh.access_slots SET state = 'pending_verification' WHERE id = $1`, [slot.id]);
          await record(client, ctx, wf, "record_response", key, "PENDING_VERIFICATION", "ACCEPTED_PENDING_VERIFICATION");
          return { action_type: "record_response", to_state: "PENDING_VERIFICATION", result_code: "ACCEPTED_PENDING_VERIFICATION", detail: {}, replay: false };
        }
        // Declined or no response: the patient keeps their place; the slot goes back to review for the next candidate.
        await client.query(`UPDATE aksh.waitlist_entries SET status = 'waiting' WHERE id = $1`, [cand.waitlist_entry_id]);
        await client.query(
          `UPDATE aksh.access_candidates SET rank = NULL, exclusion_codes = array_append(exclusion_codes, $2) WHERE id = $1`,
          [cand.id, input.response === "declined" ? "DECLINED" : "NO_RESPONSE"]
        );
        await client.query(`UPDATE aksh.access_slots SET state = 'available' WHERE id = $1`, [slot.id]);
        await client.query(`UPDATE aksh.access_workflows SET selected_candidate_id = NULL, offer_text = NULL WHERE id = $1`, [wf.id]);
        await record(client, ctx, wf, "record_response", key, "STAFF_REVIEW", input.response === "declined" ? "DECLINED" : "NO_RESPONSE");
        return { action_type: "record_response", to_state: "STAFF_REVIEW", result_code: input.response.toUpperCase(), detail: {}, replay: false };
      }
      case "confirm_booking": {
        expectState(wf, ["PENDING_VERIFICATION"], "confirm a booking");
        const cand = (await client.query<{ waitlist_entry_id: string }>(`SELECT waitlist_entry_id FROM aksh.access_candidates WHERE id = $1`, [wf.selected_candidate_id])).rows[0]!;
        if (!input.confirmed) {
          // Read-back did not show the booking: never claim success; a person resolves it.
          await client.query(
            `INSERT INTO aksh.handoff_tasks (organisation_id, workflow_id, reason, context, priority, due_at) VALUES ($1, $2, 'Booking not confirmed on read-back', $3, 'soon', NOW() + INTERVAL '4 hours')`,
            [wf.organisation_id, wf.id, `Checked ${input.sourceReference}; slot ${slot.starts_at.toISOString()}`]
          );
          await record(client, ctx, wf, "confirm_booking", key, "FAILED_SAFE", "READ_BACK_NOT_CONFIRMED", { sourceReference: input.sourceReference });
          return { action_type: "confirm_booking", to_state: "FAILED_SAFE", result_code: "READ_BACK_NOT_CONFIRMED", detail: {}, replay: false };
        }
        await client.query(`UPDATE aksh.access_slots SET state = 'booked' WHERE id = $1`, [slot.id]);
        await client.query(`UPDATE aksh.waitlist_entries SET status = 'booked' WHERE id = $1`, [cand.waitlist_entry_id]);
        await client.query(`UPDATE aksh.access_workflows SET outcome = 'booked' WHERE id = $1`, [wf.id]);
        await record(client, ctx, wf, "confirm_booking", key, "CLOSED", "BOOKED_VERIFIED", { sourceReference: input.sourceReference });
        return { action_type: "confirm_booking", to_state: "CLOSED", result_code: "BOOKED_VERIFIED", detail: {}, replay: false };
      }
      case "edit_offer": {
        expectState(wf, ["OFFER_DRAFTED"], "edit the offer");
        await client.query(`UPDATE aksh.access_workflows SET offer_text = $2, template_version = $3, offer_edited_by = $4 WHERE id = $1`, [wf.id, input.text, `${TEMPLATE_VERSION}+edited`, ctx.userId]);
        await record(client, ctx, wf, "edit_offer", key, "OFFER_DRAFTED", "OFFER_EDITED", { length: input.text.length });
        return { action_type: "edit_offer", to_state: "OFFER_DRAFTED", result_code: "OFFER_EDITED", detail: {}, replay: false };
      }
      case "defer": {
        expectState(wf, ["SOURCE_VALIDATED", "STAFF_REVIEW"], "defer");
        const until = new Date(input.until);
        if (until.getTime() <= Date.now() || until.getTime() >= slot.offer_expires_at.getTime()) {
          throw new NetworkError("DEFER_OUTSIDE_WINDOW: choose a time before the offer window closes", 400);
        }
        await client.query(`UPDATE aksh.access_workflows SET deferred_until = $2 WHERE id = $1`, [wf.id, until.toISOString()]);
        await record(client, ctx, wf, "defer", key, wf.state, "DEFERRED", { until: until.toISOString() });
        return { action_type: "defer", to_state: wf.state, result_code: "DEFERRED", detail: { until: until.toISOString() }, replay: false };
      }
      case "withdraw": {
        expectState(wf, ["SOURCE_VALIDATED", "STAFF_REVIEW", "OFFER_DRAFTED"], "withdraw");
        if (wf.selected_candidate_id) {
          await client.query(`UPDATE aksh.waitlist_entries SET status = 'waiting' WHERE id IN (SELECT waitlist_entry_id FROM aksh.access_candidates WHERE id = $1)`, [wf.selected_candidate_id]);
        }
        await client.query(`UPDATE aksh.access_slots SET state = 'withdrawn' WHERE id = $1`, [slot.id]);
        await client.query(`UPDATE aksh.access_workflows SET outcome = 'withdrawn' WHERE id = $1`, [wf.id]);
        await record(client, ctx, wf, "withdraw", key, "CLOSED", "WITHDRAWN", { reason: input.reason });
        return { action_type: "withdraw", to_state: "CLOSED", result_code: "WITHDRAWN", detail: {}, replay: false };
      }
    }
  });
}

export async function listQueue(ctx: NetworkContext, orgId?: string) {
  requireStaff(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const { rows } = await client.query(
      `SELECT w.id, w.state, w.outcome, w.contact_mode, w.offer_text, w.rule_version, w.updated_at, w.organisation_id, w.deferred_until,
              s.appointment_type, s.site, s.starts_at, s.duration_min, s.offer_expires_at, s.state AS slot_state, s.source, s.source_ref,
              (SELECT count(*)::int FROM aksh.access_candidates c WHERE c.workflow_id = w.id AND c.rank IS NOT NULL) AS eligible
       FROM aksh.access_workflows w JOIN aksh.access_slots s ON s.id = w.slot_id
       WHERE ($1::text IS NULL OR w.organisation_id = $1)
       ORDER BY CASE WHEN w.state IN ('CLOSED') THEN 1 ELSE 0 END, s.starts_at`,
      [orgId ?? null]
    );
    return rows;
  });
}

export async function getWorkflow(ctx: NetworkContext, workflowId: string) {
  requireStaff(ctx);
  return withTenant(ctx, async (client) => {
    const wf = (await client.query(
      `SELECT w.*, s.appointment_type, s.site, s.starts_at, s.duration_min, s.offer_expires_at, s.state AS slot_state, s.source, s.source_ref
       FROM aksh.access_workflows w JOIN aksh.access_slots s ON s.id = w.slot_id WHERE w.id = $1`,
      [workflowId]
    )).rows[0];
    if (!wf) return null;
    const candidates = (await client.query(
      `SELECT c.id, c.rank, c.rules_passed, c.exclusion_codes, c.missing_fields, c.reasons, c.patient_id,
              p.given_name || ' ' || p.family_name AS patient_name, w.contact_channel, w.reason, w.care_gap
       FROM aksh.access_candidates c
       JOIN aksh.waitlist_entries w ON w.id = c.waitlist_entry_id
       LEFT JOIN aksh.network_patients p ON p.id = c.patient_id
       WHERE c.workflow_id = $1 ORDER BY c.rank NULLS LAST, patient_name`,
      [workflowId]
    )).rows;
    const actions = (await client.query(
      `SELECT action_type, from_state, to_state, result_code, created_at FROM aksh.access_actions WHERE workflow_id = $1 ORDER BY created_at`,
      [workflowId]
    )).rows;
    const handoffs = (await client.query(`SELECT id, reason, priority, due_at, acknowledged_at, closed_at FROM aksh.handoff_tasks WHERE workflow_id = $1 ORDER BY created_at`, [workflowId])).rows;
    return { ...wf, candidates, actions, handoffs };
  });
}

/**
 * Pilot metric (slot-fill-v1.2, definition in measurement.ts FILLED_SQL). Fill rate over slots received in the
 * window (withdrawn slots excluded). Guardrails are reported alongside, never folded into the headline number.
 */
export async function accessMetrics(ctx: NetworkContext, orgId?: string, windowDays = 30) {
  requireStaff(ctx, orgId);
  return withTenant(ctx, async (client) => {
    type Counts = { eligible_slots: number; booked_verified: number; pending_verification: number; expired: number; failed_safe: number; open_workflows: number };
    const r = (await client.query<Counts>(
      `SELECT
         count(*) FILTER (WHERE s.state <> 'withdrawn')::int AS eligible_slots,
         count(*) FILTER (WHERE ${FILLED_SQL})::int AS booked_verified,
         count(*) FILTER (WHERE s.state = 'pending_verification')::int AS pending_verification,
         count(*) FILTER (WHERE w.outcome = 'expired')::int AS expired,
         count(*) FILTER (WHERE w.state = 'FAILED_SAFE')::int AS failed_safe,
         count(*) FILTER (WHERE w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF'))::int AS open_workflows
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.received_at > NOW() - make_interval(days => $2) AND ($1::text IS NULL OR s.organisation_id = $1) AND s.source <> 'simulation'`,
      [orgId ?? null, windowDays]
    )).rows[0]!;
    const h = (await client.query<{ total: number; open: number; overdue: number }>(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE closed_at IS NULL)::int AS open,
              count(*) FILTER (WHERE closed_at IS NULL AND due_at < NOW())::int AS overdue
       FROM aksh.handoff_tasks WHERE created_at > NOW() - make_interval(days => $2) AND ($1::text IS NULL OR organisation_id = $1)`,
      [orgId ?? null, windowDays]
    )).rows[0]!;
    return {
      metricVersion: "slot-fill-v1.2",
      windowDays,
      definition: FILL_DEFINITION,
      fillRatePct: r.eligible_slots ? Math.round((r.booked_verified / r.eligible_slots) * 1000) / 10 : null,
      ...r,
      handoffs: h,
      mode: "shadow",
      verified: false as const,
      note: "Shadow mode: no messages are sent by Aksh. Lift is only claimed against a baseline locked with the organisation before go-live.",
    };
  });
}

export const handoffActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("acknowledge") }),
  z.object({
    action: z.literal("close"),
    disposition: z.string().trim().min(2).max(200),
    // What happened to the patient: back on the waiting list, or booked (confirmed by the person closing it).
    outcome: z.enum(["released", "booked"]).default("released"),
  }),
]);

/** A hand-off is acknowledged by a named person, then closed with a disposition. It can never disappear silently. */
export async function updateHandoff(ctx: NetworkContext, handoffId: string, input: z.infer<typeof handoffActionSchema>) {
  requireStaff(ctx);
  return withTenant(ctx, async (client) => {
    const h = (await client.query<{ id: string; organisation_id: string; acknowledged_at: Date | null; closed_at: Date | null; workflow_id: string | null }>(
      `SELECT id, organisation_id, acknowledged_at, closed_at, workflow_id FROM aksh.handoff_tasks WHERE id = $1 FOR UPDATE`,
      [handoffId]
    )).rows[0];
    if (!h) throw new NetworkError("Hand-off not found", 404);
    if (h.closed_at) throw new NetworkError("Hand-off already closed", 409);
    if (input.action === "acknowledge") {
      if (!h.acknowledged_at) await client.query(`UPDATE aksh.handoff_tasks SET acknowledged_by = $2, acknowledged_at = NOW() WHERE id = $1`, [h.id, ctx.userId]);
    } else {
      await client.query(
        `UPDATE aksh.handoff_tasks SET acknowledged_by = COALESCE(acknowledged_by, $2), acknowledged_at = COALESCE(acknowledged_at, NOW()), disposition = $3, closed_at = NOW() WHERE id = $1`,
        [h.id, ctx.userId, input.disposition]
      );
      if (h.workflow_id) {
        // Resolve the patient's place so nobody is left stuck as "offered" after a hand-off.
        const wf = (await client.query<{ state: string; slot_id: string; selected_candidate_id: string | null }>(
          `SELECT state, slot_id, selected_candidate_id FROM aksh.access_workflows WHERE id = $1 FOR UPDATE`,
          [h.workflow_id]
        )).rows[0]!;
        const entryId = wf.selected_candidate_id
          ? (await client.query<{ waitlist_entry_id: string }>(`SELECT waitlist_entry_id FROM aksh.access_candidates WHERE id = $1`, [wf.selected_candidate_id])).rows[0]?.waitlist_entry_id
          : undefined;
        const closesWorkflow = ["HANDOFF", "FAILED_SAFE"].includes(wf.state);
        if (input.outcome === "booked") {
          if (entryId) await client.query(`UPDATE aksh.waitlist_entries SET status = 'booked' WHERE id = $1`, [entryId]);
          await client.query(`UPDATE aksh.access_slots SET state = 'booked' WHERE id = $1`, [wf.slot_id]);
        } else {
          if (entryId) await client.query(`UPDATE aksh.waitlist_entries SET status = 'waiting' WHERE id = $1 AND status = 'offered'`, [entryId]);
          if (closesWorkflow) await client.query(`UPDATE aksh.access_slots SET state = 'withdrawn' WHERE id = $1 AND state <> 'booked'`, [wf.slot_id]);
        }
        if (closesWorkflow) {
          await client.query(`UPDATE aksh.access_workflows SET state = 'CLOSED', outcome = $2, updated_at = NOW() WHERE id = $1`, [h.workflow_id, input.outcome === "booked" ? "booked" : "handed_off"]);
        }
        await client.query(
          `INSERT INTO aksh.access_actions (organisation_id, workflow_id, action_type, idempotency_key, actor_user_id, from_state, to_state, result_code, detail, environment)
           VALUES ($1, $2, 'handoff_closed', $3, $4, $5, $6, $7, $8::jsonb, $9)`,
          [h.organisation_id, h.workflow_id, `handoff-close:${h.id}`, ctx.userId, wf.state, closesWorkflow ? "CLOSED" : wf.state,
           input.outcome === "booked" ? "HANDOFF_CLOSED_BOOKED" : "HANDOFF_CLOSED_RELEASED", JSON.stringify({ disposition: input.disposition }), getDeploymentEnvironment()]
        );
      }
    }
    return { id: h.id, action: input.action };
  });
}

export async function listHandoffs(ctx: NetworkContext, includeClosed = false) {
  requireStaff(ctx);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT h.id, h.organisation_id, h.workflow_id, h.queue, h.reason, h.context, h.priority, h.due_at, h.created_at, h.acknowledged_at, h.disposition, h.closed_at,
              (h.closed_at IS NULL AND h.due_at < NOW()) AS overdue
       FROM aksh.handoff_tasks h WHERE ($1 OR h.closed_at IS NULL) ORDER BY h.closed_at NULLS FIRST, h.due_at`,
      [includeClosed]
    )).rows
  );
}

export const accessSettingsSchema = z.object({
  reasonOrder: z.array(z.enum(["overdue_care", "patient_request", "clinician_request"])).min(1).max(3).optional(),
  maxOffersPer30Days: z.number().int().min(1).max(20).optional(),
  suppressedChannels: z.array(z.enum(["sms", "phone", "email", "app", "whatsapp"])).max(5).optional(),
});

export async function getAccessSettings(ctx: NetworkContext, orgId: string) {
  requireStaff(ctx, orgId);
  return withTenant(ctx, async (client) =>
    resolveSettings((await client.query<{ access_settings: unknown }>(`SELECT access_settings FROM aksh.organisations WHERE id = $1`, [orgId])).rows[0]?.access_settings)
  );
}

/** Organisation admins own the ranking order, offer frequency cap and suppressed channels. */
export async function updateAccessSettings(ctx: NetworkContext, orgId: string, input: z.infer<typeof accessSettingsSchema>) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can change slot-fill settings", 403);
  return withTenant(ctx, async (client) => {
    const current = resolveSettings((await client.query<{ access_settings: unknown }>(`SELECT access_settings FROM aksh.organisations WHERE id = $1`, [orgId])).rows[0]?.access_settings);
    const next = resolveSettings({ ...current, ...input });
    await client.query(`UPDATE aksh.organisations SET access_settings = $2::jsonb WHERE id = $1`, [orgId, JSON.stringify(next)]);
    await client.query(
      `INSERT INTO aksh.network_audit_events (organisation_id, actor_user_id, action, resource_type, resource_id, detail, environment) VALUES ($1, $2, 'access.settings.updated', 'organisation', $1, $3::jsonb, $4)`,
      [orgId, ctx.userId, JSON.stringify(next), getDeploymentEnvironment()]
    );
    return next;
  });
}

/**
 * Close every workflow whose offer window has passed (cron backstop; actions also expire lazily). Runs as owner across
 * organisations. Workflows awaiting read-back are never expired automatically: they are handed to a person instead.
 */
export async function sweepExpiredSlots() {
  return withPrivileged(async (client) => {
    const env = getDeploymentEnvironment();
    const due = (await client.query<{ id: string; organisation_id: string; state: string; slot_id: string; selected_candidate_id: string | null }>(
      `SELECT w.id, w.organisation_id, w.state, w.slot_id, w.selected_candidate_id FROM aksh.access_workflows w
       JOIN aksh.access_slots s ON s.id = w.slot_id
       WHERE s.offer_expires_at <= NOW() AND w.state NOT IN ('CLOSED', 'HANDOFF', 'FAILED_SAFE') FOR UPDATE OF w`
    )).rows;
    let expired = 0;
    let handedOff = 0;
    for (const wf of due) {
      if (wf.state === "PENDING_VERIFICATION") {
        await client.query(
          `INSERT INTO aksh.handoff_tasks (organisation_id, workflow_id, reason, context, priority, due_at)
           SELECT $1, $2, 'Offer window closed while booking awaited read-back', 'Check the schedule and confirm or release the slot', 'soon', NOW() + INTERVAL '4 hours'
           WHERE NOT EXISTS (SELECT 1 FROM aksh.handoff_tasks WHERE workflow_id = $2 AND closed_at IS NULL)`,
          [wf.organisation_id, wf.id]
        );
        handedOff += 1;
        continue;
      }
      if (wf.selected_candidate_id) {
        await client.query(`UPDATE aksh.waitlist_entries SET status = 'waiting' WHERE id IN (SELECT waitlist_entry_id FROM aksh.access_candidates WHERE id = $1) AND status = 'offered'`, [wf.selected_candidate_id]);
      }
      await client.query(`UPDATE aksh.access_slots SET state = 'expired' WHERE id = $1`, [wf.slot_id]);
      await client.query(`UPDATE aksh.access_workflows SET state = 'CLOSED', outcome = 'expired', updated_at = NOW() WHERE id = $1`, [wf.id]);
      await client.query(
        `INSERT INTO aksh.access_actions (organisation_id, workflow_id, action_type, idempotency_key, from_state, to_state, result_code, environment)
         VALUES ($1, $2, 'expire', $3, $4, 'CLOSED', 'SLOT_EXPIRED', $5) ON CONFLICT (idempotency_key) DO NOTHING`,
        [wf.organisation_id, wf.id, `expire:${wf.id}`, wf.state, env]
      );
      expired += 1;
    }
    return { checked: due.length, expired, handedOff };
  });
}
