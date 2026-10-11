"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PilotReport } from "@/lib/access/pilot-report";

type Org = { id: string; name: string };
const dash = (v: number | null | undefined, unit = "") => (v === null || v === undefined ? "–" : `${v}${unit}`);
const VERDICT: Record<string, string> = { too_early: "Too few slots to compare", above: "Higher than the baseline", similar: "No clear difference from the baseline", below: "Lower than the baseline" };

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

/** PRD v1.1 §10.3 / §17: the pilot readout. Primary metric, guardrails, coverage and limitations over complete weeks. */
export function PilotReadout({ initialOrgId }: { initialOrgId?: string }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState(initialOrgId ?? "");
  const [r, setR] = useState<PilotReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/orgs").then(async (res) => (res.ok ? ((await res.json()).rows as Org[]) : [])).then((rows) => {
      setOrgs(rows);
      setOrgId((cur) => (cur && rows.some((o) => o.id === cur) ? cur : rows[0]?.id ?? ""));
    });
  }, []);
  useEffect(() => {
    if (!orgId) return;
    setR(null);
    setError(null);
    void fetch(`/api/orgs/${orgId}/pilot-report`).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      if (res.ok) setR(body as PilotReport);
      else setError(body.error ?? "The readout is not available");
    });
  }, [orgId]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6" data-pilot-readout>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Pilot readout</h1>
          <p className="text-sm text-muted">The pilot’s primary metric and guardrails across complete weeks, reproducible from the weekly reviews.</p>
        </div>
        {orgs.length > 1 ? (
          <select aria-label="Organisation" className="h-9 rounded-full px-3 text-sm" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ) : null}
      </div>
      {error ? <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm" role="alert">{error}</p> : null}
      {!r && !error ? <p className="text-sm text-muted">Loading…</p> : null}
      {r ? (
        <>
          <p className="text-xs text-muted">
            {r.organisation.name} · {r.window.from} to {r.window.to} ({r.window.weeks} week{r.window.weeks === 1 ? "" : "s"}) · {r.reportVersion} · {r.metricVersion} ·{" "}
            <a className="text-secondary underline underline-offset-2" href={`/api/orgs/${orgId}/pilot-report?format=csv`}>Download CSV</a>
          </p>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Primary metric: cancellation-slot fill rate</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3" data-readout-primary>
              <Stat label="Pilot" value={dash(r.primary.ratePct, "%")} sub={`${r.primary.filled} of ${r.primary.eligible} slots${r.primary.ci95 ? ` · 95% range ${r.primary.ci95[0]}–${r.primary.ci95[1]}%` : ""}`} />
              <Stat label="Baseline (locked)" value={dash(r.baseline?.ratePct, "%")} sub={r.baseline ? `${r.baseline.filled} of ${r.baseline.freed} freed slots` : "Not locked"} />
              <Stat label="Difference" value={r.comparison ? VERDICT[r.comparison.verdict] ?? r.comparison.verdict : "Needs a baseline"} sub={r.comparison?.differencePts != null ? `${r.comparison.differencePts > 0 ? "+" : ""}${r.comparison.differencePts} points (95% range ${r.comparison.ci95![0]} to ${r.comparison.ci95![1]})` : undefined} />
              <p className="text-xs text-muted sm:col-span-3">{r.definition}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2" data-readout-guardrails>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Booking integrity</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Schedule checks" value={r.guardrails.bookingIntegrity.checks} />
                <Stat label="Issues per 100" value={dash(r.guardrails.bookingIntegrity.per100)} sub={`${r.guardrails.bookingIntegrity.issues} not found on read-back`} />
                <Stat label="Booked twice" value={r.guardrails.bookingIntegrity.duplicateBookings} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Safe hand-off</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Created" value={r.guardrails.handoffs.created} />
                <Stat label="Acknowledged on time" value={dash(r.guardrails.handoffs.acknowledgedOnTimePct, "%")} sub={`${r.guardrails.handoffs.acknowledged} acknowledged`} />
                <Stat label="Open and overdue now" value={r.guardrails.handoffs.openOverdueNow} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Patient access</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Complaints" value={r.guardrails.patientAccess.complaints} />
                <Stat label="Asked to stop" value={r.guardrails.patientAccess.optOuts} />
                <Stat label="Unreachable" value={r.guardrails.patientAccess.unreachable} sub={`${r.guardrails.patientAccess.declined} declined · ${r.guardrails.patientAccess.noResponse} no reply · ${r.guardrails.patientAccess.escalated} escalated`} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Staff time</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Stat label="Minutes logged" value={r.guardrails.staffTime.minutes} sub={`${r.guardrails.staffTime.slotsTimed} slots timed`} />
                <Stat label="Per slot" value={dash(r.guardrails.staffTime.perSlot)} />
                <Stat label="Baseline per slot" value={dash(r.guardrails.staffTime.baselinePerSlot)} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Weeks</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm" data-readout-weeks>
                <thead><tr className="text-left text-xs text-muted"><th className="py-1">Week of</th><th>Eligible</th><th>Filled</th><th>Rate</th><th>Signed off</th></tr></thead>
                <tbody>
                  {r.weekly.map((w) => (
                    <tr key={w.week} className="border-t border-border-subtle tabular-nums">
                      <td className="py-1.5"><a className="text-secondary underline-offset-2 hover:underline" href={`/dashboard/access/review?org=${orgId}&week=${w.week}`}>{w.week}</a></td>
                      <td>{w.eligible}</td><td>{w.filled}</td><td>{dash(w.ratePct, "%")}</td>
                      <td>{w.signedOff ? <Badge variant="outline">Signed off</Badge> : <span className="text-xs text-muted">Not yet</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Coverage and decisions</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{r.coverage.slotsReceived} slots received · {r.coverage.withdrawn} withdrawn · {r.coverage.noEligiblePatient} with no eligible patient · {r.coverage.stillOpen} still open</p>
                <p>{r.staffDecisions.selections} selections: {r.staffDecisions.tookTopRanked} took the top-ranked patient, {r.staffDecisions.choseOther} chose another · {r.staffDecisions.skips} skips</p>
                {r.coverage.missingFields.length ? <p className="text-muted">Missing data: {r.coverage.missingFields.map((m) => `${m.field} (${m.candidates})`).join(", ")}</p> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Limitations</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground" data-readout-limitations>{r.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
