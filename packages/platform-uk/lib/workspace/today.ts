/**
 * Today: the real workspace's home. What needs a person now, across the caller's organisations, from live records
 * only (row-level security decides every row; simulation slots excluded). No sample data, no placeholders: an empty
 * organisation shows zeros and the next setup step.
 */
import { listMonitoring } from "../cgm/monitoring";
import { CLINICIAN_ROLES } from "../env/workspace";
import { withTenant, type NetworkContext } from "../network/db";

export type TodayOrg = { id: string; name: string; status: string; isAdmin: boolean; patients: number; waiting: number; staff: number };

export type Today = {
  organisations: TodayOrg[];
  slots: { toWork: number; awaitingReadBack: number; offersClosingSoon: number; filledLast7Days: number };
  handoffs: { open: number; overdue: number };
  readingsToReview: number | null;
  cgm: { patients: number; lowGlucose: number; uploadsToReview: number } | null;
  setup: { step: "create_or_join" | "add_patients" | "add_waitlist" | "go_live" | "done"; orgId: string | null };
};

const STATUS_ORDER = ["suspended", "sandbox", "onboarding", "live_read_only", "live"];

export async function getToday(ctx: NetworkContext): Promise<Today> {
  const clinician = CLINICIAN_ROLES.has(ctx.role ?? "");
  const base = await withTenant(ctx, async (client) => {
    const organisations = ctx.orgIds.length
      ? (await client.query<TodayOrg>(
          `SELECT o.id, o.name, o.status,
                  coalesce((SELECT m.is_admin FROM aksh.memberships m WHERE m.organisation_id = o.id AND m.user_id = $2 AND m.status = 'active' LIMIT 1), false) AS "isAdmin",
                  (SELECT count(*)::int FROM aksh.network_patients p WHERE p.organisation_id = o.id) AS patients,
                  (SELECT count(*)::int FROM aksh.waitlist_entries e WHERE e.organisation_id = o.id AND e.status = 'waiting') AS waiting,
                  (SELECT count(*)::int FROM aksh.memberships m WHERE m.organisation_id = o.id AND m.status = 'active') AS staff
           FROM aksh.organisations o WHERE o.id = ANY($1) ORDER BY o.name`,
          [ctx.orgIds, ctx.userId]
        )).rows
      : [];
    const s = (await client.query<Today["slots"]>(
      `SELECT count(*) FILTER (WHERE w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF', 'PENDING_VERIFICATION') AND s.offer_expires_at > NOW())::int AS "toWork",
              count(*) FILTER (WHERE w.state = 'PENDING_VERIFICATION')::int AS "awaitingReadBack",
              count(*) FILTER (WHERE w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF') AND s.offer_expires_at > NOW() AND s.offer_expires_at <= NOW() + INTERVAL '4 hours')::int AS "offersClosingSoon",
              count(*) FILTER (WHERE w.outcome = 'booked' AND w.updated_at > NOW() - INTERVAL '7 days')::int AS "filledLast7Days"
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.organisation_id = ANY($1) AND s.source <> 'simulation'`,
      [ctx.orgIds]
    )).rows[0]!;
    const h = (await client.query<Today["handoffs"]>(
      `SELECT count(*) FILTER (WHERE closed_at IS NULL)::int AS open, count(*) FILTER (WHERE closed_at IS NULL AND due_at < NOW())::int AS overdue
       FROM aksh.handoff_tasks WHERE organisation_id = ANY($1)`,
      [ctx.orgIds]
    )).rows[0]!;
    // Same rule as the readings review list: patient-reported or device readings, last 30 days, not yet verified.
    const readings = clinician
      ? (await client.query<{ n: number }>(
          `SELECT count(*) FILTER (WHERE kind <> 'diastolic_bp')::int AS n FROM aksh.network_observations
           WHERE source IN ('patient_reported', 'device') AND NOT verified AND status = 'final'
             AND kind IN ('glucose', 'systolic_bp', 'diastolic_bp', 'weight') AND observed_at > NOW() - INTERVAL '30 days'`
        )).rows[0]!.n
      : null;
    return { organisations, slots: s, handoffs: h, readingsToReview: readings };
  });

  let cgm: Today["cgm"] = null;
  if (clinician) {
    const rows = await listMonitoring(ctx);
    cgm = {
      patients: rows.length,
      lowGlucose: rows.filter((r) => r.urgency <= 1).length,
      uploadsToReview: rows.filter((r) => (r as { uncheckedSummary?: boolean }).uncheckedSummary).length,
    };
  }

  // The next setup step for the organisation furthest from going live (admins drive setup).
  const orgs = base.organisations;
  const target = [...orgs].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))[0] ?? null;
  const step: Today["setup"]["step"] = !target
    ? "create_or_join"
    : target.patients === 0
      ? "add_patients"
      : target.waiting === 0
        ? "add_waitlist"
        : target.status === "sandbox" || target.status === "onboarding"
          ? "go_live"
          : "done";
  return { ...base, cgm, setup: { step, orgId: target?.id ?? null } };
}
