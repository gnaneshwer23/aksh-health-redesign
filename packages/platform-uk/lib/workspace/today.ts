/**
 * Today: the real workspace's home. What needs a person now, across the caller's organisations, from live records
 * only (row-level security decides every row; simulation slots excluded). No sample data, no placeholders: an empty
 * organisation shows zeros and the next setup step.
 */
import { APPOINTMENT_TYPE_LABEL } from "../access/eligibility";
import { listMonitoring } from "../cgm/monitoring";
import { CLINICIAN_ROLES } from "../env/workspace";
import { withTenant, type NetworkContext } from "../network/db";

export type TodayOrg = { id: string; name: string; status: string; isAdmin: boolean; patients: number; waiting: number; staff: number };

/**
 * One item of work for a person, across workflows. Every item says what it is, why it needs attention, when it is
 * due, and where to act. Built from live records only; priority 0 is urgent, 1 due soon, 2 when you can.
 */
export type WorkKind = "handoff" | "cgm_low" | "slot" | "read_back" | "readings" | "cgm_upload";
export type WorkItem = {
  id: string;
  kind: WorkKind;
  priority: 0 | 1 | 2;
  title: string;
  why: string;
  due: string | null;
  organisation: string | null;
  href: string;
  action: string;
  /** For slot items: when the appointment is. */
  appointmentAt?: string;
};

const SLOT_STEP: Record<string, string> = {
  RECEIVED: "Check the slot and find who fits",
  SOURCE_VALIDATED: "Find who fits",
  ELIGIBILITY_CHECKED: "Review who fits",
  CANDIDATES_RANKED: "Choose a patient to offer",
  STAFF_REVIEW: "Choose a patient to offer",
  OFFER_DRAFTED: "Approve the offer and contact the patient",
  CONTACT_APPROVED: "Record the patient's answer",
  RESPONSE_CAPTURED: "Book it in your schedule",
};

const MAX_ITEMS = 40;

export type Today = {
  organisations: TodayOrg[];
  slots: { toWork: number; awaitingReadBack: number; offersClosingSoon: number; filledLast7Days: number };
  handoffs: { open: number; overdue: number };
  readingsToReview: number | null;
  cgm: { patients: number; lowGlucose: number; uploadsToReview: number } | null;
  setup: { step: "create_or_join" | "add_patients" | "add_waitlist" | "go_live" | "done"; orgId: string | null };
  work: WorkItem[];
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
    const work: WorkItem[] = [];
    const now = Date.now();
    const slotRows = (await client.query<{ id: string; state: string; appointment_type: string; starts_at: Date; offer_expires_at: Date; site: string | null; org: string }>(
      `SELECT w.id, w.state, s.appointment_type, s.starts_at, s.offer_expires_at, s.site, o.name AS org
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id JOIN aksh.organisations o ON o.id = s.organisation_id
       WHERE s.organisation_id = ANY($1) AND s.source <> 'simulation'
         AND (w.state = 'PENDING_VERIFICATION' OR (w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF') AND s.offer_expires_at > NOW()))
       ORDER BY s.offer_expires_at LIMIT $2`,
      [ctx.orgIds, MAX_ITEMS]
    )).rows;
    for (const r of slotRows) {
      const type = APPOINTMENT_TYPE_LABEL[r.appointment_type] ?? r.appointment_type.replace(/_/g, " ");
      if (r.state === "PENDING_VERIFICATION") {
        work.push({ id: `rb-${r.id}`, kind: "read_back", priority: 1, title: `Confirm the booking: ${type}`, why: "The patient accepted. It counts as filled only when your schedule shows the booking.", due: r.starts_at.toISOString(), organisation: r.org, href: `/dashboard/access?slot=${r.id}`, action: "Check booking", appointmentAt: r.starts_at.toISOString() });
      } else {
        const closingSoon = r.offer_expires_at.getTime() - now <= 4 * 3_600_000;
        work.push({ id: `slot-${r.id}`, kind: "slot", priority: closingSoon ? 0 : 1, title: `Freed slot: ${type}${r.site ? ` at ${r.site}` : ""}`, why: `${SLOT_STEP[r.state] ?? "Continue the slot"}. Offer closes ${closingSoon ? "within 4 hours" : "later"}.`, due: r.offer_expires_at.toISOString(), organisation: r.org, href: `/dashboard/access?slot=${r.id}`, action: "Open slot", appointmentAt: r.starts_at.toISOString() });
      }
    }
    const handoffRows = (await client.query<{ id: string; reason: string; due_at: Date; priority: string; workflow_id: string | null; acknowledged_at: Date | null; org: string }>(
      `SELECT h.id, h.reason, h.due_at, h.priority, h.workflow_id, h.acknowledged_at, o.name AS org
       FROM aksh.handoff_tasks h JOIN aksh.organisations o ON o.id = h.organisation_id
       WHERE h.organisation_id = ANY($1) AND h.closed_at IS NULL ORDER BY h.due_at LIMIT $2`,
      [ctx.orgIds, MAX_ITEMS]
    )).rows;
    for (const r of handoffRows) {
      const overdue = r.due_at.getTime() < now;
      work.push({
        id: `ho-${r.id}`,
        kind: "handoff",
        priority: overdue || r.priority === "urgent" ? 0 : 1,
        title: `Hand-off: ${r.reason}`,
        why: overdue ? "Past its due time and not closed." : r.acknowledged_at ? "Acknowledged, not yet closed." : "Waiting for someone to pick it up.",
        due: r.due_at.toISOString(),
        organisation: r.org,
        href: r.workflow_id ? `/dashboard/access?slot=${r.workflow_id}` : "/dashboard/access",
        action: r.acknowledged_at ? "Close hand-off" : "Pick up",
      });
    }
    if (clinician) {
      const readingRows = (await client.query<{ patient_id: string; name: string; n: number; latest: Date }>(
        `SELECT x.patient_id, p.given_name || ' ' || p.family_name AS name, count(*)::int AS n, max(x.observed_at) AS latest
         FROM aksh.network_observations x JOIN aksh.network_patients p ON p.id = x.patient_id
         WHERE x.source IN ('patient_reported', 'device') AND NOT x.verified AND x.status = 'final' AND x.kind <> 'diastolic_bp'
           AND x.kind IN ('glucose', 'systolic_bp', 'weight') AND x.observed_at > NOW() - INTERVAL '30 days'
         GROUP BY x.patient_id, p.given_name, p.family_name ORDER BY max(x.observed_at) DESC LIMIT $1`,
        [MAX_ITEMS]
      )).rows;
      for (const r of readingRows) {
        work.push({ id: `rd-${r.patient_id}`, kind: "readings", priority: 2, title: `${r.n} reading${r.n === 1 ? "" : "s"} from ${r.name} to check`, why: "Shared by the patient; marked patient-reported until a clinician checks them.", due: null, organisation: null, href: `/dashboard/network?patient=${r.patient_id}`, action: "Review readings" });
      }
    }
    return { organisations, slots: s, handoffs: h, readingsToReview: readings, work };
  });

  let cgm: Today["cgm"] = null;
  const work = [...base.work];
  if (clinician) {
    const rows = await listMonitoring(ctx);
    cgm = {
      patients: rows.length,
      lowGlucose: rows.filter((r) => r.urgency <= 1).length,
      uploadsToReview: rows.filter((r) => (r as { uncheckedSummary?: boolean }).uncheckedSummary).length,
    };
    for (const r of rows) {
      if (r.urgency <= 1) {
        work.push({ id: `cgm-${r.patientId}`, kind: "cgm_low", priority: r.urgency === 0 ? 0 : 1, title: `Low glucose: ${r.name}`, why: r.flags[0] ?? "Time below range is above target.", due: null, organisation: r.organisation, href: `/dashboard/monitoring?patient=${r.patientId}`, action: "Review CGM" });
      } else if ((r as { uncheckedSummary?: boolean }).uncheckedSummary) {
        work.push({ id: `up-${r.patientId}`, kind: "cgm_upload", priority: 2, title: `CGM upload from ${r.name} to review`, why: "Patient uploads count only after a clinician reviews them.", due: null, organisation: r.organisation, href: `/dashboard/monitoring?patient=${r.patientId}`, action: "Review upload" });
      }
    }
  }
  // Urgent first, then by due time (items without a due time last), then title.
  work.sort((a, b) => a.priority - b.priority || (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.title.localeCompare(b.title));

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
  return { ...base, cgm, setup: { step, orgId: target?.id ?? null }, work: work.slice(0, MAX_ITEMS) };
}
