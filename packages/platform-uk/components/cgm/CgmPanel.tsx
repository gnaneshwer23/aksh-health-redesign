"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type Metrics = {
  from: string;
  to: string;
  days: number;
  readings: number;
  intervalMin: number;
  wearPct: number;
  sufficient: boolean;
  meanMmol: number;
  cvPct: number;
  gmiPct: number;
  gmiMmolMol: number;
  pct: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number };
  flags: string[];
};
type Hour = { hour: number; p5: number; p25: number; p50: number; p75: number; p95: number; n: number };
type View = {
  linked?: boolean;
  glucoseUnit?: string;
  latest: string | null;
  stale: boolean;
  metrics: Metrics | null;
  agp: Hour[];
  uploads: { id: string; uploaderKind: string; format: string; filename: string | null; createdAt: string; firstAt: string; lastAt: string }[];
  pendingPatientUploads?: number;
};
type Preview = {
  ok: boolean;
  format: string | null;
  unit: string | null;
  dateOrder: string | null;
  rowsRead: number;
  readings: number;
  rejected: number;
  rejectedSample: { line: number; reason: string }[];
  from: string | null;
  to: string | null;
  metrics: Metrics | null;
  problem: string | null;
  alreadyStored: number;
  timeZone: string;
};

const FORMAT_LABEL: Record<string, string> = { dexcom_clarity: "Dexcom Clarity export", libreview: "LibreView export", generic: "CSV" };
const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function glucose(mmol: number, unit?: string) {
  return unit === "mg/dL" ? `${Math.round(mmol * 18.0182)} mg/dL` : `${mmol} mmol/L`;
}

/** Stacked bar of time in ranges, consensus colours replaced by tokens with text labels (not colour alone). */
function RangeBar({ pct, unit }: { pct: Metrics["pct"]; unit?: string }) {
  const parts = [
    { k: "Very high", v: pct.veryHigh, cls: "bg-amber-700", note: `> ${glucose(13.9, unit)}` },
    { k: "High", v: pct.high, cls: "bg-amber-400", note: `${glucose(10.1, unit)}–${glucose(13.9, unit)}` },
    { k: "In range", v: pct.inRange, cls: "bg-secondary", note: `${glucose(3.9, unit)}–${glucose(10, unit)}` },
    { k: "Low", v: pct.low, cls: "bg-red-400", note: `${glucose(3.0, unit)}–${glucose(3.8, unit)}` },
    { k: "Very low", v: pct.veryLow, cls: "bg-red-800", note: `< ${glucose(3.0, unit)}` },
  ];
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex w-6 flex-col overflow-hidden rounded" aria-hidden>
        {parts.map((p) => <div key={p.k} className={p.cls} style={{ height: `${Math.max(p.v, 0.5) * 1.2}px` }} />)}
      </div>
      <ul className="m-0 list-none space-y-0.5 p-0 text-xs" data-cgm-ranges>
        {parts.map((p) => <li key={p.k}><span className="font-semibold text-foreground">{p.v}%</span> {p.k.toLowerCase()} <span className="text-muted">({p.note})</span></li>)}
      </ul>
    </div>
  );
}

/** Ambulatory glucose profile: median line with 25–75 and 5–95 percentile bands across the day. */
function AgpChart({ hours, unit }: { hours: Hour[]; unit?: string }) {
  const W = 480;
  const H = 180;
  const max = 22;
  const x = (h: number) => (h / 23) * (W - 40) + 30;
  const y = (v: number) => H - 20 - (Math.min(v, max) / max) * (H - 30);
  const ok = hours.filter((h) => h.n > 0);
  if (ok.length < 4) return null;
  const band = (lo: keyof Hour, hi: keyof Hour) =>
    `${ok.map((h) => `${x(h.hour)},${y(h[hi] as number)}`).join(" ")} ${[...ok].reverse().map((h) => `${x(h.hour)},${y(h[lo] as number)}`).join(" ")}`;
  const ticks = [3.9, 10];
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" role="img" aria-label="Ambulatory glucose profile: daily pattern of glucose percentiles by hour">
        <rect x={30} y={y(10)} width={W - 40} height={y(3.9) - y(10)} className="fill-secondary/10" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={30} x2={W - 10} y1={y(t)} y2={y(t)} className="stroke-secondary" strokeDasharray="4 3" strokeWidth={1} />
            <text x={0} y={y(t) + 4} className="fill-current text-[10px]">{unit === "mg/dL" ? Math.round(t * 18.0182) : t}</text>
          </g>
        ))}
        <polygon points={band("p5", "p95")} className="fill-foreground/10" />
        <polygon points={band("p25", "p75")} className="fill-foreground/25" />
        <polyline points={ok.map((h) => `${x(h.hour)},${y(h.p50)}`).join(" ")} className="fill-none stroke-foreground" strokeWidth={2} />
        {[0, 6, 12, 18, 23].map((h) => <text key={h} x={x(h) - 8} y={H - 4} className="fill-current text-[10px]">{String(h).padStart(2, "0")}:00</text>)}
      </svg>
      <figcaption className="text-xs text-muted">Median (line), middle half of readings (dark band) and 5th–95th percentile (light band) by time of day. Shaded area: target range.</figcaption>
    </figure>
  );
}

function Upload({ base, onDone }: { base: string; onDone: (msg: string) => void }) {
  const [csv, setCsv] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>();
  const [order, setOrder] = useState<string | undefined>();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(text: string, dateOrder?: string) {
    setBusy(true);
    setError(null);
    const r = await fetch(`${base}/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: text, dateOrder }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setPreview(d);
    else setError(d.error ?? "Could not read the file");
  }

  return (
    <div className="space-y-2 rounded-xl border border-border-subtle p-3 text-sm" data-cgm-upload>
      <label className="block">
        <span className="text-muted">CGM export (CSV from Dexcom Clarity, LibreView or similar)</span>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="CGM export file"
          className="mt-1 block text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            setCsv(text);
            setFilename(f.name);
            setOrder(undefined);
            await check(text);
          }}
        />
      </label>
      {busy ? <p className="text-muted">Reading the file…</p> : null}
      {error ? <p className="text-red-700" role="alert">{error}</p> : null}
      {preview ? (
        <div className="space-y-1" role="status" data-cgm-preview>
          {preview.dateOrder === "ambiguous" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Dates in this file could be day/month or month/day. Which is it?</span>
              <Button size="sm" variant="outline" onClick={() => { setOrder("dmy"); void check(csv!, "dmy"); }}>Day first (31-12)</Button>
              <Button size="sm" variant="outline" onClick={() => { setOrder("mdy"); void check(csv!, "mdy"); }}>Month first (12-31)</Button>
            </div>
          ) : null}
          {preview.problem && preview.dateOrder !== "ambiguous" ? <p className="text-red-700">{preview.problem}</p> : null}
          {preview.ok ? (
            <>
              <p>
                {FORMAT_LABEL[preview.format ?? ""] ?? "CSV"} in {preview.unit} · {preview.readings} readings from {day(preview.from!)} to {day(preview.to!)} (times read in {preview.timeZone})
                {preview.alreadyStored ? ` · ${preview.alreadyStored} already stored and will be skipped` : ""}
                {preview.rejected ? ` · ${preview.rejected} rows could not be read` : ""}
              </p>
              {preview.rejectedSample.length ? <p className="text-xs text-muted">For example line {preview.rejectedSample[0]!.line}: {preview.rejectedSample[0]!.reason}</p> : null}
              {preview.metrics && !preview.metrics.sufficient ? <p className="text-xs text-muted">Less than 14 days or under 70% wear: readings are stored, but no clinical summary is made.</p> : null}
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv, dateOrder: order, filename }) });
                  const d = await r.json().catch(() => ({}));
                  setBusy(false);
                  if (!r.ok) return setError(d.error ?? "Could not save");
                  setPreview(null);
                  setCsv(null);
                  onDone(`${d.accepted} readings saved${d.duplicate ? `, ${d.duplicate} already stored` : ""}.`);
                }}
              >
                Save {preview.readings - preview.alreadyStored} readings
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** CGM for one patient: metrics against consensus targets, AGP, uploads. Used by clinicians and by the patient. */
export function CgmPanel({ base, audience }: { base: string; audience: "clinician" | "patient" }) {
  const [view, setView] = useState<View | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const current = useRef(base);

  const load = useCallback(async () => {
    const b = base;
    const r = await fetch(b);
    const d = r.ok ? await r.json() : null;
    if (current.current === b) setView(d);
  }, [base]);
  useEffect(() => {
    current.current = base;
    setView(null);
    setMessage(null);
    void load();
  }, [base, load]);

  if (!view || view.linked === false) return null;
  const m = view.metrics;
  const unit = view.glucoseUnit;
  return (
    <section className="space-y-3" data-cgm-panel>
      <p className="text-xs font-medium text-foreground">Continuous glucose (last 14 days of data)</p>
      {message ? <p role="status" className="text-xs">{message}</p> : null}
      {m ? (
        <>
          <p className="text-xs text-muted">
            {day(m.from)} to {day(m.to)} · {m.readings} readings · sensor wear {m.wearPct}%
            {view.stale ? " · this data is more than 3 days old" : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <RangeBar pct={m.pct} unit={unit} />
            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1 text-xs" data-cgm-metrics>
              <dt className="text-muted">Time in range</dt><dd className="m-0 font-semibold text-foreground">{m.pct.inRange}%</dd>
              <dt className="text-muted">Average glucose</dt><dd className="m-0 text-foreground">{glucose(m.meanMmol, unit)}</dd>
              <dt className="text-muted">GMI</dt><dd className="m-0 text-foreground">{m.gmiPct}% ({m.gmiMmolMol} mmol/mol)</dd>
              <dt className="text-muted">Variability (CV)</dt><dd className="m-0 text-foreground">{m.cvPct}%</dd>
            </dl>
          </div>
          {audience === "clinician" && m.flags.length ? (
            <ul className="m-0 list-disc space-y-0.5 pl-5 text-xs text-red-800" data-cgm-flags>{m.flags.map((f) => <li key={f}>{f}</li>)}</ul>
          ) : null}
          {audience === "patient" ? <p className="text-xs text-muted">Your care team will look at these with you. If you have a low you can&apos;t treat, use your emergency route.</p> : null}
          <AgpChart hours={view.agp} unit={unit} />
          {audience === "clinician" ? <p className="text-xs text-muted">Targets shown are the general adult consensus targets; choose the right targets for this person.</p> : null}
        </>
      ) : (
        <p className="text-xs text-muted">No CGM data yet.</p>
      )}
      {audience === "clinician" && view.pendingPatientUploads ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-muted p-2 text-xs" data-cgm-unchecked>
          <span>{view.pendingPatientUploads} upload{view.pendingPatientUploads === 1 ? "" : "s"} by the patient: not used in the record or the worklist until you review {view.pendingPatientUploads === 1 ? "it" : "them"}.</span>
          <Button size="sm" variant="outline" onClick={async () => {
            const r = await fetch(`${base}/review`, { method: "POST" });
            setMessage(r.ok ? "Patient's CGM data reviewed; it now counts" : "Could not record the review");
            await load();
          }}>Mark patient&apos;s CGM data as reviewed</Button>
        </div>
      ) : null}
      <Upload base={base} onDone={(msg) => { setMessage(msg); void load(); }} />
      {view.uploads.length ? (
        <p className="text-xs text-muted">Last upload: {FORMAT_LABEL[view.uploads[0]!.format] ?? view.uploads[0]!.format}, {day(view.uploads[0]!.createdAt)} by {view.uploads[0]!.uploaderKind === "patient" ? "the patient" : "the clinic"}.</p>
      ) : null}
    </section>
  );
}
