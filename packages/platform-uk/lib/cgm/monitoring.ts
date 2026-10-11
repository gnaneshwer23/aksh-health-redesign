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
    const rows = (await client.query<Agg>(
      `WITH latest AS (
         SELECT patient_id, max(at) AS last_at FROM aksh.cgm_readings WHERE at > NOW() - INTERVAL '30 days' GROUP BY patient_id
       )
       SELECT r.patient_id, p.given_name || ' ' || p.family_name AS name, p.record_ref, o.name AS organisation,
              count(*)::int AS n, min(r.at) AS first_at, l.last_at, avg(r.mmol) AS mean, stddev_samp(r.mmol) AS sd,
              count(*) FILTER (WHERE r.mmol < 3.0)::int AS very_low,
              count(*) FILTER (WHERE r.mmol >= 3.0 AND r.mmol < 3.9)::int AS low,
              count(*) FILTER (WHERE r.mmol >= 3.9 AND r.mmol <= 10.0)::int AS in_range,
              count(*) FILTER (WHERE r.mmol > 13.9)::int AS very_high,
              (SELECT count(*)::int FROM aksh.network_observations x WHERE x.patient_id = r.patient_id AND x.kind LIKE 'cgm\\_%'
                 AND x.source = 'patient_reported' AND NOT x.verified AND x.status = 'final') AS unchecked
       FROM latest l
       JOIN aksh.cgm_readings r ON r.patient_id = l.patient_id AND r.at > l.last_at - INTERVAL '14 days' AND r.at <= l.last_at
       JOIN aksh.network_patients p ON p.id = r.patient_id
       JOIN aksh.organisations o ON o.id = p.organisation_id
       GROUP BY r.patient_id, p.given_name, p.family_name, p.record_ref, o.name, l.last_at`
    )).rows;
    const now = Date.now();
    return rows
      .map((a) => {
        const pct = (k: number) => (k / a.n) * 100;
        const veryLow = pct(a.very_low);
        const low = pct(a.low);
        const inRange = pct(a.in_range);
        const veryHigh = pct(a.very_high);
        const span = (a.last_at.getTime() - a.first_at.getTime()) / 60_000;
        const gap = a.n > 1 ? span / (a.n - 1) : 5;
        const interval = gap <= 7 ? 5 : gap <= 20 ? 15 : Math.round(gap);
        const wearPct = Math.min(100, (a.n / ((14 * 24 * 60) / interval)) * 100);
        const days = Math.max(1, Math.round(span / 1440));
        const sufficient = days >= 14 && wearPct >= 70;
        const mean = Number(a.mean);
        const cvPct = a.sd ? (Number(a.sd) / mean) * 100 : 0;
        const hoursSince = (now - a.last_at.getTime()) / 3_600_000;
        const stale = hoursSince > 72;
        const flags = consensusFlags({ veryLow, low, inRange, veryHigh, cvPct, days, wearPct, sufficient });
        if (stale) flags.unshift(`no CGM data for ${Math.floor(hoursSince / 24)} days`);
        return {
          patientId: a.patient_id,
          name: a.name,
          recordRef: a.record_ref,
          organisation: a.organisation,
          lastAt: a.last_at.toISOString(),
          stale,
          pct: { veryLow: round1(veryLow), low: round1(low), inRange: round1(inRange), veryHigh: round1(veryHigh) },
          meanMmol: round1(mean),
          cvPct: round1(cvPct),
          wearPct: round1(wearPct),
          sufficient,
          uncheckedSummary: a.unchecked > 0,
          flags,
          urgency: urgency({ veryLow, low, inRange, veryHigh, sufficient, stale }),
        };
      })
      .sort((x, y) => x.urgency - y.urgency || x.pct.inRange - y.pct.inRange || x.name.localeCompare(y.name));
  });
}
