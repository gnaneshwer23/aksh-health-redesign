/**
 * Patient readings on the server.
 * - Linked patients: readings go straight into their clinic record (patient_reported, unverified).
 * - Self-registered patients: readings stay in their personal store until they link and choose to share them.
 * - Clinicians: a review list of unverified readings (flagged first) and a verify action. Verification is final.
 * Every write runs in the caller's tenant session, so row-level security and the database guards apply.
 */
import { audit, withTenant, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

import { ReadingError, safetyNotice, toStored, type ReadingInput, type StoredReading } from "./rules";

const CLINICAL_ROLES = new Set(["gp", "nurse", "clinical-pharmacist"]);

export type ReadingRow = {
  id: string;
  kind: string;
  value: number;
  unit: string;
  originalValue: number | null;
  originalUnit: string | null;
  context: string | null;
  flag: string | null;
  observedAt: string;
  status: string;
  clientRef: string | null;
  state: "on_device_account" | "sent" | "checked" | "entered_in_error";
};

async function orgOf(client: import("pg").PoolClient, patientId: string) {
  return (await client.query<{ o: string }>(`SELECT organisation_id AS o FROM aksh.network_patients WHERE id = $1`, [patientId])).rows[0]?.o ?? null;
}

function requirePatient(ctx: NetworkContext) {
  if (ctx.role !== "patient") throw new NetworkError("Patient accounts only", 403);
}

export async function addReading(ctx: NetworkContext, input: ReadingInput) {
  requirePatient(ctx);
  let rows: StoredReading[];
  try {
    rows = toStored(input);
  } catch (e) {
    if (e instanceof ReadingError) throw new NetworkError(e.message, 400);
    throw e;
  }
  const patientId = ctx.patientIds[0];
  return withTenant(ctx, async (client) => {
    let emergencyNumber: string | null = null;
    let replay = false;
    if (patientId) {
      emergencyNumber = (await client.query<{ n: string | null }>(
        `SELECT o.locale->>'emergencyNumber' AS n FROM aksh.network_patients p LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE WHERE p.id = $1`,
        [patientId]
      )).rows[0]?.n ?? null;
      for (const r of rows) {
        const res = await client.query(
          `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by, client_ref, original_value, original_unit, context, flag)
           VALUES ($1, $2, $3, $4, $5, 'patient_reported', FALSE, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (patient_id, client_ref) WHERE client_ref IS NOT NULL DO NOTHING`,
          [patientId, r.kind, r.value, r.unit, input.observedAt, ctx.userId, r.clientRef, r.originalValue, r.originalUnit, r.context ?? null, r.flag]
        );
        if (!res.rowCount) replay = true;
      }
      if (!replay) await audit(client, { organisationId: await orgOf(client, patientId), actorUserId: ctx.userId, action: "reading.recorded", resourceType: "patient", resourceId: patientId, detail: { kind: input.kind, flag: rows[0]!.flag } });
    } else {
      for (const r of rows) {
        const res = await client.query(
          `INSERT INTO aksh.personal_readings (user_id, kind, value, unit, original_value, original_unit, context, flag, observed_at, client_ref)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (user_id, client_ref) DO NOTHING`,
          [ctx.userId, r.kind, r.value, r.unit, r.originalValue, r.originalUnit, r.context ?? null, r.flag, input.observedAt, r.clientRef]
        );
        if (!res.rowCount) replay = true;
      }
    }
    return {
      saved: true,
      replay,
      sharedWithCareTeam: Boolean(patientId),
      flag: rows[0]!.flag,
      notice: safetyNotice(rows[0]!.flag, rows[0]!.kind === "glucose" ? "glucose" : rows[0]!.kind, emergencyNumber),
    };
  });
}

/** The patient's own readings (last 90 days) and how many earlier personal readings could be shared. */
export async function listOwnReadings(ctx: NetworkContext) {
  requirePatient(ctx);
  const patientId = ctx.patientIds[0];
  return withTenant(ctx, async (client) => {
    const personal = (await client.query<ReadingRow>(
      `SELECT id, kind, value::float, unit, original_value::float AS "originalValue", original_unit AS "originalUnit", context, flag,
              observed_at AS "observedAt", status, client_ref AS "clientRef",
              CASE WHEN status = 'entered_in_error' THEN 'entered_in_error' ELSE 'on_device_account' END AS state
       FROM aksh.personal_readings WHERE user_id = $1 AND shared_at IS NULL AND observed_at > NOW() - INTERVAL '90 days' ORDER BY observed_at DESC LIMIT 200`,
      [ctx.userId]
    )).rows;
    const record = patientId
      ? (await client.query<ReadingRow>(
          `SELECT id, kind, value::float, unit, original_value::float AS "originalValue", original_unit AS "originalUnit", context, flag,
                  observed_at AS "observedAt", status, client_ref AS "clientRef",
                  CASE WHEN status = 'entered_in_error' THEN 'entered_in_error' WHEN verified THEN 'checked' ELSE 'sent' END AS state
           FROM aksh.network_observations WHERE patient_id = $1 AND source = 'patient_reported' AND observed_at > NOW() - INTERVAL '90 days'
           ORDER BY observed_at DESC LIMIT 200`,
          [patientId]
        )).rows
      : [];
    const unit = patientId
      ? (await client.query<{ g: string | null; e: string | null }>(
          `SELECT o.locale->>'glucoseUnit' AS g, o.locale->>'emergencyNumber' AS e FROM aksh.network_patients p LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE WHERE p.id = $1`,
          [patientId]
        )).rows[0]
      : undefined;
    return {
      // Lets the device keep its offline queue per account, so a shared phone never sends one person's readings as another's.
      account: ctx.userId,
      linked: Boolean(patientId),
      glucoseUnit: (unit?.g as "mmol/L" | "mg/dL" | null) ?? null,
      emergencyNumber: unit?.e ?? null,
      readings: patientId ? record : personal,
      // Only readings from the last 30 days can be shared: older ones would fall outside the clinicians' review window.
      unsharedPersonal: patientId ? personal.filter((r) => r.status === "final" && Date.parse(r.observedAt) > Date.now() - 30 * 86_400_000).length : 0,
    };
  });
}

/** Mark one of the patient's own unverified readings as entered in error (both halves of a blood pressure). */
export async function markEnteredInError(ctx: NetworkContext, id: string) {
  requirePatient(ctx);
  const patientId = ctx.patientIds[0];
  return withTenant(ctx, async (client) => {
    const table = patientId ? "network_observations" : "personal_readings";
    const own = patientId ? `patient_id = $2 AND source = 'patient_reported' AND NOT verified` : `user_id = $2`;
    const row = (await client.query<{ client_ref: string | null }>(`SELECT client_ref FROM aksh.${table} WHERE id = $1 AND ${own}`, [id, patientId ?? ctx.userId])).rows[0];
    if (!row) throw new NetworkError("Reading not found, or already checked by your care team", 404);
    const base = row.client_ref?.replace(/-(sys|dia)$/, "");
    const changed = await client.query(
      `UPDATE aksh.${table} SET status = 'entered_in_error' WHERE ${own} AND status = 'final' AND (id = $1 OR ($3::text IS NOT NULL AND client_ref IN ($3 || '-sys', $3 || '-dia')))`,
      [id, patientId ?? ctx.userId, row.client_ref !== base ? base : null]
    );
    if (patientId && changed.rowCount) await audit(client, { organisationId: await orgOf(client, patientId), actorUserId: ctx.userId, action: "reading.entered_in_error", resourceType: "observation", resourceId: id });
    return { id, status: "entered_in_error" };
  });
}

/** After linking, the patient may share readings they recorded before joining. Their choice; nothing moves without it. */
export async function shareEarlierReadings(ctx: NetworkContext) {
  requirePatient(ctx);
  const patientId = ctx.patientIds[0];
  if (!patientId) throw new NetworkError("Link your account to your clinic first", 409);
  return withTenant(ctx, async (client) => {
    const moved = await client.query(
      `WITH src AS (
         SELECT id, kind, value, unit, original_value, original_unit, context, flag, observed_at, client_ref
         FROM aksh.personal_readings WHERE user_id = $2 AND shared_at IS NULL AND status = 'final' AND observed_at > NOW() - INTERVAL '30 days'
       ), ins AS (
         INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by, client_ref, original_value, original_unit, context, flag)
         SELECT $1, kind, value, unit, observed_at, 'patient_reported', FALSE, $2, 'p-' || client_ref, original_value, original_unit, context, flag FROM src
         ON CONFLICT (patient_id, client_ref) WHERE client_ref IS NOT NULL DO NOTHING
         RETURNING 1
       )
       UPDATE aksh.personal_readings r SET shared_to_patient_id = $1, shared_at = NOW() FROM src WHERE r.id = src.id
       RETURNING (SELECT count(*) FROM ins)::int AS inserted`,
      [patientId, ctx.userId]
    );
    await audit(client, { organisationId: await orgOf(client, patientId), actorUserId: ctx.userId, action: "reading.shared_earlier", resourceType: "patient", resourceId: patientId, detail: { count: moved.rowCount } });
    return { shared: moved.rowCount ?? 0 };
  });
}

// ---------------------------------------------------------------- clinicians

/** Unverified patient and device readings for patients the clinician can see; flagged first, newest first. */
export async function listReadingsToReview(ctx: NetworkContext, patientId?: string, offset = 0) {
  if (!CLINICAL_ROLES.has(ctx.role ?? "")) throw new NetworkError("Only clinicians review readings", 403);
  return withTenant(ctx, async (client) => {
    const rows = (await client.query(
      `SELECT x.id, x.patient_id AS "patientId", p.given_name || ' ' || p.family_name AS "patientName", p.record_ref AS "recordRef",
              x.kind, x.value::float, x.unit, x.original_value::float AS "originalValue", x.original_unit AS "originalUnit",
              x.context, x.flag, x.observed_at AS "observedAt", x.client_ref AS "clientRef", x.source, o.locale->>'glucoseUnit' AS "glucoseUnit"
       FROM aksh.network_observations x
       JOIN aksh.network_patients p ON p.id = x.patient_id
       LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE -- cross-organisation care-team patients stay listed
       WHERE x.source IN ('patient_reported', 'device') AND NOT x.verified AND x.status = 'final'
         AND x.kind IN ('glucose', 'systolic_bp', 'diastolic_bp', 'weight') -- CGM summaries are checked on the CGM view
         AND x.observed_at > NOW() - INTERVAL '30 days' AND ($1::text IS NULL OR x.patient_id = $1)
       ORDER BY (x.flag IS NOT NULL) DESC, x.observed_at DESC, x.id LIMIT 200 OFFSET $2`,
      [patientId ?? null, Math.max(0, Math.min(offset, 100_000))]
    )).rows;
    // A blood pressure is two rows; if a page boundary split a pair, fetch the missing half so it shows (and is checked) whole.
    const primaryCount = rows.length;
    const refs = new Set(rows.map((r: { clientRef: string | null }) => r.clientRef));
    const missing = rows
      .filter((r: { kind: string; clientRef: string | null }) => (r.kind === "systolic_bp" || r.kind === "diastolic_bp") && r.clientRef)
      .map((r: { patientId: string; clientRef: string }) => ({ patientId: r.patientId, ref: r.clientRef.endsWith("-sys") ? r.clientRef.replace(/-sys$/, "-dia") : r.clientRef.replace(/-dia$/, "-sys") }))
      .filter((m: { ref: string }) => !refs.has(m.ref));
    if (missing.length) {
      const extra = (await client.query(
        `SELECT x.id, x.patient_id AS "patientId", p.given_name || ' ' || p.family_name AS "patientName", p.record_ref AS "recordRef",
                x.kind, x.value::float, x.unit, x.original_value::float AS "originalValue", x.original_unit AS "originalUnit",
                x.context, x.flag, x.observed_at AS "observedAt", x.client_ref AS "clientRef", x.source, o.locale->>'glucoseUnit' AS "glucoseUnit"
         FROM aksh.network_observations x JOIN aksh.network_patients p ON p.id = x.patient_id
         LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE
         WHERE x.patient_id = ANY($1) AND x.client_ref = ANY($2) AND NOT x.verified AND x.status = 'final'`,
        [missing.map((m: { patientId: string }) => m.patientId), missing.map((m: { ref: string }) => m.ref)]
      )).rows;
      rows.push(...extra);
    }
    return Object.assign(rows, { primaryCount });
  });
}

/** Verify readings (the clinician has looked at them). Verified readings then count in clinical summaries. */
export async function verifyReadings(ctx: NetworkContext, ids: string[]) {
  if (!CLINICAL_ROLES.has(ctx.role ?? "")) throw new NetworkError("Only clinicians verify readings", 403);
  if (!ids.length || ids.length > 200) throw new NetworkError("Verify between 1 and 200 readings at a time", 400);
  return withTenant(ctx, async (client) => {
    const r = await client.query<{ id: string; patient_id: string }>(
      `UPDATE aksh.network_observations SET verified = TRUE, verified_by = $2, verified_at = NOW()
       WHERE id = ANY($1) AND NOT verified AND status = 'final' AND source IN ('patient_reported', 'device') RETURNING id, patient_id`,
      [ids, ctx.userId]
    );
    for (const pid of new Set(r.rows.map((x) => x.patient_id))) {
      await audit(client, { organisationId: await orgOf(client, pid), actorUserId: ctx.userId, action: "reading.verified", resourceType: "patient", resourceId: pid, detail: { count: r.rows.filter((x) => x.patient_id === pid).length } });
    }
    return { verified: r.rowCount ?? 0 };
  });
}
