/**
 * Schedule connector: an organisation's scheduling system reports freed slots and bookings with an API key.
 * - Free slots enter the same validated workflow as manual ones (source partner_api, idempotent on id + version).
 * - A slot that becomes busy before anyone was offered it is withdrawn; after an offer, a person is asked to look.
 * - A booking read back from the schedule closes the workflow as booked only when the patient on the appointment is
 *   the patient staff selected; any other patient means the slot went elsewhere, and a person resolves it.
 * Every message is logged per item with a result code the sending system can act on.
 */
import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";
import { applyAction, CONNECTOR_ROLE, ingestSlot } from "@/lib/access/service";
import { audit, withPrivileged, withTenant, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

import {
  appointmentFromFhir,
  appointmentFromJson,
  BOOKED_STATUSES,
  resourcesOf,
  slotFromFhir,
  slotFromJson,
  type AppointmentFact,
  type ConnectorConfig,
  type SlotFact,
} from "./fhir";

const MAX_ITEMS = 100;
const hashKey = (key: string) => createHash("sha256").update(key.trim()).digest("hex");

export const connectorConfigSchema = z.object({
  typeMap: z.record(z.string().trim().min(1).max(120), z.enum(Object.keys(APPOINTMENT_TYPE_LABEL) as [string, ...string[]])).optional(),
  offerCloseHours: z.number().int().min(0).max(72).optional(),
  site: z.string().trim().max(80).optional(),
});
export const createKeySchema = z.object({ name: z.string().trim().min(2).max(80), config: connectorConfigSchema.optional() });

function requireAdmin(ctx: NetworkContext, orgId: string) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can manage connections", 403);
}

/** The full key is returned once; only its hash is stored. */
export async function createKey(ctx: NetworkContext, orgId: string, input: z.infer<typeof createKeySchema>) {
  requireAdmin(ctx, orgId);
  const key = `aksh_${randomBytes(32).toString("base64url")}`;
  return withTenant(ctx, async (client) => {
    const r = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO aksh.connector_keys (organisation_id, name, key_prefix, key_hash, config, created_by) VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING id, created_at`,
      [orgId, input.name, key.slice(0, 12), hashKey(key), JSON.stringify(input.config ?? {}), ctx.userId]
    );
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "connector.key.created", resourceType: "connector_key", resourceId: r.rows[0]!.id, detail: { name: input.name } });
    return { id: r.rows[0]!.id, key, keyPrefix: key.slice(0, 12), name: input.name };
  });
}

export async function listKeys(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT id, name, key_prefix AS "keyPrefix", config, created_at AS "createdAt", last_used_at AS "lastUsedAt", revoked_at AS "revokedAt"
       FROM aksh.connector_keys WHERE organisation_id = $1 ORDER BY revoked_at NULLS FIRST, created_at DESC`,
      [orgId]
    )).rows
  );
}

export async function updateKeyConfig(ctx: NetworkContext, orgId: string, keyId: string, config: z.infer<typeof connectorConfigSchema>) {
  requireAdmin(ctx, orgId);
  return withTenant(ctx, async (client) => {
    // Merge: settings left out of the request are kept (send typeMap: {} to clear the mapping).
    const r = await client.query(`UPDATE aksh.connector_keys SET config = config || $3::jsonb WHERE id = $1 AND organisation_id = $2 AND revoked_at IS NULL RETURNING id, config`, [keyId, orgId, JSON.stringify(config)]);
    if (!r.rows[0]) throw new NetworkError("Connection not found", 404);
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "connector.key.updated", resourceType: "connector_key", resourceId: keyId });
    return r.rows[0];
  });
}

export async function revokeKey(ctx: NetworkContext, orgId: string, keyId: string) {
  requireAdmin(ctx, orgId);
  return withTenant(ctx, async (client) => {
    const r = await client.query(`UPDATE aksh.connector_keys SET revoked_at = NOW(), revoked_by = $3 WHERE id = $1 AND organisation_id = $2 AND revoked_at IS NULL RETURNING id`, [keyId, orgId, ctx.userId]);
    if (!r.rows[0]) throw new NetworkError("Connection not found or already revoked", 404);
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "connector.key.revoked", resourceType: "connector_key", resourceId: keyId });
    return { id: keyId, revoked: true };
  });
}

export async function listEvents(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) =>
    (await client.query(
      `SELECT e.id, e.kind, e.format, e.external_ref AS "externalRef", e.result_code AS "resultCode", e.detail, e.workflow_id AS "workflowId", e.received_at AS "receivedAt", k.name AS "keyName"
       FROM aksh.connector_events e JOIN aksh.connector_keys k ON k.id = e.key_id WHERE e.organisation_id = $1 ORDER BY e.id DESC LIMIT 50`,
      [orgId]
    )).rows
  );
}

// ---------------------------------------------------------------- inbound

export type ConnectorKey = { id: string; organisationId: string; config: ConnectorConfig };

/** Bearer key → connection. Unknown, revoked, or belonging to a suspended organisation: 401 without detail. */
export async function authenticate(authorization: string | null): Promise<ConnectorKey> {
  const key = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!key || !key.startsWith("aksh_") || key.length > 100) throw new NetworkError("Invalid API key", 401);
  return withPrivileged(async (client) => {
    const r = await client.query<{ id: string; organisation_id: string; config: ConnectorConfig }>(
      `UPDATE aksh.connector_keys k SET last_used_at = NOW() FROM aksh.organisations o
       WHERE k.key_hash = $1 AND k.revoked_at IS NULL AND o.id = k.organisation_id AND o.status <> 'suspended'
       RETURNING k.id, k.organisation_id, k.config`,
      [hashKey(key)]
    );
    if (!r.rows[0]) throw new NetworkError("Invalid API key", 401);
    return { id: r.rows[0].id, organisationId: r.rows[0].organisation_id, config: r.rows[0].config ?? {} };
  });
}

function connectorContext(key: ConnectorKey): NetworkContext {
  return { userId: `connector-${key.id}`, role: CONNECTOR_ROLE, orgIds: [key.organisationId], adminOrgIds: [], patientIds: [], publicDemo: false };
}

type ItemResult = { ref: string | null; result: string; message?: string; workflowId?: string };

async function logEvent(key: ConnectorKey, kind: "slot" | "appointment", format: "fhir" | "json", item: ItemResult) {
  await withPrivileged((client) =>
    client.query(
      `INSERT INTO aksh.connector_events (organisation_id, key_id, kind, format, external_ref, result_code, detail, workflow_id) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
      [key.organisationId, key.id, kind, format, item.ref, item.result, JSON.stringify(item.message ? { message: item.message } : {}), item.workflowId ?? null]
    )
  );
}

const codeOf = (e: unknown) => (e instanceof NetworkError ? (e.message.match(/^([A-Z_]{4,})(:|$)/)?.[1] ?? `HTTP_${e.status}`) : "INTERNAL_ERROR");

async function findWorkflow(key: ConnectorKey, ref: string) {
  return withPrivileged(async (client) =>
    (await client.query<{ workflow_id: string; state: string; selected_candidate_id: string | null; source_version: number }>(
      `SELECT w.id AS workflow_id, w.state, w.selected_candidate_id, s.source_version FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.organisation_id = $1 AND s.source = 'partner_api' AND s.source_ref = $2`,
      [key.organisationId, ref]
    )).rows[0]
  );
}

async function handleSlot(key: ConnectorKey, fact: SlotFact): Promise<ItemResult> {
  if (!fact.ok) return { ref: fact.ref, result: fact.code, message: fact.message };
  const ctx = connectorContext(key);
  if (fact.free) {
    try {
      const r = await ingestSlot(ctx, key.organisationId, {
        source: "partner_api",
        sourceRef: fact.ref,
        sourceVersion: fact.version,
        appointmentType: fact.appointmentType,
        site: fact.site,
        startsAt: fact.startsAt,
        durationMin: fact.durationMin,
        offerExpiresAt: fact.offerExpiresAt,
      });
      return { ref: fact.ref, result: r.replay ? "REPLAY" : "updated" in r && r.updated ? "UPDATED" : "ACCEPTED", workflowId: r.workflowId };
    } catch (e) {
      return { ref: fact.ref, result: codeOf(e), message: e instanceof Error ? e.message : undefined };
    }
  }
  // No longer free in the schedule.
  const wf = await findWorkflow(key, fact.ref);
  if (!wf) return { ref: fact.ref, result: "UNKNOWN_SLOT_IGNORED" };
  // Messages can arrive out of order: a busy notice only applies if it is newer than the version we hold.
  if (fact.version <= wf.source_version) return { ref: fact.ref, result: "STALE_VERSION_IGNORED", message: `Version ${fact.version} is not newer than ${wf.source_version}`, workflowId: wf.workflow_id };
  const idem = `connector:${fact.ref}:${fact.status}:v${fact.version}`;
  try {
    if (["SOURCE_VALIDATED", "ELIGIBILITY_CHECKED", "STAFF_REVIEW", "OFFER_DRAFTED"].includes(wf.state)) {
      await applyAction(ctx, wf.workflow_id, { action: "withdraw", idempotencyKey: idem, reason: `Slot ${fact.status} in the schedule` });
      return { ref: fact.ref, result: "WITHDRAWN", workflowId: wf.workflow_id };
    }
    if (["CONTACT_APPROVED", "RESPONSE_CAPTURED"].includes(wf.state)) {
      await applyAction(ctx, wf.workflow_id, { action: "handoff", idempotencyKey: idem, reason: "Slot taken in the schedule after an offer was approved", priority: "urgent" });
      return { ref: fact.ref, result: "HANDED_OFF", workflowId: wf.workflow_id };
    }
    return { ref: fact.ref, result: wf.state === "PENDING_VERIFICATION" ? "AWAITING_BOOKING_READ_BACK" : "NO_ACTION", workflowId: wf.workflow_id };
  } catch (e) {
    return { ref: fact.ref, result: codeOf(e), message: e instanceof Error ? e.message : undefined, workflowId: wf.workflow_id };
  }
}

async function handleAppointment(key: ConnectorKey, fact: AppointmentFact): Promise<ItemResult> {
  if (!fact.ok) return { ref: fact.ref, result: fact.code, message: fact.message };
  if (!BOOKED_STATUSES.has(fact.status)) return { ref: fact.ref, result: "IGNORED_STATUS" };
  if (!fact.slotRefs.length) return { ref: fact.ref, result: "NO_SLOT_REFERENCE", message: "Appointment.slot must reference the Slot reported earlier" };
  // An appointment can span several slots: act on the one awaiting read-back, whichever position it is in.
  let fallback: ItemResult | null = null;
  for (const slotRef of fact.slotRefs) {
    const wf = await findWorkflow(key, slotRef);
    if (!wf) continue;
    if (wf.state !== "PENDING_VERIFICATION") {
      fallback ??= { ref: fact.ref, result: wf.state === "CLOSED" ? "ALREADY_CLOSED" : "NOT_AWAITING_VERIFICATION", workflowId: wf.workflow_id };
      continue;
    }
    if (!fact.patientIdentifiers.length) return { ref: fact.ref, result: "NO_PATIENT_IDENTIFIER", message: "Include the patient's record number as participant.actor.identifier", workflowId: wf.workflow_id };
    const selected = await withPrivileged(async (client) =>
      (await client.query<{ record_ref: string | null }>(
        `SELECT p.record_ref FROM aksh.access_candidates c JOIN aksh.network_patients p ON p.id = c.patient_id WHERE c.id = $1`,
        [wf.selected_candidate_id]
      )).rows[0]
    );
    const samePatient = Boolean(selected?.record_ref) && fact.patientIdentifiers.includes(selected!.record_ref!);
    try {
      const r = await applyAction(connectorContext(key), wf.workflow_id, {
        action: "confirm_booking",
        idempotencyKey: `connector:appointment:${fact.ref}:${slotRef}`,
        confirmed: samePatient,
        sourceReference: `Appointment/${fact.ref}`.slice(0, 120),
      });
      return { ref: fact.ref, result: samePatient ? (r.replay ? "REPLAY" : "BOOKED_VERIFIED") : "BOOKED_FOR_ANOTHER_PATIENT", workflowId: wf.workflow_id };
    } catch (e) {
      // A concurrent read-back may have closed it first: report this item, keep the batch going.
      return { ref: fact.ref, result: codeOf(e), message: e instanceof Error ? e.message : undefined, workflowId: wf.workflow_id };
    }
  }
  return fallback ?? { ref: fact.ref, result: "UNKNOWN_SLOT_IGNORED" };
}

function collect<T>(body: unknown, fhirType: "Slot" | "Appointment", listKey: "slots" | "appointments", fromFhir: (r: Record<string, unknown>) => T, fromJson: (r: Record<string, unknown>) => T) {
  const fhir = resourcesOf(body, fhirType);
  if (fhir) return { format: "fhir" as const, facts: fhir.map(fromFhir) };
  const b = body as Record<string, unknown> | null;
  const list = Array.isArray(b?.[listKey]) ? (b![listKey] as Record<string, unknown>[]) : b && typeof b === "object" && "id" in b ? [b] : null;
  if (!list) throw new NetworkError(`Send a FHIR ${fhirType} or Bundle, or { "${listKey}": [...] }`, 400);
  return { format: "json" as const, facts: list.map(fromJson) };
}

export async function receiveSlots(key: ConnectorKey, body: unknown) {
  const { format, facts } = collect(body, "Slot", "slots", (r) => slotFromFhir(r, key.config), (r) => slotFromJson(r, key.config));
  if (facts.length > MAX_ITEMS) throw new NetworkError(`At most ${MAX_ITEMS} slots per request`, 413);
  const results: ItemResult[] = [];
  for (const fact of facts) {
    const item = await handleSlot(key, fact);
    await logEvent(key, "slot", format, item);
    results.push(item);
  }
  return { results };
}

export async function receiveAppointments(key: ConnectorKey, body: unknown) {
  const { format, facts } = collect(body, "Appointment", "appointments", appointmentFromFhir, appointmentFromJson);
  if (facts.length > MAX_ITEMS) throw new NetworkError(`At most ${MAX_ITEMS} appointments per request`, 413);
  const results: ItemResult[] = [];
  for (const fact of facts) {
    const item = await handleAppointment(key, fact);
    await logEvent(key, "appointment", format, item);
    results.push(item);
  }
  return { results };
}
