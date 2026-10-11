"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Kind = "glucose" | "bp" | "weight";
type Row = {
  id: string;
  kind: string;
  value: number;
  unit: string;
  originalValue: number | null;
  originalUnit: string | null;
  context: string | null;
  flag: string | null;
  observedAt: string;
  status: string;
  clientRef: string | null;
  state: "on_device_account" | "sent" | "checked" | "entered_in_error";
};
type Listing = { linked: boolean; glucoseUnit: "mmol/L" | "mg/dL" | null; emergencyNumber: string | null; readings: Row[]; unsharedPersonal: number };
type Notice = { severity: "urgent" | "warning"; text: string };

const OUTBOX = "aksh_readings_outbox_v1";
const LEGACY = "aksh_self_readings_v1";
const STATE_LABEL: Record<Row["state"], string> = {
  on_device_account: "On your account",
  sent: "Sent to your care team",
  checked: "Checked by your care team",
  entered_in_error: "Entered in error",
};
const CONTEXT_LABEL: Record<string, string> = { fasting: "fasting", before_meal: "before a meal", after_meal: "after a meal", bedtime: "bedtime", other: "other" };

const newRef = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

function readStore<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function writeStore(key: string, value: unknown[] | null) {
  try {
    if (value && value.length) window.localStorage.setItem(key, JSON.stringify(value));
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing queued; the reading was either sent or the error shown.
  }
}

async function send(body: Record<string, unknown>) {
  const r = await fetch("/api/me/readings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

/** Send anything saved while offline. clientRef makes each retry safe: the server ignores duplicates. */
async function flushOutbox() {
  const queued = readStore<Record<string, unknown>>(OUTBOX);
  if (!queued.length) return { sent: 0, rejected: 0 };
  const left: Record<string, unknown>[] = [];
  let sent = 0;
  let rejected = 0;
  for (const body of queued) {
    try {
      const r = await send(body);
      if (r.ok) sent++;
      else if (r.status >= 500 || r.status === 429 || r.status === 401) left.push(body); // try again later
      else rejected++; // the server refused it (e.g. older than 30 days): tell the patient, don't retry forever
    } catch {
      left.push(body);
    }
  }
  writeStore(OUTBOX, left);
  return { sent, rejected };
}

function display(r: Row, glucoseUnit: string | null) {
  if (r.kind === "glucose") {
    const unit = glucoseUnit ?? r.originalUnit ?? "mmol/L";
    const v = unit === "mg/dL" ? Math.round(r.value * 18.0182) : r.value;
    return `${v} ${unit}${r.context ? ` · ${CONTEXT_LABEL[r.context] ?? r.context}` : ""}`;
  }
  if (r.kind === "weight") return r.originalUnit === "lb" && r.originalValue ? `${r.originalValue} lb` : `${r.value} kg`;
  return `${r.value} mmHg`;
}

/** Group the two halves of a blood pressure into one line. */
function lines(rows: Row[]) {
  const out: { key: string; label: string; text: string; row: Row }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (r.kind === "systolic_bp" || r.kind === "diastolic_bp") {
      const base = r.clientRef?.replace(/-(sys|dia)$/, "") ?? r.id;
      if (seen.has(base)) continue;
      seen.add(base);
      const sys = rows.find((x) => x.clientRef === `${base}-sys`) ?? r;
      const dia = rows.find((x) => x.clientRef === `${base}-dia`);
      out.push({ key: base, label: "Blood pressure", text: `${sys.value}/${dia?.value ?? "?"} mmHg`, row: sys });
    } else out.push({ key: r.id, label: r.kind === "glucose" ? "Glucose" : "Weight", text: "", row: r });
  }
  return out;
}

export function MyReadings({ fallbackEmergency }: { fallbackEmergency?: string | null }) {
  const [list, setList] = useState<Listing | null>(null);
  const [kind, setKind] = useState<Kind>("glucose");
  const [f, setF] = useState({ value: "", unit: "", context: "", systolic: "", diastolic: "" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [legacy, setLegacy] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/me/readings");
    if (r.ok) setList(await r.json());
  }, []);

  useEffect(() => {
    void flushOutbox().then(({ sent, rejected }) => {
      const parts = [
        sent ? `${sent} reading${sent === 1 ? "" : "s"} saved while offline ${sent === 1 ? "was" : "were"} sent.` : "",
        rejected ? `${rejected} could not be added (for example, older than 30 days); tell your care team if they matter.` : "",
      ].filter(Boolean);
      if (parts.length) setMessage(parts.join(" "));
      void load();
    });
    setLegacy(readStore(LEGACY).length);
    const online = () => void flushOutbox().then(() => load());
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [load]);

  const glucoseUnit = (f.unit || list?.glucoseUnit || "mmol/L") as "mmol/L" | "mg/dL";
  const weightUnit = (f.unit || "kg") as "kg" | "lb";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setMessage(null);
    const base = { observedAt: new Date().toISOString(), clientRef: newRef() };
    const body =
      kind === "bp"
        ? { kind, systolic: Number(f.systolic), diastolic: Number(f.diastolic), ...base }
        : kind === "glucose"
          ? { kind, value: Number(f.value), unit: glucoseUnit, ...(f.context ? { context: f.context } : {}), ...base }
          : { kind, value: Number(f.value), unit: weightUnit, ...base };
    setBusy(true);
    try {
      const r = await send(body);
      if (r.ok) {
        setNotice(r.data.notice ?? null);
        setMessage(r.data.sharedWithCareTeam ? "Saved and sent to your care team." : "Saved to your account.");
        setF((v) => ({ ...v, value: "", systolic: "", diastolic: "" }));
        await load();
      } else setMessage(r.data.error ?? "That reading could not be saved.");
    } catch {
      writeStore(OUTBOX, [...readStore(OUTBOX), body]);
      setMessage("You seem to be offline. The reading is saved on this phone and will be sent when you are back online.");
    } finally {
      setBusy(false);
    }
  }

  async function importLegacy() {
    const old = readStore<{ at: string; kind: Kind; value: string }>(LEGACY);
    let added = 0;
    for (const r of old) {
      const ref = `legacy-${Date.parse(r.at)}-${r.kind}`;
      const body =
        r.kind === "bp"
          ? (() => {
              const [s, d] = r.value.split("/").map((x) => Number(x.trim()));
              return { kind: "bp", systolic: s, diastolic: d, observedAt: r.at, clientRef: ref };
            })()
          : { kind: r.kind, value: Number(r.value), unit: r.kind === "glucose" ? "mmol/L" : "kg", observedAt: r.at, clientRef: ref };
      const res = await send(body).catch(() => null);
      if (res?.ok) added++;
    }
    writeStore(LEGACY, null);
    setLegacy(0);
    setMessage(`${added} of ${old.length} earlier readings added to your account${added < old.length ? " (older than 30 days or unreadable ones were skipped)" : ""}.`);
    await load();
  }

  const emergency = list?.emergencyNumber ?? fallbackEmergency ?? null;
  const field = "h-10 rounded-md border border-border-subtle bg-white px-3 text-sm";

  return (
    <Card className="shadow-sm" data-my-readings>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-secondary" aria-hidden /> My readings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => void submit(e)}>
          <label className="text-sm">
            <span className="block text-xs text-muted">Reading</span>
            <select className={field} value={kind} onChange={(e) => { setKind(e.target.value as Kind); setF({ value: "", unit: "", context: "", systolic: "", diastolic: "" }); }} aria-label="Reading type">
              <option value="glucose">Glucose</option>
              <option value="bp">Blood pressure</option>
              <option value="weight">Weight</option>
            </select>
          </label>
          {kind === "bp" ? (
            <>
              <label className="text-sm"><span className="block text-xs text-muted">Top (systolic)</span><Input className="h-10 w-24" inputMode="numeric" required value={f.systolic} onChange={(e) => setF((v) => ({ ...v, systolic: e.target.value }))} aria-label="Systolic" /></label>
              <label className="text-sm"><span className="block text-xs text-muted">Bottom (diastolic)</span><Input className="h-10 w-24" inputMode="numeric" required value={f.diastolic} onChange={(e) => setF((v) => ({ ...v, diastolic: e.target.value }))} aria-label="Diastolic" /></label>
            </>
          ) : (
            <>
              <label className="text-sm"><span className="block text-xs text-muted">Value</span><Input className="h-10 w-24" inputMode="decimal" required value={f.value} onChange={(e) => setF((v) => ({ ...v, value: e.target.value }))} aria-label="Reading value" /></label>
              <label className="text-sm">
                <span className="block text-xs text-muted">Unit</span>
                <select className={field} value={kind === "glucose" ? glucoseUnit : weightUnit} onChange={(e) => setF((v) => ({ ...v, unit: e.target.value }))} aria-label="Unit">
                  {(kind === "glucose" ? ["mmol/L", "mg/dL"] : ["kg", "lb"]).map((u) => <option key={u}>{u}</option>)}
                </select>
              </label>
              {kind === "glucose" ? (
                <label className="text-sm">
                  <span className="block text-xs text-muted">When</span>
                  <select className={field} value={f.context} onChange={(e) => setF((v) => ({ ...v, context: e.target.value }))} aria-label="When was it taken">
                    <option value="">Not sure</option>
                    {Object.entries(CONTEXT_LABEL).map(([k, l]) => <option key={k} value={k}>{l[0]!.toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </label>
              ) : null}
            </>
          )}
          <Button type="submit" variant="outline" className="h-10" disabled={busy}>Save</Button>
        </form>

        {notice ? (
          <p role="alert" data-reading-notice className={notice.severity === "urgent" ? "rounded-lg border-2 border-red-700 bg-red-50 p-3 text-sm font-medium text-red-900" : "rounded-lg border border-amber-600 bg-amber-50 p-3 text-sm text-amber-950"}>
            {notice.text}
          </p>
        ) : null}
        {message ? <p role="status" className="text-sm text-muted">{message}</p> : null}

        {legacy ? (
          <div className="rounded-lg bg-surface-muted p-3 text-sm" data-legacy-readings>
            <p>{legacy} reading{legacy === 1 ? " is" : "s are"} saved only on this device from before. Add {legacy === 1 ? "it" : "them"} to your account?</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => void importLegacy()}>Add to my account</Button>
          </div>
        ) : null}
        {list?.unsharedPersonal ? (
          <div className="rounded-lg bg-surface-muted p-3 text-sm" data-share-earlier>
            <p>You recorded {list.unsharedPersonal} reading{list.unsharedPersonal === 1 ? "" : "s"} before joining your clinic. Share {list.unsharedPersonal === 1 ? "it" : "them"} with your care team?</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
              const r = await fetch("/api/me/readings/share", { method: "POST" });
              const d = await r.json().catch(() => ({}));
              setMessage(r.ok ? `${d.shared} earlier reading${d.shared === 1 ? "" : "s"} shared with your care team.` : d.error ?? "Could not share");
              await load();
            }}>Share with my care team</Button>
          </div>
        ) : null}

        {list && list.readings.length ? (
          <ul className="divide-y divide-border-subtle text-sm" aria-label="Recent readings" data-readings-list>
            {lines(list.readings).slice(0, 12).map(({ key, label, text, row }) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                <span className={row.state === "entered_in_error" ? "text-muted line-through" : undefined}>
                  {label}: <strong>{text || display(row, list.glucoseUnit)}</strong>
                  {row.flag && row.state !== "entered_in_error" ? <span className="ml-1 text-xs font-semibold text-red-700">({row.flag.replace("_", " ")})</span> : null}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {new Date(row.observedAt).toLocaleString()} · {STATE_LABEL[row.state]}
                  {row.state === "sent" || row.state === "on_device_account" ? (
                    <button type="button" className="underline" onClick={async () => {
                      await fetch(`/api/me/readings/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "entered_in_error" }) });
                      await load();
                    }}>Entered in error</button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : list ? <p className="text-sm text-muted">No readings yet.</p> : null}
        <p className="text-xs text-muted">
          {list?.linked ? "Your care team sees these readings and checks them; they do not watch them around the clock." : "Saved to your account. Link your clinic to share them with your care team."}
          {` In an emergency call ${emergency ?? "your local emergency number"}.`}
        </p>
      </CardContent>
    </Card>
  );
}
