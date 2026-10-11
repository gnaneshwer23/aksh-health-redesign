/**
 * CGM uploads and views. The file is always parsed on the server (preview and commit both re-read it); readings are
 * stored once per patient and instant (duplicates across overlapping exports are skipped); summaries are written to
 * the clinical record only when the data meet the consensus sufficiency rule (14 days, 70% wear).
 *
 * Who uploaded matters: a patient's own export is recorded as patient-reported (excluded from clinical summaries until
 * a clinician checks it, as with Week 7 readings); a clinic upload is recorded as device data.
 */
import type { PoolClient } from "pg";
import { z } from "zod";

import { audit, withTenant, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

import { agp, computeMetrics, type CgmMetrics, type CgmPoint } from "./metrics";
import { parseCgmExport, type DateOrder } from "./parse";

export const cgmUploadSchema = z.object({
  csv: z.string().min(10),
  dateOrder: z.enum(["iso", "dmy", "mdy"]).optional(),
  filename: z.string().max(120).optional(),
});

// Individual CGM data is clinical: clinicians only (practice managers work the operational screens, not glucose traces).
const STAFF_ROLES = new Set(["gp", "nurse", "clinical-pharmacist"]);
const MAX_BYTES = 6 * 1024 * 1024;
const BATCH = 5000;

type Who = { kind: "patient" | "staff"; patientId: string };

async function resolve(ctx: NetworkContext, client: PoolClient, patientId: string): Promise<Who & { timeZone: string | null; glucoseUnit: string }> {
  const row = (await client.query<{ tz: string | null; unit: string | null }>(
    `SELECT o.locale->>'timezone' AS tz, o.locale->>'glucoseUnit' AS unit FROM aksh.network_patients p LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE WHERE p.id = $1`,
    [patientId]
  )).rows[0];
  if (!row) throw new NetworkError("Patient not found", 404);
  if (ctx.role === "patient") {
    if (!ctx.patientIds.includes(patientId)) throw new NetworkError("Patient not found", 404);
    return { kind: "patient", patientId, timeZone: row.tz, glucoseUnit: row.unit ?? "mmol/L" };
  }
  if (!STAFF_ROLES.has(ctx.role ?? "")) throw new NetworkError("Only clinicians can see or upload individual CGM data", 403);
  return { kind: "staff", patientId, timeZone: row.tz, glucoseUnit: row.unit ?? "mmol/L" };
}

function summarise(parsed: ReturnType<typeof parseCgmExport>) {
  const points: CgmPoint[] = parsed.rows;
  const last = points.length ? Date.parse(points[points.length - 1]!.at) : Date.now();
  return {
    format: parsed.format,
    unit: parsed.unit,
    dateOrder: parsed.dateOrder,
    rowsRead: parsed.rowsRead,
    readings: parsed.rows.length,
    rejected: parsed.rejected.length,
    rejectedSample: parsed.rejected.slice(0, 10),
    from: points[0]?.at ?? null,
    to: points[points.length - 1]?.at ?? null,
    // Metrics over the most recent 14 days in the file.
    metrics: computeMetrics(points, 14, last + 1),
    problem: parsed.problem ?? null,
  };
}

export async function previewUpload(ctx: NetworkContext, patientId: string, text: string, dateOrder?: DateOrder) {
  if (Buffer.byteLength(text, "utf8") > MAX_BYTES) throw new NetworkError("File too large (6 MB). Export a shorter period.", 413);
  return withTenant(ctx, async (client) => {
    const who = await resolve(ctx, client, patientId);
    if (!who.timeZone) throw new NetworkError("The clinic has not set its time zone (Organisation → Settings); CGM times can't be read without it.", 409);
    const parsed = parseCgmExport(text, who.timeZone, dateOrder);
    const s = summarise(parsed);
    const existing = parsed.rows.length
      ? (await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM aksh.cgm_readings WHERE patient_id = $1 AND at = ANY($2::timestamptz[])`, [patientId, parsed.rows.map((r) => r.at)])).rows[0]!.n
      : 0;
    return { ...s, ok: parsed.ok, alreadyStored: existing, timeZone: who.timeZone };
  });
}

const SUMMARY_KINDS: [string, (m: CgmMetrics) => number, string][] = [
  ["cgm_time_in_range", (m) => m.pct.inRange, "%"],
  ["cgm_time_below_range", (m) => Math.round((m.pct.veryLow + m.pct.low) * 10) / 10, "%"],
  ["cgm_time_below_54", (m) => m.pct.veryLow, "%"],
  ["cgm_time_above_range", (m) => Math.round((m.pct.high + m.pct.veryHigh) * 10) / 10, "%"],
  ["cgm_time_above_250", (m) => m.pct.veryHigh, "%"],
  ["cgm_mean_glucose", (m) => m.meanMmol, "mmol/L"],
  ["cgm_gmi", (m) => m.gmiMmolMol, "mmol/mol"],
  ["cgm_cv", (m) => m.cvPct, "%"],
  ["cgm_wear", (m) => m.wearPct, "%"],
];

export async function commitUpload(ctx: NetworkContext, patientId: string, text: string, dateOrder: DateOrder | undefined, filename?: string) {
  if (Buffer.byteLength(text, "utf8") > MAX_BYTES) throw new NetworkError("File too large (6 MB). Export a shorter period.", 413);
  return withTenant(ctx, async (client) => {
    const who = await resolve(ctx, client, patientId);
    if (!who.timeZone) throw new NetworkError("The clinic has not set its time zone (Organisation → Settings).", 409);
    const parsed = parseCgmExport(text, who.timeZone, dateOrder);
    if (!parsed.ok) throw new NetworkError(parsed.problem ?? "Nothing to import", 400);
    const upload = (await client.query<{ id: string }>(
      `INSERT INTO aksh.cgm_uploads (patient_id, uploaded_by, uploader_kind, format, filename, timezone, rows_read, rows_accepted, rows_duplicate, rows_rejected, first_at, last_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10) RETURNING id`,
      [patientId, ctx.userId, who.kind, parsed.format, filename?.slice(0, 120) ?? null, who.timeZone, parsed.rowsRead, parsed.rejected.length, parsed.rows[0]!.at, parsed.rows[parsed.rows.length - 1]!.at]
    )).rows[0]!.id;
    let inserted = 0;
    for (let i = 0; i < parsed.rows.length; i += BATCH) {
      const r = await client.query(
        `INSERT INTO aksh.cgm_readings (patient_id, at, mmol, censored, upload_id)
         SELECT $1, x.at, x.mmol, x.censored, $2 FROM jsonb_to_recordset($3::jsonb) AS x(at timestamptz, mmol numeric, censored text)
         ON CONFLICT (patient_id, at) DO NOTHING`,
        [patientId, upload, JSON.stringify(parsed.rows.slice(i, i + BATCH))]
      );
      inserted += r.rowCount ?? 0;
    }
    // The upload row is append-only; record the counts in the audit trail instead of updating it.
    await audit(client, { actorUserId: ctx.userId, action: "cgm.uploaded", resourceType: "patient", resourceId: patientId, detail: { uploadId: upload, format: parsed.format, accepted: inserted, duplicate: parsed.rows.length - inserted, rejected: parsed.rejected.length, by: who.kind } });

    const { metrics, summarised } = await refreshSummaries(client, ctx.userId, patientId, who.kind === "patient" ? "patient_reported" : "device", upload);
    return { uploadId: upload, accepted: inserted, duplicate: parsed.rows.length - inserted, rejected: parsed.rejected.length, metrics, summarised };
  });
}

/** Recompute the latest-14-day metrics and, when the data are sufficient, write the summary observations once per batch. */
export async function refreshSummaries(client: PoolClient, actorUserId: string | null, patientId: string, source: "patient_reported" | "device", batchRef: string) {
  // Verified (device) summaries use only trusted readings: clinic uploads, device feeds, and patient uploads a clinician
  // reviewed. A patient's own summary uses everything they sent and stays unverified.
  const table = source === "device" ? "aksh.cgm_trusted_readings" : "aksh.cgm_readings";
  const latest = (await client.query<{ at: Date | null }>(`SELECT max(at) AS at FROM ${table} WHERE patient_id = $1`, [patientId])).rows[0]!.at;
  if (!latest) return { metrics: null, summarised: false };
  const points = await loadPoints(client, patientId, new Date(latest.getTime() - 14 * 86_400_000), latest, table);
  const metrics = computeMetrics(points, 14, latest.getTime() + 1);
  if (!metrics?.sufficient) return { metrics, summarised: false };
  for (const [kind, value, unit] of SUMMARY_KINDS) {
    await client.query(
      // Clinic uploads and device feeds are verified on entry (the clinic chose the source); a patient's own export
      // waits for a clinician, like any patient-reported data.
      `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, verified_by, verified_at, recorded_by, client_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $7 THEN NOW() END, $8, $9) ON CONFLICT (patient_id, client_ref) WHERE client_ref IS NOT NULL DO NOTHING`,
      [patientId, kind, value(metrics), unit, latest, source, source === "device", actorUserId, `cgm-${batchRef}-${kind}`]
    );
  }
  return { metrics, summarised: true };
}

async function loadPoints(client: PoolClient, patientId: string, from: Date, to: Date, table = "aksh.cgm_readings"): Promise<CgmPoint[]> {
  // `table` is one of two fixed names, never input.
  return (await client.query<{ at: Date; mmol: string }>(
    `SELECT at, mmol FROM ${table === "aksh.cgm_trusted_readings" ? "aksh.cgm_trusted_readings" : "aksh.cgm_readings"} WHERE patient_id = $1 AND at > $2 AND at <= $3 ORDER BY at`,
    [patientId, from, to]
  )).rows.map((r) => ({ at: r.at.toISOString(), mmol: Number(r.mmol) }));
}

/** The latest 14 days of CGM for a patient: metrics, AGP and upload history. */
export async function getCgm(ctx: NetworkContext, patientId: string) {
  return withTenant(ctx, async (client) => {
    const who = await resolve(ctx, client, patientId);
    const latest = (await client.query<{ at: Date | null }>(`SELECT max(at) AS at FROM aksh.cgm_readings WHERE patient_id = $1`, [patientId])).rows[0]!.at;
    const uploads = (await client.query(
      `SELECT id, uploader_kind AS "uploaderKind", format, filename, rows_read AS "rowsRead", first_at AS "firstAt", last_at AS "lastAt", created_at AS "createdAt"
       FROM aksh.cgm_uploads WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [patientId]
    )).rows;
    // A patient's own uploads count clinically only after a clinician reviews them.
    const pendingPatientUploads = who.kind === "staff"
      ? (await client.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM aksh.cgm_uploads u WHERE u.patient_id = $1 AND u.uploader_kind = 'patient'
             AND NOT EXISTS (SELECT 1 FROM aksh.cgm_upload_reviews v WHERE v.upload_id = u.id)`,
          [patientId]
        )).rows[0]!.n
      : 0;
    if (!latest) return { patientId, timeZone: who.timeZone, glucoseUnit: who.glucoseUnit, latest: null, metrics: null, agp: [], uploads, stale: false, pendingPatientUploads };
    const points = await loadPoints(client, patientId, new Date(latest.getTime() - 14 * 86_400_000), latest);
    return {
      patientId,
      timeZone: who.timeZone,
      glucoseUnit: who.glucoseUnit,
      latest: latest.toISOString(),
      // Data more than 3 days old is shown, but labelled: it describes then, not now.
      stale: Date.now() - latest.getTime() > 3 * 86_400_000,
      metrics: computeMetrics(points, 14, latest.getTime() + 1),
      agp: agp(points, who.timeZone ?? "UTC"),
      uploads,
      pendingPatientUploads,
    };
  });
}

/**
 * A clinician reviews a patient's own CGM uploads: records the review (append-only), marks the patient's summary
 * observations checked, and recomputes the verified summary now that the readings are trusted.
 */
export async function reviewPatientUploads(ctx: NetworkContext, patientId: string) {
  return withTenant(ctx, async (client) => {
    const who = await resolve(ctx, client, patientId);
    if (who.kind !== "staff") throw new NetworkError("Only clinicians review CGM uploads", 403);
    const reviewed = await client.query(
      `INSERT INTO aksh.cgm_upload_reviews (upload_id, reviewed_by)
       SELECT u.id, $2 FROM aksh.cgm_uploads u WHERE u.patient_id = $1 AND u.uploader_kind = 'patient'
         AND NOT EXISTS (SELECT 1 FROM aksh.cgm_upload_reviews v WHERE v.upload_id = u.id)
       RETURNING upload_id`,
      [patientId, ctx.userId]
    );
    const verified = await client.query(
      `UPDATE aksh.network_observations SET verified = TRUE, verified_by = $2, verified_at = NOW()
       WHERE patient_id = $1 AND kind LIKE 'cgm\\_%' AND source = 'patient_reported' AND NOT verified AND status = 'final'`,
      [patientId, ctx.userId]
    );
    const summary = reviewed.rowCount ? await refreshSummaries(client, ctx.userId, patientId, "device", `review-${Date.now()}`) : { summarised: false };
    await audit(client, { actorUserId: ctx.userId, action: "cgm.reviewed", resourceType: "patient", resourceId: patientId, detail: { uploads: reviewed.rowCount, summaries: verified.rowCount } });
    return { uploadsReviewed: reviewed.rowCount ?? 0, summariesChecked: verified.rowCount ?? 0, summarised: summary.summarised };
  });
}
