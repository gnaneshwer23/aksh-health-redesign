"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SignOff, WeeklyReview as Report } from "@/lib/access/weekly-review";

type Org = { id: string; name: string; isAdmin: boolean };
type Payload = { report: Report; signOffs: SignOff[]; canSignOff: boolean };

const DAY = 86_400_000;
const shiftWeek = (start: string, weeks: number) => new Date(Date.parse(`${start}T00:00:00Z`) + weeks * 7 * DAY).toISOString().slice(0, 10);
const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const lastDay = (end: string) => fmtDate(new Date(Date.parse(`${end}T00:00:00Z`) - DAY).toISOString().slice(0, 10));
const dash = (v: number | null, unit = "") => (v === null ? "–" : `${v}${unit}`);
const minutes = (m: number | null) => (m === null ? "–" : m < 120 ? `${m} min` : `${Math.round((m / 60) * 10) / 10} h`);

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      {sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function Rows({ rows, empty }: { rows: { k: string; v: number }[]; empty: string }) {
  if (!rows.length) return <p className="text-xs text-muted">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.k} className="border-b border-border-subtle last:border-0">
            <td className="py-1 pr-2 text-foreground">{r.k}</td>
            <td className="py-1 text-right tabular-nums text-foreground">{r.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Week 12 pilot: the weekly review for one clinic, with sign-off. Printable. */
export function WeeklyReview({ initialOrgId, initialWeek }: { initialOrgId?: string; initialWeek?: string }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState(initialOrgId ?? "");
  const [week, setWeek] = useState<string | undefined>(initialWeek);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ summary: "", actionsAgreed: "", attendees: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/orgs")
      .then(async (r) => (r.ok ? ((await r.json()).rows as Org[]) : []))
      .then((rows) => {
        setOrgs(rows);
        setOrgId((cur) => (cur && rows.some((o) => o.id === cur) ? cur : rows[0]?.id ?? ""));
      })
      .catch(() => setError("Could not load your organisations"));
  }, []);

  const load = useCallback(async () => {
    if (!orgId) return;
    setData(null);
    setError(null);
    const r = await fetch(`/api/orgs/${orgId}/weekly-review${week ? `?week=${week}` : ""}`);
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return setError(body.error ?? "Not available");
    setData(body as Payload);
  }, [orgId, week]);
  useEffect(() => {
    void load();
  }, [load]);

  async function signOff() {
    if (!data) return;
    setBusy(true);
    setMessage(null);
    try {
      const r = await fetch(`/api/orgs/${orgId}/weekly-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: data.report.week.start, ...form }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) return setMessage(body.error ?? "Sign-off failed");
      setForm({ summary: "", actionsAgreed: "", attendees: "" });
      setMessage("Signed off. The figures are frozen with your sign-off.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const rep = data?.report;
  const f = rep?.funnel;
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 print:p-0" data-weekly-review>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {orgs.length > 1 ? (
          <select aria-label="Organisation" className="h-9 rounded-full border border-border-subtle bg-card px-3 text-sm" value={orgId} onChange={(e) => { setWeek(undefined); setOrgId(e.target.value); }}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ) : null}
        {rep ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setWeek(shiftWeek(rep.week.start, -1))}>Previous week</Button>
            <Button size="sm" variant="outline" disabled={!rep.week.complete} onClick={() => setWeek(shiftWeek(rep.week.start, 1))}>Next week</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>Print</Button>
            <a className="text-sm font-medium text-secondary underline-offset-2 hover:underline" href={`/dashboard/access/pilot-report?org=${orgId}`}>Pilot readout</a>
          </>
        ) : null}
      </div>

      {error ? <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-foreground" role="alert">{error}</p> : null}
      {!rep && !error ? <p className="text-sm text-muted">Loading…</p> : null}

      {rep && f ? (
        <>
          <header className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground" data-review-title>
                {rep.organisation.name}: week of {fmtDate(rep.week.start)}
              </h1>
              <Badge variant="outline">{rep.week.mode === "live_shadow" ? "Live, shadow mode" : "Rehearsal"}</Badge>
              {!rep.week.complete ? <Badge variant="outline">Week in progress</Badge> : null}
              {data!.signOffs.length ? <Badge data-signed-off>Signed off</Badge> : null}
            </div>
            <p className="text-xs text-muted">
              {fmtDate(rep.week.start)} to {lastDay(rep.week.end)} ({rep.organisation.timezone}). Slots received this week; outcomes as of {new Date(rep.generatedAt).toLocaleString()}. Report {rep.reportVersion}, metric {rep.metricVersion}.
            </p>
          </header>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Fill rate</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <Stat label="This week" value={dash(rep.fill.ratePct, "%")} sub={`${f.filled} of ${f.eligible} slots${rep.fill.ci95 ? ` · 95% range ${rep.fill.ci95[0]}–${rep.fill.ci95[1]}%` : ""}`} />
              <Stat label="Previous week" value={dash(rep.fill.previousWeekPct, "%")} />
              <Stat label="Baseline (before Aksh)" value={dash(rep.fill.baselinePct, "%")} sub={rep.fill.baselinePct === null ? "Not locked yet" : undefined} />
              <Stat label="Still being worked" value={f.stillOpen} />
              <p className="text-xs text-muted sm:col-span-4">{rep.definition} One week is a small sample: read rates with their counts.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">What to discuss</CardTitle></CardHeader>
            <CardContent>
              {rep.prompts.length ? (
                <ul className="m-0 list-disc space-y-1 pl-5 text-sm text-foreground" data-review-prompts>{rep.prompts.map((p) => <li key={p}>{p}</li>)}</ul>
              ) : <p className="text-sm text-muted">Nothing flagged this week.</p>}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Slots</CardTitle></CardHeader>
              <CardContent data-review-funnel>
                <Rows empty="" rows={[
                  { k: "Received", v: f.received },
                  { k: "Withdrawn by the clinic", v: f.withdrawn },
                  { k: "Ranked candidates found", v: f.ranked },
                  { k: "No eligible patient", v: f.noCandidates },
                  { k: "Offer drafted", v: f.offered },
                  { k: "Contact approved by staff", v: f.contactApproved },
                  { k: "Patient accepted", v: f.accepted },
                  { k: "Filled (booked and verified in time)", v: f.filled },
                  { k: "Booked, outside the fill definition", v: f.bookedOutsideMetric },
                  { k: "Expired", v: f.expired },
                  { k: "Not found on read-back", v: f.failedSafe },
                  { k: "Passed to a person (hand-off)", v: f.handedOff },
                ]} />
                <p className="mt-2 text-xs text-muted">Responses: {rep.responses.declined} declined, {rep.responses.noResponse} no response, {rep.responses.unreachable} unreachable, {rep.responses.escalated} escalated to a person.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Staff decisions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Rows empty="" rows={[
                  { k: "Patients selected for an offer", v: rep.staff.selections },
                  { k: "Took Aksh's top-ranked patient", v: rep.staff.tookTopRanked },
                  { k: "Chose another ranked patient", v: rep.staff.choseOther },
                  { k: "Not recorded (before this report)", v: rep.staff.notRecorded },
                  { k: "Candidates skipped", v: rep.staff.skips },
                  { k: "Offers edited", v: rep.staff.offersEdited },
                  { k: "Deferred", v: rep.staff.deferrals },
                ]} />
                {rep.staff.skipReasons.length ? (
                  <>
                    <p className="text-xs font-medium text-muted">Skip reasons</p>
                    <Rows empty="" rows={rep.staff.skipReasons.map((s) => ({ k: s.reason, v: s.count }))} />
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Speed (medians)</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Slot to offer drafted" value={minutes(rep.timeliness.medianMinutesToOffer)} />
                <Stat label="Slot to verified booking" value={minutes(rep.timeliness.medianMinutesToVerifiedBooking)} />
                <Stat label="Booked before the slot" value={dash(rep.timeliness.medianHoursBookedBeforeStart, " h")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Hand-offs created this week</CardTitle></CardHeader>
              <CardContent>
                <Rows empty="" rows={[
                  { k: "Created", v: rep.handoffs.created },
                  { k: "Urgent", v: rep.handoffs.urgent },
                  { k: "Soon", v: rep.handoffs.soon },
                  { k: "Routine", v: rep.handoffs.routine },
                  { k: "Closed", v: rep.handoffs.closed },
                  { k: "Open and overdue now", v: rep.handoffs.openOverdue },
                  { k: "Acknowledged after the due time", v: rep.handoffs.acknowledgedLate },
                ]} />
              </CardContent>
            </Card>

            <Card data-review-guardrails>
              <CardHeader className="pb-2"><CardTitle className="text-base">Guardrails</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Rows empty="" rows={[
                  { k: "Booking checks against the schedule", v: rep.guardrails.bookingChecks },
                  { k: "Not found on read-back", v: rep.guardrails.bookingIssues },
                  { k: "Slots confirmed as booked more than once", v: rep.guardrails.duplicateBookings },
                  { k: "Hand-offs acknowledged", v: rep.guardrails.handoffsAcknowledged },
                  { k: "Patients who asked to stop contact this week", v: rep.guardrails.optOutsRecorded },
                  { k: "Complaints recorded", v: rep.guardrails.complaints },
                  { k: "Staff minutes logged", v: rep.guardrails.staffMinutes },
                  { k: "Candidates not offered: opted out of contact", v: rep.guardrails.optedOutCandidates },
                ]} />
                <p className="text-xs text-muted">
                  Booking issues per 100 checks: {dash(rep.guardrails.bookingIssuesPer100)} · Hand-offs acknowledged on time: {dash(rep.guardrails.handoffsAcknowledgedOnTimePct, "%")} · Median time to acknowledge: {minutes(rep.guardrails.medianMinutesToAcknowledge)}.
                  Staff minutes per slot: {dash(rep.guardrails.staffMinutesPerSlot)} over {rep.guardrails.slotsTimed} timed slot{rep.guardrails.slotsTimed === 1 ? "" : "s"}{rep.guardrails.baselineStaffMinutesPerSlot !== null ? ` (baseline ${rep.guardrails.baselineStaffMinutesPerSlot})` : ""}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Schedule connection</CardTitle></CardHeader>
              <CardContent>
                <Rows empty="No messages from the schedule this week." rows={rep.connector.byResult.map((e) => ({ k: e.result, v: e.count }))} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Waiting-list data gaps</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-medium text-muted">Missing fields</p>
                <Rows empty="None." rows={rep.dataGaps.missingFields.map((m) => ({ k: m.field, v: m.candidates }))} />
                <p className="text-xs font-medium text-muted">Why candidates were not offered</p>
                <Rows empty="None." rows={rep.dataGaps.exclusions.map((m) => ({ k: m.code, v: m.candidates }))} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Sign-off</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data!.signOffs.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-border-subtle p-3" data-signoff>
                  <p className="text-xs text-muted">
                    {i === data!.signOffs.length - 1 ? "Signed off" : "Addendum"} by {s.reviewerName ?? s.reviewedBy} on {new Date(s.createdAt).toLocaleString()} · frozen figures: {s.snapshot.funnel.filled} of {s.snapshot.funnel.eligible} filled
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">{s.summary}</p>
                  {s.actionsAgreed ? <p className="mt-1 whitespace-pre-wrap text-foreground"><span className="font-medium">Actions: </span>{s.actionsAgreed}</p> : null}
                  {s.attendees ? <p className="mt-1 text-xs text-muted">Attendees: {s.attendees}</p> : null}
                </div>
              ))}
              {!data!.signOffs.length ? <p className="text-muted">Not signed off yet.</p> : null}
              {data!.canSignOff && rep.week.complete ? (
                <div className="space-y-2 print:hidden">
                  <label className="block">
                    <span className="text-xs text-muted">{data!.signOffs.length ? "Addendum (the earlier sign-off stays)" : "What the review concluded"}</span>
                    <textarea aria-label="Review summary" className="mt-1 w-full rounded-xl border border-border-subtle bg-card p-2" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Actions agreed (optional)</span>
                    <textarea aria-label="Actions agreed" className="mt-1 w-full rounded-xl border border-border-subtle bg-card p-2" rows={2} value={form.actionsAgreed} onChange={(e) => setForm({ ...form, actionsAgreed: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Attendees (optional)</span>
                    <input aria-label="Attendees" className="mt-1 h-9 w-full rounded-xl border border-border-subtle bg-card px-2" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
                  </label>
                  <Button size="sm" disabled={busy || !form.summary.trim()} onClick={() => void signOff()}>
                    {data!.signOffs.length ? "Add addendum" : "Sign off this week"}
                  </Button>
                </div>
              ) : null}
              {data!.canSignOff && !rep.week.complete ? <p className="text-xs text-muted">You can sign off once the week has ended.</p> : null}
              {message ? <p className="text-sm text-foreground" role="status">{message}</p> : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
