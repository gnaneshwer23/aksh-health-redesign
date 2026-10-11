/**
 * Pilot readout (PRD v1.1 §10.3 weeks 9–10, §17): the primary metric and every guardrail across the whole pilot
 * window, reproducible from the same weekly calculation the clinic signs off each week. One definition, frozen; counts
 * beside every rate; the comparison with the locked baseline only when both sides have enough slots; limitations
 * stated. Built by summing complete weeks, so the readout always matches the signed weekly reviews.
 */
import { compareRates, FILL_DEFINITION, MIN_SLOTS_TO_COMPARE, wilson, type Comparison } from "./measurement";
import { getWeeklyReview, lastCompleteWeek, mondayOf, type WeeklyReview } from "./weekly-review";
import { withTenant, type NetworkContext } from "../network/db";
import { NetworkError } from "../network/service";

export const PILOT_REPORT_VERSION = "pilot-readout-v1";
const DAY = 86_400_000;
const MAX_WEEKS = 26;

export type PilotReport = {
  reportVersion: string;
  metricVersion: "slot-fill-v1.2";
  definition: string;
  organisation: { id: string; name: string };
  window: { from: string; to: string; weeks: number; basis: string };
  primary: { eligible: number; filled: number; ratePct: number | null; ci95: [number, number] | null };
  baseline: { freed: number; filled: number; ratePct: number | null; staffMinutesPerSlot: number | null } | null;
  comparison: Comparison | null;
  guardrails: {
    bookingIntegrity: { checks: number; issues: number; per100: number | null; duplicateBookings: number };
    handoffs: { created: number; acknowledged: number; acknowledgedOnTimePct: number | null; openOverdueNow: number };
    patientAccess: { complaints: number; optOuts: number; unreachable: number; escalated: number; declined: number; noResponse: number };
    staffTime: { minutes: number; slotsTimed: number; perSlot: number | null; baselinePerSlot: number | null };
  };
  staffDecisions: { selections: number; tookTopRanked: number; choseOther: number; skips: number };
  coverage: { slotsReceived: number; withdrawn: number; noEligiblePatient: number; stillOpen: number; missingFields: { field: string; candidates: number }[] };
  weekly: { week: string; eligible: number; filled: number; ratePct: number | null; signedOff: boolean }[];
  limitations: string[];
  generatedAt: string;
};

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

/** Sum complete weekly reviews into one readout. Pure, for testing. */
export function aggregateWeeks(weeks: WeeklyReview[], signed: Set<string>, baseline: PilotReport["baseline"]): Omit<PilotReport, "organisation" | "generatedAt"> {
  const sum = (f: (w: WeeklyReview) => number) => weeks.reduce((a, w) => a + f(w), 0);
  const eligible = sum((w) => w.funnel.eligible);
  const filled = sum((w) => w.funnel.filled);
  const [lo, hi] = eligible ? wilson(filled, eligible) : [0, 0];
  const checks = sum((w) => w.guardrails.bookingChecks);
  const issues = sum((w) => w.guardrails.bookingIssues);
  const acked = sum((w) => w.guardrails.handoffsAcknowledged);
  const ackedOnTime = weeks.reduce((a, w) => a + (w.guardrails.handoffsAcknowledgedOnTimePct !== null ? Math.round((w.guardrails.handoffsAcknowledgedOnTimePct / 100) * w.guardrails.handoffsAcknowledged) : 0), 0);
  const minutes = sum((w) => w.guardrails.staffMinutes);
  const timed = sum((w) => w.guardrails.slotsTimed);
  const missing = new Map<string, number>();
  for (const w of weeks) for (const m of w.dataGaps.missingFields) missing.set(m.field, (missing.get(m.field) ?? 0) + m.candidates);

  const limitations = [
    "Before-and-after comparison against the clinic's own baseline; seasonality, case mix and lead time are not controlled, so the difference is not a causal estimate.",
    `No comparison is reported until both the baseline and the pilot have at least ${MIN_SLOTS_TO_COMPARE} slots.`,
    "A slot counts as filled only if the patient accepted before the offer expired and the booking was verified on read-back before the slot started.",
  ];
  if (!timed) limitations.push("No staff time was logged, so net staff time cannot be estimated.");
  else if (baseline?.staffMinutesPerSlot == null) limitations.push("No baseline staff time was recorded, so net staff time cannot be estimated.");
  const unsigned = weeks.filter((w) => !signed.has(w.week.start)).length;
  if (unsigned) limitations.push(`${unsigned} of ${weeks.length} week${weeks.length === 1 ? " is" : "s are"} not signed off yet.`);
  const open = sum((w) => w.funnel.stillOpen);
  if (open) limitations.push(`${open} slot${open === 1 ? " is" : "s are"} still being worked; their outcomes may change.`);

  return {
    reportVersion: PILOT_REPORT_VERSION,
    metricVersion: "slot-fill-v1.2",
    definition: FILL_DEFINITION,
    window: {
      from: weeks[0]?.week.start ?? "",
      to: weeks[weeks.length - 1]?.week.end ?? "",
      weeks: weeks.length,
      basis: "Complete weeks, Monday to Monday in the organisation's time zone; slots belong to the week they were received.",
    },
    primary: { eligible, filled, ratePct: pct(filled, eligible), ci95: eligible ? [Math.round(lo * 1000) / 10, Math.round(hi * 1000) / 10] : null },
    baseline,
    comparison: baseline ? compareRates({ filled: baseline.filled, freed: baseline.freed }, { booked: filled, eligible }) : null,
    guardrails: {
      bookingIntegrity: { checks, issues, per100: checks ? Math.round((issues / checks) * 1000) / 10 : null, duplicateBookings: sum((w) => w.guardrails.duplicateBookings) },
      handoffs: { created: sum((w) => w.handoffs.created), acknowledged: acked, acknowledgedOnTimePct: pct(ackedOnTime, acked), openOverdueNow: weeks[weeks.length - 1]?.handoffs.openOverdue ?? 0 },
      patientAccess: {
        complaints: sum((w) => w.guardrails.complaints),
        optOuts: sum((w) => w.guardrails.optOutsRecorded),
        unreachable: sum((w) => w.responses.unreachable),
        escalated: sum((w) => w.responses.escalated),
        declined: sum((w) => w.responses.declined),
        noResponse: sum((w) => w.responses.noResponse),
      },
      staffTime: { minutes, slotsTimed: timed, perSlot: timed ? Math.round((minutes / timed) * 10) / 10 : null, baselinePerSlot: baseline?.staffMinutesPerSlot ?? null },
    },
    staffDecisions: {
      selections: sum((w) => w.staff.selections),
      tookTopRanked: sum((w) => w.staff.tookTopRanked),
      choseOther: sum((w) => w.staff.choseOther),
      skips: sum((w) => w.staff.skips),
    },
    coverage: {
      slotsReceived: sum((w) => w.funnel.received),
      withdrawn: sum((w) => w.funnel.withdrawn),
      noEligiblePatient: sum((w) => w.funnel.noCandidates),
      stillOpen: open,
      missingFields: [...missing.entries()].map(([field, candidates]) => ({ field, candidates })).sort((a, b) => b.candidates - a.candidates).slice(0, 8),
    },
    weekly: weeks.map((w) => ({ week: w.week.start, eligible: w.funnel.eligible, filled: w.funnel.filled, ratePct: w.fill.ratePct, signedOff: signed.has(w.week.start) })),
    limitations,
  };
}

/** The readout for an organisation. Default window: from go-live (or the last 10 weeks) to the last complete week. */
export async function getPilotReport(ctx: NetworkContext, orgId: string, opts: { from?: string | null; to?: string | null } = {}, now = new Date()): Promise<PilotReport> {
  if (!ctx.orgIds.includes(orgId)) throw new NetworkError("Not a member of this organisation", 403);
  const meta = await withTenant(ctx, async (client) => {
    const org = (await client.query<{ name: string; verified_at: Date | null; timezone: string | null }>(
      `SELECT name, verified_at, locale->>'timezone' AS timezone FROM aksh.organisations WHERE id = $1`,
      [orgId]
    )).rows[0];
    if (!org) throw new NetworkError("Organisation not found", 404);
    const signed = (await client.query<{ week: string }>(
      `SELECT DISTINCT to_char(week_start, 'YYYY-MM-DD') AS week FROM aksh.pilot_weekly_reviews WHERE organisation_id = $1`,
      [orgId]
    )).rows.map((r) => r.week);
    const b = (await client.query<{ evidence: { freedSlots: number; filledSlots: number; staffMinutesPerSlot?: number } }>(
      `SELECT evidence FROM aksh.golive_events WHERE organisation_id = $1 AND item_key = 'baseline' AND action = 'accepted' ORDER BY id DESC LIMIT 1`,
      [orgId]
    )).rows[0];
    return { org, signed: new Set(signed), baseline: b ? { freed: b.evidence.freedSlots, filled: b.evidence.filledSlots, ratePct: pct(b.evidence.filledSlots, b.evidence.freedSlots), staffMinutesPerSlot: b.evidence.staffMinutesPerSlot ?? null } : null };
  });
  let tz = meta.org.timezone || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  const last = opts.to ? mondayOf(opts.to) : lastCompleteWeek(now, tz);
  const startDefault = meta.org.verified_at ? mondayOf(meta.org.verified_at.toISOString().slice(0, 10)) : new Date(Date.parse(`${last}T00:00:00Z`) - 9 * 7 * DAY).toISOString().slice(0, 10);
  const first = opts.from ? mondayOf(opts.from) : startDefault;
  if (first > last) throw new NetworkError("REPORT_WINDOW: no complete week in this window yet", 400);
  const starts: string[] = [];
  for (let t = Date.parse(`${first}T00:00:00Z`); t <= Date.parse(`${last}T00:00:00Z`) && starts.length < MAX_WEEKS; t += 7 * DAY) starts.push(new Date(t).toISOString().slice(0, 10));
  const weeks: WeeklyReview[] = [];
  for (const w of starts) weeks.push(await getWeeklyReview(ctx, orgId, w, now));
  return { ...aggregateWeeks(weeks, meta.signed, meta.baseline), organisation: { id: orgId, name: meta.org.name }, generatedAt: now.toISOString() };
}

/** CSV of the weekly rows plus the totals, for the pilot partner's own analysis. */
export function pilotReportCsv(r: PilotReport): string {
  const rows = [["week_start", "eligible_slots", "filled_slots", "fill_rate_pct", "signed_off"], ...r.weekly.map((w) => [w.week, w.eligible, w.filled, w.ratePct ?? "", w.signedOff ? "yes" : "no"])];
  rows.push(["total", r.primary.eligible, r.primary.filled, r.primary.ratePct ?? "", ""]);
  return `# ${r.reportVersion} · ${r.metricVersion} · ${r.organisation.name} · generated ${r.generatedAt}\n` + rows.map((x) => x.join(",")).join("\n") + "\n";
}
