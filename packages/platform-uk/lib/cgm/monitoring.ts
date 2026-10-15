/**
 * CGM monitoring for clinicians: every patient they can see with CGM data in the last 30 days, metrics over the most
 * recent 14 days, ranked by urgency (hypoglycaemia first, then data that stopped arriving, then hyperglycaemia, then data
 * quality). A worklist, not an alarm: Aksh does not watch CGM in real time and says so.
 */
import { withTenant, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

import { consensusFlags, urgency } from "./metrics";

const CLINICAL = new Set(["gp", "nurse", "clinical-pharmacist"]);
const round1 = (x: number) => Math.round(x * 10) / 10;

type Agg = {
  patient_id: string;
  name: string;
  record_ref: string | null;
  organisation: string;
  glucose_unit: string | null;
  n: number;
  first_at: Date;
  last_at: Date;
  mean: string;
  sd: string | null;
  very_low: number;
  low: number;
  in_range: number;
  very_high: number;
  unchecked: number;
};

export async function listMonitoring(ctx: NetworkContext) {
  if (!CLINICAL.has(ctx.role ?? "")) throw new NetworkError("Only clinicians use CGM monitoring", 403);
  return withTenant(ctx, async (client) => {
    // Patients this user may see (row-level security), first: the readings scans below then use the (patient, time)
    // index instead of checking access on every reading in the table.
    const ids = (await client.query<{ id: string }>(`SELECT id FROM aksh.network_patients`)).rows.map((r) => r.id);
    if (!ids.length) return [];
    // Trusted readings only (clinic uploads, device feeds, reviewed patient uploads); unreviewed patient uploads are
    // flagged for review instead of changing the worklist. Cadence comes from short gaps, so long gaps count as missing.
    const rows = (await client.query<Agg & { median_gap: string | null }>(
      `WITH latest AS (
         SELECT patient_id, max(at) AS last_at FROM aksh.cgm_trusted_readings WHERE patient_id = ANY($1) AND at > NOW() - INTERVAL '30 days' GROUP BY patient_id
       ), win AS (
         SELECT r.patient_id, r.at, r.mmol, EXTRACT(EPOCH FROM r.at - lag(r.at) OVER (PARTITION BY r.patient_id ORDER BY r.at)) / 60 AS gap
         FROM latest l JOIN aksh.cgm_trusted_readings r ON r.patient_id = l.patient_id AND r.at > l.last_at - INTERVAL '14 days' AND r.at <= l.last_at
       )
       SELECT w.patient_id, p.given_name || ' ' || p.family_name AS name, p.record_ref, o.name AS organisation, o.locale->>'glucoseUnit' AS glucose_unit,
              count(*)::int AS n, min(w.at) AS first_at, l.last_at, avg(w.mmol) AS mean, stddev_samp(w.mmol) AS sd,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY w.gap) FILTER (WHERE w.gap > 0 AND w.gap <= 20) AS median_gap,
              count(*) FILTER (WHERE w.mmol < 3.0)::int AS very_low,
              count(*) FILTER (WHERE w.mmol >= 3.0 AND w.mmol < 3.9)::int AS low,
              count(*) FILTER (WHERE w.mmol >= 3.9 AND w.mmol <= 10.0)::int AS in_range,
              count(*) FILTER (WHERE w.mmol > 13.9)::int AS very_high,
              (SELECT count(*)::int FROM aksh.cgm_uploads u WHERE u.patient_id = w.patient_id AND u.uploader_kind = 'patient'
                 AND NOT EXISTS (SELECT 1 FROM aksh.cgm_upload_reviews v WHERE v.upload_id = u.id)) AS unchecked
       FROM win w
       JOIN latest l ON l.patient_id = w.patient_id
       JOIN aksh.network_patients p ON p.id = w.patient_id
       LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE
       GROUP BY w.patient_id, p.given_name, p.family_name, p.record_ref, o.name, o.locale->>'glucoseUnit', l.last_at`,
      [ids]
    )).rows;
    // Patients whose only recent CGM data is an unreviewed patient upload: listed so the upload can be found and reviewed.
    const pendingOnly = (await client.query<{ patient_id: string; name: string; record_ref: string | null; organisation: string | null; last_at: Date }>(
      `SELECT p.id AS patient_id, p.given_name || ' ' || p.family_name AS name, p.record_ref, o.name AS organisation, max(u.last_at) AS last_at
       FROM aksh.cgm_uploads u JOIN aksh.network_patients p ON p.id = u.patient_id
       LEFT JOIN LATERAL aksh.org_public(p.organisation_id) o ON TRUE
       WHERE u.patient_id = ANY($1) AND u.uploader_kind = 'patient' AND u.created_at > NOW() - INTERVAL '30 days'
         AND NOT EXISTS (SELECT 1 FROM aksh.cgm_upload_reviews v WHERE v.upload_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM aksh.cgm_trusted_readings t WHERE t.patient_id = u.patient_id AND t.at > NOW() - INTERVAL '30 days')
       GROUP BY p.id, p.given_name, p.family_name, p.record_ref, o.name`,
      [ids]
    )).rows;
    const now = Date.now();
    const pendingRows = pendingOnly.map((a) => ({
      patientId: a.patient_id,
      name: a.name,
      recordRef: a.record_ref,
      organisation: a.organisation ?? "Shared with you",
      lastAt: a.last_at.toISOString(),
      stale: false,
      pct: { veryLow: 0, low: 0, inRange: 0, veryHigh: 0 },
      meanMmol: 0,
      glucoseUnit: "mmol/L",
      cvPct: 0,
      wearPct: 0,
      sufficient: false,
      uncheckedSummary: true,
      flags: ["patient upload waiting for review: open the row to review it"],
      urgency: 5,
    }));
    return [...rows.map((a) => {
        const pct = (k: number) => (k / a.n) * 100;
        const veryLow = pct(a.very_low);
        const low = pct(a.low);
        const inRange = pct(a.in_range);
        const veryHigh = pct(a.very_high);
        const span = (a.last_at.getTime() - a.first_at.getTime()) / 60_000;
        // Supported sensor cadences only (5 or 15 minutes); sparse data shows up as low wear, not a slow sensor.
        const interval = a.median_gap !== null && Number(a.median_gap) > 7 ? 15 : 5;
        const wearPct = Math.min(100, (a.n / ((14 * 24 * 60) / interval)) * 100);
        const days = Math.floor((span + interval) / 1440);
        const sufficient = days >= 14 && wearPct >= 70;
        const mean = Number(a.mean);
        const cvPct = a.sd ? (Number(a.sd) / mean) * 100 : 0;
        const hoursSince = (now - a.last_at.getTime()) / 3_600_000;
        const stale = hoursSince > 72;
        const flags = consensusFlags({ veryLow, low, inRange, veryHigh, cvPct, days, wearPct, sufficient }, a.glucose_unit ?? "mmol/L");
        if (stale) flags.unshift(`no CGM data for ${Math.floor(hoursSince / 24)} days`);
        return {
          patientId: a.patient_id,
          name: a.name,
          recordRef: a.record_ref,
          organisation: a.organisation ?? "Shared with you",
          lastAt: a.last_at.toISOString(),
          stale,
          pct: { veryLow: round1(veryLow), low: round1(low), inRange: round1(inRange), veryHigh: round1(veryHigh) },
          meanMmol: round1(mean),
          glucoseUnit: a.glucose_unit ?? "mmol/L",
          cvPct: round1(cvPct),
          wearPct: round1(wearPct),
          sufficient,
          uncheckedSummary: a.unchecked > 0,
          flags,
          urgency: urgency({ veryLow, low, inRange, veryHigh, sufficient, stale }),
        };
      })
      , ...pendingRows].sort((x, y) => x.urgency - y.urgency || x.pct.inRange - y.pct.inRange || x.name.localeCompare(y.name));
  });
}
