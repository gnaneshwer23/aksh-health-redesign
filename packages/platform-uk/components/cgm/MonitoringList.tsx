"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { CgmPanel } from "./CgmPanel";

type Row = {
  patientId: string;
  name: string;
  recordRef: string | null;
  organisation: string;
  lastAt: string;
  stale: boolean;
  pct: { veryLow: number; low: number; inRange: number; veryHigh: number };
  meanMmol: number;
  cvPct: number;
  wearPct: number;
  sufficient: boolean;
  uncheckedSummary: boolean;
  flags: string[];
  urgency: number;
};

const URGENCY: Record<number, { label: string; variant: "danger" | "warning" | "outline" }> = {
  0: { label: "Very low glucose", variant: "danger" },
  1: { label: "Low glucose", variant: "danger" },
  2: { label: "Data stopped", variant: "warning" },
  3: { label: "Very high glucose", variant: "warning" },
  4: { label: "Below range target", variant: "warning" },
  5: { label: "Not enough data", variant: "outline" },
  6: { label: "On target", variant: "outline" },
};

const ago = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 3_600_000;
  return h < 1 ? "within the hour" : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} days ago`;
};

/** Clinicians' CGM worklist: most urgent first; open a row to see the full CGM view. */
export function MonitoringList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Deep link from Today: /dashboard/monitoring?patient=<id> opens that patient's row.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("patient");
    if (id && /^[\w-]{1,64}$/.test(id)) setOpen(id);
  }, []);

  useEffect(() => {
    void fetch("/api/network/cgm/monitoring")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok) setRows(d.rows);
        else setError(d.error ?? "CGM monitoring is not available");
      })
      .catch(() => setError("We couldn't load CGM monitoring. Check your connection and reload."));
  }, []);

  return (
    <div className="space-y-4 p-4 md:p-6" data-cgm-monitoring>
      <div>
        <h1 className="text-xl font-semibold text-foreground">CGM monitoring</h1>
        <p className="text-sm text-muted">
          Patients with CGM data in the last 30 days, most urgent first, against the general adult consensus targets. This is a worklist for when you
          review it: Aksh does not watch CGM data in real time or alert anyone.
        </p>
      </div>
      {error ? <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-muted" role="status">{error}</p> : null}
      {!rows && !error ? <p className="text-sm text-muted" role="status">Loading…</p> : null}
      {rows ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{rows.length} patients</CardTitle></CardHeader>
          <CardContent>
            {rows.length === 0 ? <p className="text-sm text-muted">No CGM data yet. Upload an export from a patient&apos;s record, or connect a device feed (Organisation → Connections).</p> : null}
            <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-cgm-worklist>
              {rows.map((r) => (
                <li key={r.patientId}>
                  <button type="button" onClick={() => setOpen(open === r.patientId ? null : r.patientId)} aria-expanded={open === r.patientId} className={cn("flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left hover:bg-surface-muted", open === r.patientId && "bg-surface-muted")}>
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground">{r.name} <span className="text-xs text-muted">{r.recordRef ?? ""} · {r.organisation}</span></span>
                      <span className="block text-xs text-muted">
                        In range {r.pct.inRange}% · below 3.9 {Math.round((r.pct.veryLow + r.pct.low) * 10) / 10}% (below 3.0 {r.pct.veryLow}%) · above 13.9 {r.pct.veryHigh}% · wear {r.wearPct}% · last data {ago(r.lastAt)}
                      </span>
                      {r.flags.length ? <span className="block text-xs text-red-800">{r.flags.join("; ")}</span> : null}
                    </span>
                    <span className="flex items-center gap-1">
                      {r.uncheckedSummary ? <Badge variant="outline">Patient upload to review</Badge> : null}
                      <Badge variant={URGENCY[r.urgency]!.variant}>{URGENCY[r.urgency]!.label}</Badge>
                    </span>
                  </button>
                  {open === r.patientId ? (
                    <div className="pb-4">
                      <CgmPanel key={r.patientId} base={`/api/network/patients/${r.patientId}/cgm`} audience="clinician" />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
