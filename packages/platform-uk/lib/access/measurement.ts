/**
 * Measurement against the baseline the organisation locked at go-live. Same metric definition as the pilot metric
 * (slot-fill-v1.1): see FILLED_SQL. Before go-live the period is the last 30
 * days and labelled rehearsal. No verdict until both sides have enough slots; the interval is shown, not hidden.
 */
import { deriveItems, type GoLiveEvent } from "@/lib/golive/checklist";
import { withPrivileged, type NetworkContext } from "@/lib/network/db";
import { NetworkError } from "@/lib/network/service";

export const MIN_SLOTS_TO_COMPARE = 20;

export type Comparison = { verdict: "too_early" | "above" | "similar" | "below"; differencePts: number | null; ci95: [number, number] | null };

/** Wilson score interval for one proportion (95%). Stays sensible at 0% and 100%. */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/**
 * Difference of two proportions (current − baseline) with Newcombe's hybrid score interval (method 10), in
 * percentage points. Pure, for testing.
 */
export function compareRates(baseline: { filled: number; freed: number }, current: { booked: number; eligible: number }): Comparison {
  if (baseline.freed < MIN_SLOTS_TO_COMPARE || current.eligible < MIN_SLOTS_TO_COMPARE) return { verdict: "too_early", differencePts: null, ci95: null };
  const p0 = baseline.filled / baseline.freed;
  const p1 = current.booked / current.eligible;
  const [l0, u0] = wilson(baseline.filled, baseline.freed);
  const [l1, u1] = wilson(current.booked, current.eligible);
  const d = p1 - p0;
  const lo = d - Math.sqrt((p1 - l1) ** 2 + (u0 - p0) ** 2);
  const hi = d + Math.sqrt((u1 - p1) ** 2 + (p0 - l0) ** 2);
  const round = (x: number) => Math.round(x * 1000) / 10;
  return { verdict: lo > 0 ? "above" : hi < 0 ? "below" : "similar", differencePts: round(d), ci95: [round(lo), round(hi)] };
}

/**
 * A slot counts as filled when the patient accepted before the offer expired and the booking was then verified on
 * read-back (which may happen after expiry, before the slot starts). Shared by both metrics.
 */
export const FILLED_SQL = `w.outcome = 'booked' AND EXISTS (
  SELECT 1 FROM aksh.access_actions ra WHERE ra.workflow_id = w.id AND ra.action_type = 'record_response'
    AND ra.result_code = 'ACCEPTED_PENDING_VERIFICATION' AND ra.created_at <= s.offer_expires_at)`;
export const FILL_DEFINITION =
  "Fill rate = slots where the patient accepted before the offer expired and the booking was verified on read-back ÷ slots received (withdrawn excluded).";

export async function getMeasurement(ctx: NetworkContext, orgId: string) {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withPrivileged(async (client) => {
    const org = (await client.query<{ status: string; verified_at: Date | null }>(`SELECT status, verified_at FROM aksh.organisations WHERE id = $1`, [orgId])).rows[0];
    if (!org) throw new NetworkError("Organisation not found", 404);
    const events = (await client.query<GoLiveEvent>(
      `SELECT id, item_key, action, evidence, note, actor_user_id, actor_kind, created_at FROM aksh.golive_events WHERE organisation_id = $1 ORDER BY id`,
      [orgId]
    )).rows;
    const baselineItem = deriveItems(events).find((i) => i.key === "baseline");
    const ev = baselineItem?.state === "accepted" ? (baselineItem.evidence as { periodStart: string; periodEnd: string; freedSlots: number; filledSlots: number; method: string }) : null;

    const live = Boolean(org.verified_at) && (org.status === "live_read_only" || org.status === "live");
    const since = live ? org.verified_at! : new Date(Date.now() - 30 * 86_400_000);
    const c = (await client.query<{ eligible: number; booked: number; expired: number; open: number; failed_safe: number; via_connector: number; read_back_by_connector: number }>(
      `SELECT count(*) FILTER (WHERE s.state <> 'withdrawn')::int AS eligible,
              count(*) FILTER (WHERE ${FILLED_SQL})::int AS booked,
              count(*) FILTER (WHERE w.outcome = 'expired')::int AS expired,
              count(*) FILTER (WHERE w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF'))::int AS open,
              count(*) FILTER (WHERE w.state = 'FAILED_SAFE')::int AS failed_safe,
              count(*) FILTER (WHERE s.source = 'partner_api')::int AS via_connector,
              count(*) FILTER (WHERE ${FILLED_SQL} AND EXISTS (
                SELECT 1 FROM aksh.access_actions a WHERE a.workflow_id = w.id AND a.action_type = 'confirm_booking' AND a.result_code = 'BOOKED_VERIFIED' AND a.actor_user_id LIKE 'connector-%'))::int AS read_back_by_connector
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.organisation_id = $1 AND s.received_at >= $2 AND s.source <> 'simulation'`,
      [orgId, since]
    )).rows[0]!;
    const weekly = (await client.query<{ week: string; eligible: number; booked: number }>(
      `SELECT to_char(date_trunc('week', s.received_at), 'YYYY-MM-DD') AS week,
              count(*) FILTER (WHERE s.state <> 'withdrawn')::int AS eligible,
              count(*) FILTER (WHERE ${FILLED_SQL})::int AS booked
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.organisation_id = $1 AND s.received_at >= date_trunc('week', NOW()) - INTERVAL '11 weeks' AND s.source <> 'simulation'
       GROUP BY 1 ORDER BY 1`,
      [orgId]
    )).rows;
    const rate = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);
    return {
      metricVersion: "slot-fill-v1.1",
      definition: FILL_DEFINITION,
      mode: live ? ("live_shadow" as const) : ("rehearsal" as const),
      period: { since: since.toISOString(), label: live ? "Since go-live" : "Last 30 days (rehearsal, before go-live)" },
      baseline: ev
        ? { periodStart: ev.periodStart, periodEnd: ev.periodEnd, freed: ev.freedSlots, filled: ev.filledSlots, ratePct: rate(ev.filledSlots, ev.freedSlots), method: ev.method, locked: true }
        : null,
      current: { ...c, ratePct: rate(c.booked, c.eligible) },
      comparison: ev ? compareRates({ filled: ev.filledSlots, freed: ev.freedSlots }, { booked: c.booked, eligible: c.eligible }) : null,
      weekly,
      notes: [
        `No comparison until both the baseline and the current period have at least ${MIN_SLOTS_TO_COMPARE} slots.`,
        "Shadow mode: staff contacted patients; Aksh found and ranked them and kept the record.",
        c.booked ? `${c.read_back_by_connector} of ${c.booked} bookings were confirmed by your schedule directly; the rest by staff.` : "",
      ].filter(Boolean),
    };
  });
}
