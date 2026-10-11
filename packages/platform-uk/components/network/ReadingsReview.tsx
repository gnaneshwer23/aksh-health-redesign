"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  patientId: string;
  patientName: string;
  recordRef: string | null;
  kind: string;
  value: number;
  unit: string;
  context: string | null;
  flag: string | null;
  observedAt: string;
  clientRef: string | null;
  source: string;
  glucoseUnit: string | null;
};
type Line = { ids: string[]; row: Row; text: string };

const FLAG_LABEL: Record<string, string> = { very_low: "very low", low: "low", high: "high", very_high: "very high" };

function toLines(rows: Row[]): Line[] {
  const out: Line[] = [];
  const done = new Set<string>();
  for (const r of rows) {
    if (done.has(r.id)) continue;
    if (r.kind === "systolic_bp" || r.kind === "diastolic_bp") {
      const base = r.clientRef?.replace(/-(sys|dia)$/, "");
      const pair = rows.filter((x) => x.patientId === r.patientId && base && x.clientRef?.replace(/-(sys|dia)$/, "") === base);
      pair.forEach((x) => done.add(x.id));
      const sys = pair.find((x) => x.kind === "systolic_bp") ?? r;
      const dia = pair.find((x) => x.kind === "diastolic_bp");
      out.push({ ids: pair.length ? pair.map((x) => x.id) : [r.id], row: sys, text: `Blood pressure ${sys.value}/${dia?.value ?? "?"} mmHg` });
      continue;
    }
    done.add(r.id);
    const g = r.kind === "glucose" ? (r.glucoseUnit === "mg/dL" ? `${Math.round(r.value * 18.0182)} mg/dL` : `${r.value} mmol/L`) : `${r.value} ${r.unit}`;
    out.push({ ids: [r.id], row: r, text: `${r.kind === "glucose" ? "Glucose" : r.kind === "weight" ? "Weight" : r.kind} ${g}${r.context ? ` · ${r.context.replace("_", " ")}` : ""}` });
  }
  return out;
}

/** Clinicians: patient-reported readings not yet checked. Checking is final and makes them count clinically. */
export function ReadingsReview() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (offset = 0) => {
    try {
      const r = await fetch(`/api/network/readings/review?offset=${offset}`);
      if (r.status === 401 || r.status === 403) return setRows(null); // not a clinician: stay hidden
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { rows: Row[]; nextOffset: number | null };
      setFailed(false);
      setRows((prev) => (offset && prev ? [...prev, ...d.rows] : d.rows));
      setNextOffset(d.nextOffset);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => void load(), [load]);

  if (failed && !rows) {
    return (
      <Card className="mx-4 mt-4 md:mx-6" data-readings-review>
        <CardContent className="flex flex-wrap items-center gap-2 p-4 text-sm" role="alert">
          Patient readings to check could not be loaded. <Button size="sm" variant="outline" onClick={() => void load()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }
  if (!rows) return null;
  const lines = toLines(rows);
  const toggle = (ids: string[]) =>
    setSelected((s) => {
      const n = new Set(s);
      const on = ids.every((i) => n.has(i));
      ids.forEach((i) => (on ? n.delete(i) : n.add(i)));
      return n;
    });

  return (
    <Card className="mx-4 mt-4 md:mx-6" data-readings-review>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Patient readings to check ({lines.length})</CardTitle>
        <Button
          size="sm"
          disabled={!selected.size}
          onClick={async () => {
            // The endpoint takes at most 200 at a time.
            const ids = [...selected];
            let verified = 0;
            let failure: string | null = null;
            for (let i = 0; i < ids.length && !failure; i += 200) {
              const r = await fetch("/api/network/readings/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: ids.slice(i, i + 200) }) });
              const d = await r.json().catch(() => ({}));
              if (r.ok) verified += d.verified ?? 0;
              else failure = d.error ?? "Could not mark as checked";
            }
            setMessage(failure ? `${verified} marked as checked; then: ${failure}` : `${verified} reading${verified === 1 ? "" : "s"} marked as checked`);
            setSelected(new Set());
            await load();
          }}
        >
          Mark as checked
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-muted">Entered by patients and not yet checked. They are not used in risk or care gaps until a clinician checks them. Flagged readings come first.</p>
        {message ? <p role="status" className="text-sm">{message}</p> : null}
        {lines.length === 0 ? <p className="text-muted">Nothing to check.</p> : (
          <ul className="m-0 max-h-80 list-none divide-y divide-border-subtle overflow-y-auto p-0">
            {lines.map((l) => (
              <li key={l.ids.join()} className="flex flex-wrap items-center gap-3 py-2">
                <input type="checkbox" aria-label={`Select ${l.row.patientName} ${l.text}`} checked={l.ids.every((i) => selected.has(i))} onChange={() => toggle(l.ids)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-foreground">{l.row.patientName} <span className="text-xs text-muted">{l.row.recordRef ?? ""}</span></span>
                  <span className="block text-xs text-muted">{l.text} · {new Date(l.row.observedAt).toLocaleString()}</span>
                </span>
                {l.row.flag ? <Badge variant="danger">{FLAG_LABEL[l.row.flag] ?? l.row.flag}</Badge> : null}
              </li>
            ))}
          </ul>
        )}
        {nextOffset !== null ? <Button size="sm" variant="outline" onClick={() => void load(nextOffset)}>Load more</Button> : null}
        {failed ? <p className="text-xs text-red-700" role="alert">Could not load more. Try again.</p> : null}
      </CardContent>
    </Card>
  );
}
