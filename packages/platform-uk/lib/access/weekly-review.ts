/**
 * Week 12 pilot: the weekly review report for one clinic. Everything the clinic and Aksh go through together each
 * week: the slot-fill funnel, what staff decided, how quickly, what went to a person, what the schedule connector
 * reported, and the data gaps that stopped patients being offered. Rates always come with their counts.
 *
 * - Same fill definition as the pilot metric (slot-fill-v1.2, FILLED_SQL). Simulation slots are excluded.
 * - A week runs Monday 00:00 to Monday 00:00 in the organisation's time zone. Slots belong to the week they were
 *   received; their outcomes are as of now, so an open week can still change (the report says so).
 * - Runs in the caller's tenant session: row-level security decides every row.
 * - Sign-off freezes the figures (snapshot) in an append-only row; corrections are addenda.
 */
import { deriveItems, type GoLiveEvent } from "../golive/checklist";
import { getDeploymentEnvironment } from "../env/deployment";
import { audit, withTenant, type NetworkContext } from "../network/db";
import { NetworkError } from "../network/service";
import { FILL_DEFINITION, FILLED_SQL, wilson } from "./measurement";

export const WEEKLY_REVIEW_VERSION = "pilot-weekly-review-v1";
const DAY = 86_400_000;

export type WeeklyReview = {
  reportVersion: string;
  metricVersion: "slot-fill-v1.2";
  definition: string;
  organisation: { id: string; name: string; timezone: string; status: string };
  week: { start: string; end: string; complete: boolean; mode: "rehearsal" | "live_shadow" };
  funnel: {
    received: number; withdrawn: number; eligible: number; ranked: number; noCandidates: number; offered: number;
    contactApproved: number; accepted: number; filled: number; bookedOutsideMetric: number; expired: number;
    failedSafe: number; handedOff: number; stillOpen: number;
  };
  fill: { ratePct: number | null; ci95: [number, number] | null; baselinePct: number | null; previousWeekPct: number | null };
  responses: { declined: number; noResponse: number; unreachable: number; escalated: number };
  /** PRD v1.1 §10.2 guardrails. A rate is null when there is nothing to divide by. */
  guardrails: {
    bookingChecks: number;
    bookingIssues: number;
    bookingIssuesPer100: number | null;
    duplicateBookings: number;
    handoffsAcknowledged: number;
    handoffsAcknowledgedOnTimePct: number | null;
    medianMinutesToAcknowledge: number | null;
    optedOutCandidates: number;
    optOutsRecorded: number;
    complaints: number;
    /** Staff time logged against this week's slots; per slot over the slots that have time logged. */
    staffMinutes: number;
    slotsTimed: number;
    staffMinutesPerSlot: number | null;
    baselineStaffMinutesPerSlot: number | null;
  };
  staff: { selections: number; tookTopRanked: number; choseOther: number; notRecorded: number; skips: number; skipReasons: { reason: string; count: number }[]; offersEdited: number; deferrals: number };
  timeliness: { medianMinutesToOffer: number | null; medianMinutesToVerifiedBooking: number | null; medianHoursBookedBeforeStart: number | null };
  handoffs: { created: number; urgent: number; soon: number; routine: number; closed: number; openOverdue: number; acknowledgedLate: number };
  connector: { events: number; byResult: { result: string; count: number }[] };
  dataGaps: { missingFields: { field: string; candidates: number }[]; exclusions: { code: string; candidates: number }[] };
  prompts: string[];
  generatedAt: string;
};

/** Monday of the week containing `date` (YYYY-MM-DD, calendar arithmetic only). */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * DAY).toISOString().slice(0, 10);
}

/** Today's calendar date in the organisation's time zone. */
export function localDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The default week to review: the last complete one. */
export function lastCompleteWeek(now: Date, timeZone: string): string {
  const thisMonday = mondayOf(localDate(now, timeZone));
  return new Date(Date.parse(`${thisMonday}T00:00:00Z`) - 7 * DAY).toISOString().slice(0, 10);
}

export function parseWeekStart(value: string | null | undefined, now: Date, timeZone: string): string {
  if (!value) return lastCompleteWeek(now, timeZone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new NetworkError("INVALID_WEEK: use a date as YYYY-MM-DD", 400);
  }
  if (mondayOf(value) !== value) throw new NetworkError("INVALID_WEEK: weeks start on a Monday", 400);
  if (value > mondayOf(localDate(now, timeZone))) throw new NetworkError("INVALID_WEEK: that week has not started", 400);
  return value;
}

/** Points the review meeting should discuss, most important first. Pure, for testing. */
export function reviewPrompts(r: Pick<WeeklyReview, "funnel" | "fill" | "staff" | "handoffs" | "connector" | "dataGaps" | "week"> & Partial<Pick<WeeklyReview, "guardrails">>): string[] {
  const p: string[] = [];
  const f = r.funnel;
  const g = r.guardrails;
  if (g?.complaints) p.push(`${g.complaints} complaint${g.complaints === 1 ? " was" : "s were"} recorded. Review each one with the hand-off that followed it.`);
  if (g?.duplicateBookings) p.push(`${g.duplicateBookings} slot${g.duplicateBookings === 1 ? " was" : "s were"} confirmed as booked more than once. Investigate before the next week.`);
  if (f.failedSafe) p.push(`${f.failedSafe} booking${f.failedSafe === 1 ? " was" : "s were"} not found on read-back. Check each hand-off was resolved and the patient told.`);
  if (r.handoffs.openOverdue) p.push(`${r.handoffs.openOverdue} hand-off${r.handoffs.openOverdue === 1 ? " is" : "s are"} open past the due time.`);
  if (f.bookedOutsideMetric) p.push(`${f.bookedOutsideMetric} booking${f.bookedOutsideMetric === 1 ? "" : "s"} did not meet the fill definition (accepted after the offer expired, or verified after the slot started). Not counted.`);
  if (f.eligible === 0) p.push("No slots were received this week. Check the schedule connection or that staff are adding cancelled slots.");
  else if (f.noCandidates / f.eligible >= 0.25) p.push(`${f.noCandidates} of ${f.eligible} slots had no eligible patient. Review the waiting list for this appointment mix.`);
  if (f.expired) p.push(`${f.expired} slot${f.expired === 1 ? "" : "s"} expired before anyone was booked.`);
  if (g && g.handoffsAcknowledgedOnTimePct !== null && g.handoffsAcknowledgedOnTimePct < 80) p.push(`Only ${g.handoffsAcknowledgedOnTimePct}% of hand-offs were acknowledged before their due time.`);
  if (r.staff.choseOther) p.push(`Staff chose someone other than the top-ranked patient ${r.staff.choseOther} time${r.staff.choseOther === 1 ? "" : "s"}. Talk through why: it is how the ranking gets better.`);
  if (r.staff.skips) p.push(`${r.staff.skips} candidate${r.staff.skips === 1 ? " was" : "s were"} skipped by staff. The reasons are listed below.`);
  const gap = r.dataGaps.missingFields[0];
  if (gap) p.push(`Most common missing waiting-list field: ${gap.field} (${gap.candidates} candidate${gap.candidates === 1 ? "" : "s"}).`);
  const rejected = r.connector.byResult.filter((e) => /REJECT|INVALID|UNKNOWN|NO_|STALE|ERROR/.test(e.result)).reduce((a, e) => a + e.count, 0);
  if (rejected) p.push(`${rejected} schedule message${rejected === 1 ? " was" : "s were"} rejected or ignored by the connector.`);
  if (r.fill.ratePct !== null && r.fill.previousWeekPct !== null && f.eligible >= 10) {
    const d = Math.round((r.fill.ratePct - r.fill.previousWeekPct) * 10) / 10;
    if (Math.abs(d) >= 10) p.push(`Fill rate ${d > 0 ? "rose" : "fell"} ${Math.abs(d)} points on last week. One week is noisy: read it with the counts.`);
  }
  if (!r.week.complete) p.push("This week is not over. Figures will change.");
  if (f.stillOpen) p.push(`${f.stillOpen} slot${f.stillOpen === 1 ? " is" : "s are"} still being worked. Their outcomes are not final.`);
  return p;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

export async function getWeeklyReview(ctx: NetworkContext, orgId: string, week?: string | null, now = new Date()): Promise<WeeklyReview> {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) => {
    const org = (await client.query<{ id: string; name: string; status: string; verified_at: Date | null; timezone: string | null }>(
      `SELECT id, name, status, verified_at, locale->>'timezone' AS timezone FROM aksh.organisations WHERE id = $1`,
      [orgId]
    )).rows[0];
    if (!org) throw new NetworkError("Organisation not found", 404);
    let tz = org.timezone || "UTC";
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
    } catch {
      tz = "UTC";
    }
    const weekStart = parseWeekStart(week, now, tz);
    const weekEnd = new Date(Date.parse(`${weekStart}T00:00:00Z`) + 7 * DAY).toISOString().slice(0, 10);
    // Bounds in the organisation's zone, computed by Postgres so daylight-saving weeks are 167 or 169 hours.
    const range = (await client.query<{ from_at: Date; to_at: Date }>(
      `SELECT ($1::date)::timestamp AT TIME ZONE $3 AS from_at, ($2::date)::timestamp AT TIME ZONE $3 AS to_at`,
      [weekStart, weekEnd, tz]
    )).rows[0]!;
    const P = [orgId, range.from_at, range.to_at];
    const inWeek = `s.organisation_id = $1 AND s.received_at >= $2 AND s.received_at < $3 AND s.source <> 'simulation'`;
    const has = (type: string, code?: string) =>
      `EXISTS (SELECT 1 FROM aksh.access_actions a WHERE a.workflow_id = w.id AND a.action_type = '${type}'${code ? ` AND a.result_code = '${code}'` : ""})`;

    const f = (await client.query<Record<string, number>>(
      `SELECT count(*)::int AS received,
              count(*) FILTER (WHERE s.state = 'withdrawn')::int AS withdrawn,
              count(*) FILTER (WHERE s.state <> 'withdrawn')::int AS eligible,
              count(*) FILTER (WHERE ${has("match", "RANKED")})::int AS ranked,
              count(*) FILTER (WHERE w.outcome = 'no_candidates')::int AS no_candidates,
              count(*) FILTER (WHERE ${has("select")})::int AS offered,
              count(*) FILTER (WHERE ${has("approve_contact")})::int AS contact_approved,
              count(*) FILTER (WHERE ${has("record_response", "ACCEPTED_PENDING_VERIFICATION")})::int AS accepted,
              count(*) FILTER (WHERE ${FILLED_SQL})::int AS filled,
              count(*) FILTER (WHERE w.outcome = 'booked' AND NOT (${FILLED_SQL}))::int AS booked_outside,
              count(*) FILTER (WHERE w.outcome = 'expired')::int AS expired,
              count(*) FILTER (WHERE ${has("confirm_booking", "READ_BACK_NOT_CONFIRMED")})::int AS failed_safe,
              count(*) FILTER (WHERE EXISTS (SELECT 1 FROM aksh.handoff_tasks h WHERE h.workflow_id = w.id))::int AS handed_off,
              count(*) FILTER (WHERE w.state NOT IN ('CLOSED', 'FAILED_SAFE', 'HANDOFF'))::int AS still_open
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id WHERE ${inWeek}`,
      P
    )).rows[0]!;

    const workflowsInWeek = `SELECT w.id FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id WHERE ${inWeek}`;
    const acts = (await client.query<Record<string, number>>(
      `SELECT count(*) FILTER (WHERE action_type = 'record_response' AND result_code = 'DECLINED')::int AS declined,
              count(*) FILTER (WHERE action_type = 'record_response' AND result_code = 'NO_RESPONSE')::int AS no_response,
              count(*) FILTER (WHERE action_type = 'record_response' AND result_code = 'UNREACHABLE')::int AS unreachable,
              count(*) FILTER (WHERE action_type = 'record_response' AND result_code = 'OPTED_OUT')::int AS opt_outs,
              count(*) FILTER (WHERE action_type = 'complaint')::int AS complaints,
              coalesce(sum((detail->>'minutes')::int) FILTER (WHERE action_type = 'log_time'), 0)::int AS staff_minutes,
              count(DISTINCT workflow_id) FILTER (WHERE action_type = 'log_time')::int AS slots_timed,
              count(*) FILTER (WHERE action_type = 'record_response' AND result_code = 'ESCALATED')::int AS escalated,
              count(*) FILTER (WHERE action_type = 'confirm_booking')::int AS booking_checks,
              count(*) FILTER (WHERE action_type = 'confirm_booking' AND result_code = 'READ_BACK_NOT_CONFIRMED')::int AS booking_issues,
              count(*) FILTER (WHERE action_type = 'select')::int AS selections,
              count(*) FILTER (WHERE action_type = 'select' AND detail->>'topRanked' = 'true')::int AS top,
              count(*) FILTER (WHERE action_type = 'select' AND detail->>'topRanked' = 'false')::int AS other,
              count(*) FILTER (WHERE action_type = 'skip')::int AS skips,
              count(*) FILTER (WHERE action_type = 'edit_offer')::int AS edited,
              count(*) FILTER (WHERE action_type = 'defer')::int AS deferrals
       FROM aksh.access_actions WHERE workflow_id IN (${workflowsInWeek})`,
      P
    )).rows[0]!;
    const skipReasons = (await client.query<{ reason: string; count: number }>(
      `SELECT coalesce(nullif(trim(detail->>'reason'), ''), '(no reason given)') AS reason, count(*)::int AS count
       FROM aksh.access_actions WHERE action_type = 'skip' AND workflow_id IN (${workflowsInWeek})
       GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`,
      P
    )).rows;

    const t = (await client.query<{ to_offer: number | null; to_booked: number | null; lead: number | null }>(
      `WITH x AS (
         SELECT s.received_at, s.starts_at,
                (SELECT min(a.created_at) FROM aksh.access_actions a WHERE a.workflow_id = w.id AND a.action_type = 'select') AS offered_at,
                (SELECT min(a.created_at) FROM aksh.access_actions a WHERE a.workflow_id = w.id AND a.action_type = 'confirm_booking' AND a.result_code = 'BOOKED_VERIFIED') AS booked_at
         FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id WHERE ${inWeek})
       SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM offered_at - received_at) / 60)::numeric)::float AS to_offer,
              round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM booked_at - received_at) / 60)::numeric)::float AS to_booked,
              round((percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM starts_at - booked_at) / 3600))::numeric, 1)::float AS lead
       FROM x`,
      P
    )).rows[0]!;

    const h = (await client.query<Record<string, number>>(
      `SELECT count(*)::int AS created,
              count(*) FILTER (WHERE priority = 'urgent')::int AS urgent,
              count(*) FILTER (WHERE priority = 'soon')::int AS soon,
              count(*) FILTER (WHERE priority = 'routine')::int AS routine,
              count(*) FILTER (WHERE closed_at IS NOT NULL)::int AS closed,
              count(*) FILTER (WHERE closed_at IS NULL AND due_at < $4)::int AS open_overdue,
              count(*) FILTER (WHERE acknowledged_at > due_at)::int AS ack_late,
              count(*) FILTER (WHERE acknowledged_at IS NOT NULL)::int AS acked,
              count(*) FILTER (WHERE acknowledged_at IS NOT NULL AND acknowledged_at <= due_at)::int AS acked_on_time,
              round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM acknowledged_at - created_at) / 60) FILTER (WHERE acknowledged_at IS NOT NULL)::numeric)::float AS ack_minutes
       FROM aksh.handoff_tasks WHERE organisation_id = $1 AND created_at >= $2 AND created_at < $3`,
      [...P, now]
    )).rows[0]!;

    const integrity = (await client.query<{ duplicates: number; opted_out: number }>(
      `SELECT (SELECT count(*)::int FROM (SELECT workflow_id FROM aksh.access_actions
                 WHERE workflow_id IN (${workflowsInWeek}) AND action_type = 'confirm_booking' AND result_code = 'BOOKED_VERIFIED'
                 GROUP BY workflow_id HAVING count(*) > 1) d) AS duplicates,
              (SELECT count(DISTINCT c.waitlist_entry_id)::int FROM aksh.access_candidates c
                 WHERE c.workflow_id IN (${workflowsInWeek}) AND 'OPTED_OUT' = ANY (c.exclusion_codes)) AS opted_out`,
      P
    )).rows[0]!;

    const connector = (await client.query<{ result: string; count: number }>(
      `SELECT result_code AS result, count(*)::int AS count FROM aksh.connector_events
       WHERE organisation_id = $1 AND received_at >= $2 AND received_at < $3 GROUP BY 1 ORDER BY 2 DESC, 1`,
      P
    )).rows;

    const missing = (await client.query<{ field: string; candidates: number }>(
      `SELECT f AS field, count(*)::int AS candidates FROM aksh.access_candidates c, unnest(c.missing_fields) f
       WHERE c.workflow_id IN (${workflowsInWeek}) GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`,
      P
    )).rows;
    const exclusions = (await client.query<{ code: string; candidates: number }>(
      `SELECT e AS code, count(*)::int AS candidates FROM aksh.access_candidates c, unnest(c.exclusion_codes) e
       WHERE c.workflow_id IN (${workflowsInWeek}) GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 8`,
      P
    )).rows;

    const prev = (await client.query<{ eligible: number; filled: number }>(
      `SELECT count(*) FILTER (WHERE s.state <> 'withdrawn')::int AS eligible, count(*) FILTER (WHERE ${FILLED_SQL})::int AS filled
       FROM aksh.access_slots s JOIN aksh.access_workflows w ON w.slot_id = s.id
       WHERE s.organisation_id = $1 AND s.received_at >= $2::timestamptz - (($3::timestamptz - $2::timestamptz)) AND s.received_at < $2 AND s.source <> 'simulation'`,
      P
    )).rows[0]!;

    const events = (await client.query<GoLiveEvent>(
      `SELECT id, item_key, action, evidence, note, actor_user_id, actor_kind, created_at FROM aksh.golive_events WHERE organisation_id = $1 ORDER BY id`,
      [orgId]
    )).rows;
    const baseline = deriveItems(events).find((i) => i.key === "baseline");
    const ev = baseline?.state === "accepted" ? (baseline.evidence as { freedSlots: number; filledSlots: number; staffMinutesPerSlot?: number }) : null;

    const live = Boolean(org.verified_at) && (org.status === "live_read_only" || org.status === "live") && org.verified_at! < range.to_at;
    const [lo, hi] = f.eligible ? wilson(f.filled!, f.eligible) : [0, 0];
    const report: WeeklyReview = {
      reportVersion: WEEKLY_REVIEW_VERSION,
      metricVersion: "slot-fill-v1.2",
      definition: FILL_DEFINITION,
      organisation: { id: org.id, name: org.name, timezone: tz, status: org.status },
      week: { start: weekStart, end: weekEnd, complete: range.to_at.getTime() <= now.getTime(), mode: live ? "live_shadow" : "rehearsal" },
      funnel: {
        received: f.received!, withdrawn: f.withdrawn!, eligible: f.eligible!, ranked: f.ranked!, noCandidates: f.no_candidates!,
        offered: f.offered!, contactApproved: f.contact_approved!, accepted: f.accepted!, filled: f.filled!,
        bookedOutsideMetric: f.booked_outside!, expired: f.expired!, failedSafe: f.failed_safe!, handedOff: f.handed_off!, stillOpen: f.still_open!,
      },
      fill: {
        ratePct: pct(f.filled!, f.eligible!),
        ci95: f.eligible ? [Math.round(lo * 1000) / 10, Math.round(hi * 1000) / 10] : null,
        baselinePct: ev ? pct(ev.filledSlots, ev.freedSlots) : null,
        previousWeekPct: pct(prev.filled, prev.eligible),
      },
      responses: { declined: acts.declined!, noResponse: acts.no_response!, unreachable: acts.unreachable!, escalated: acts.escalated! },
      guardrails: {
        bookingChecks: acts.booking_checks!,
        bookingIssues: acts.booking_issues!,
        bookingIssuesPer100: acts.booking_checks ? Math.round((acts.booking_issues! / acts.booking_checks) * 1000) / 10 : null,
        duplicateBookings: integrity.duplicates,
        handoffsAcknowledged: h.acked!,
        handoffsAcknowledgedOnTimePct: h.acked ? Math.round((h.acked_on_time! / h.acked) * 1000) / 10 : null,
        medianMinutesToAcknowledge: h.ack_minutes ?? null, // null when nothing was acknowledged
        optedOutCandidates: integrity.opted_out,
        optOutsRecorded: acts.opt_outs!,
        complaints: acts.complaints!,
        staffMinutes: acts.staff_minutes!,
        slotsTimed: acts.slots_timed!,
        staffMinutesPerSlot: acts.slots_timed ? Math.round((acts.staff_minutes! / acts.slots_timed) * 10) / 10 : null,
        baselineStaffMinutesPerSlot: ev?.staffMinutesPerSlot ?? null,
      },
      staff: {
        selections: acts.selections!, tookTopRanked: acts.top!, choseOther: acts.other!, notRecorded: acts.selections! - acts.top! - acts.other!,
        skips: acts.skips!, skipReasons, offersEdited: acts.edited!, deferrals: acts.deferrals!,
      },
      timeliness: { medianMinutesToOffer: t.to_offer, medianMinutesToVerifiedBooking: t.to_booked, medianHoursBookedBeforeStart: t.lead },
      handoffs: { created: h.created!, urgent: h.urgent!, soon: h.soon!, routine: h.routine!, closed: h.closed!, openOverdue: h.open_overdue!, acknowledgedLate: h.ack_late! },
      connector: { events: connector.reduce((a, e) => a + e.count, 0), byResult: connector },
      dataGaps: { missingFields: missing, exclusions },
      prompts: [],
      generatedAt: now.toISOString(),
    };
    report.prompts = reviewPrompts(report);
    return report;
  });
}

export type SignOff = { id: string; weekStart: string; summary: string; actionsAgreed: string | null; attendees: string | null; reviewedBy: string; reviewerName: string | null; createdAt: string; snapshot: WeeklyReview };

export async function listSignOffs(ctx: NetworkContext, orgId: string, weekStart?: string): Promise<SignOff[]> {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  return withTenant(ctx, async (client) => {
    const rows = (await client.query<{ id: string; week_start: string; summary: string; actions_agreed: string | null; attendees: string | null; reviewed_by: string; reviewer_name: string | null; created_at: Date; snapshot: WeeklyReview }>(
      `SELECT r.id::text, to_char(r.week_start, 'YYYY-MM-DD') AS week_start, r.summary, r.actions_agreed, r.attendees, r.reviewed_by,
              (SELECT m.display_name FROM aksh.memberships m WHERE m.organisation_id = r.organisation_id AND m.user_id = r.reviewed_by LIMIT 1) AS reviewer_name,
              r.created_at, r.snapshot
       FROM aksh.pilot_weekly_reviews r
       WHERE r.organisation_id = $1 AND ($2::date IS NULL OR r.week_start = $2::date)
       ORDER BY r.week_start DESC, r.id DESC LIMIT 60`,
      [orgId, weekStart ?? null]
    )).rows;
    return rows.map((r) => ({
      id: r.id, weekStart: r.week_start, summary: r.summary, actionsAgreed: r.actions_agreed, attendees: r.attendees,
      reviewedBy: r.reviewed_by, reviewerName: r.reviewer_name, createdAt: r.created_at.toISOString(), snapshot: r.snapshot,
    }));
  });
}

/** An organisation admin signs off a complete week. The report is recomputed now and frozen with the sign-off. */
export async function signOffWeek(
  ctx: NetworkContext,
  orgId: string,
  input: { weekStart: string; summary: string; actionsAgreed?: string | null; attendees?: string | null },
  now = new Date()
) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can sign off a weekly review", 403);
  const summary = input.summary?.trim();
  if (!summary) throw new NetworkError("SUMMARY_REQUIRED: write what the review concluded", 400);
  if (summary.length > 4000 || (input.actionsAgreed?.length ?? 0) > 4000 || (input.attendees?.length ?? 0) > 1000) throw new NetworkError("Text too long", 400);
  const report = await getWeeklyReview(ctx, orgId, input.weekStart, now);
  if (!report.week.complete) throw new NetworkError("WEEK_NOT_OVER: sign off once the week has ended", 409);
  return withTenant(ctx, async (client) => {
    const row = (await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO aksh.pilot_weekly_reviews (organisation_id, week_start, report_version, snapshot, summary, actions_agreed, attendees, reviewed_by, environment)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9) RETURNING id::text, created_at`,
      [orgId, report.week.start, WEEKLY_REVIEW_VERSION, JSON.stringify(report), summary, input.actionsAgreed?.trim() || null, input.attendees?.trim() || null, ctx.userId, getDeploymentEnvironment()]
    )).rows[0]!;
    await audit(client, {
      organisationId: orgId, actorUserId: ctx.userId, action: "pilot.weekly_review_signed", resourceType: "pilot_weekly_review", resourceId: row.id,
      detail: { weekStart: report.week.start, eligible: report.funnel.eligible, filled: report.funnel.filled },
    });
    return { id: row.id, createdAt: row.created_at.toISOString(), report };
  });
}
