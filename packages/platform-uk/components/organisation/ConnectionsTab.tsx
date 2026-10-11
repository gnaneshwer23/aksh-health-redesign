"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";

type Org = { id: string; isAdmin: boolean };
type Config = { typeMap?: Record<string, string>; offerCloseHours?: number; site?: string };
type Key = { id: string; name: string; keyPrefix: string; config: Config; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };
type Event = { id: number; kind: string; format: string; externalRef: string | null; resultCode: string; detail: { message?: string }; receivedAt: string; keyName: string };

const GOOD = new Set(["ACCEPTED", "UPDATED", "REPLAY", "WITHDRAWN", "BOOKED_VERIFIED", "ALREADY_CLOSED", "IGNORED_STATUS", "NO_ACTION", "AWAITING_BOOKING_READ_BACK"]);
const label = (t: string) => APPOINTMENT_TYPE_LABEL[t]![0]!.toUpperCase() + APPOINTMENT_TYPE_LABEL[t]!.slice(1);
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "never");

function MappingEditor({ org, k, onSaved }: { org: Org; k: Key; onSaved: (m: string) => void }) {
  const [rows, setRows] = useState<[string, string][]>(() => Object.entries(k.config.typeMap ?? {}));
  const [closeHours, setCloseHours] = useState(k.config.offerCloseHours ?? 2);
  const [site, setSite] = useState(k.config.site ?? "");
  const field = "h-10 rounded-xl border border-border bg-card px-2 text-sm";
  return (
    <form
      className="mt-3 space-y-2 text-sm"
      data-connection-config
      onSubmit={async (e) => {
        e.preventDefault();
        const typeMap = Object.fromEntries(rows.filter(([c]) => c.trim()).map(([c, t]) => [c.trim(), t]));
        const r = await fetch(`/api/orgs/${org.id}/connections/${k.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ typeMap, offerCloseHours: closeHours, site: site.trim() || undefined }) });
        onSaved(r.ok ? "Connection settings saved" : (await r.json().catch(() => ({}))).error ?? "Could not save");
      }}
    >
      <p className="text-muted">Their appointment codes → Aksh appointment types. Codes that already match an Aksh type need no mapping.</p>
      {rows.map(([code, type], i) => (
        <div key={i} className="flex flex-wrap gap-2">
          <Input className="max-w-[12rem]" aria-label={`Their code ${i + 1}`} value={code} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} />
          <select className={field} aria-label={`Aksh type ${i + 1}`} value={type} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? [x[0], e.target.value] : x)))}>
            {Object.keys(APPOINTMENT_TYPE_LABEL).map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => setRows((r) => [...r, ["", "diabetes_review"]])}>Add mapping</Button>
      <div className="grid gap-2 sm:grid-cols-2">
        <label><span className="text-muted">Close offers (hours before the slot)</span><Input type="number" min={0} max={72} value={closeHours} onChange={(e) => setCloseHours(Number(e.target.value))} aria-label="Close offers hours" /></label>
        <label><span className="text-muted">Site name (optional)</span><Input value={site} onChange={(e) => setSite(e.target.value)} aria-label="Connection site" /></label>
      </div>
      <Button type="submit" size="sm">Save settings</Button>
    </form>
  );
}

/** Organisation → Connections: API keys for the scheduling system, type mapping, and every message received. */
export function ConnectionsTab({ org, onMessage }: { org: Org; onMessage: (m: string | null) => void }) {
  const [keys, setKeys] = useState<Key[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState("Clinic schedule");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://www.akshhealth.com");

  const current = useRef(org.id);
  const load = useCallback(async () => {
    const id = org.id;
    const [k, e] = await Promise.all([fetch(`/api/orgs/${id}/connections`), fetch(`/api/orgs/${id}/connections/events`)]);
    const [kd, ed] = await Promise.all([k.ok ? k.json() : null, e.ok ? e.json() : null]);
    if (current.current !== id) return; // the user switched organisation meanwhile
    if (kd) setKeys(kd.rows);
    if (ed) setEvents(ed.rows);
  }, [org.id]);
  useEffect(() => {
    current.current = org.id;
    // A key shown once for one organisation must never appear under another.
    setNewKey(null);
    setEditing(null);
    setKeys([]);
    setEvents([]);
    setOrigin(window.location.origin);
    void load();
  }, [org.id, load]);

  return (
    <div className="space-y-5" data-connections>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Schedule connections</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted">Your scheduling system tells Aksh when a slot frees up and when it is booked. Bookings it reports for the patient your staff chose are confirmed automatically; anything else goes to a person.</p>
            {newKey ? (
              <div className="rounded-xl border-2 border-secondary bg-secondary/5 p-4" role="status" data-connection-key>
                <p className="text-xs font-medium text-foreground">Give this key to whoever configures your scheduling system. Shown only now.</p>
                <p className="mt-1 break-all font-mono text-sm text-foreground">{newKey}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(newKey)}>Copy key</Button>
                  <Button size="sm" variant="outline" onClick={() => setNewKey(null)}>Done</Button>
                </div>
              </div>
            ) : null}
            {org.isAdmin ? (
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await fetch(`/api/orgs/${org.id}/connections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                  const data = await r.json().catch(() => ({}));
                  if (r.ok) { setNewKey(data.key); onMessage("Connection created"); await load(); }
                  else onMessage(data.error ?? "Could not create the connection");
                }}
              >
                <label className="flex-1"><span className="text-muted">Name</span><Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Connection name" /></label>
                <Button type="submit">Create connection</Button>
              </form>
            ) : <p className="text-muted">Only admins can create connections.</p>}
            <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-connection-keys>
              {keys.map((k) => (
                <li key={k.id} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="block text-foreground">{k.name} <span className="font-mono text-xs text-muted">{k.keyPrefix}…</span></span>
                      <span className="block text-xs text-muted">Created {when(k.createdAt)} · last used {when(k.lastUsedAt)}{k.revokedAt ? ` · revoked ${when(k.revokedAt)}` : ""}</span>
                    </span>
                    <span className="flex gap-1">
                      {k.revokedAt ? <Badge variant="outline">Revoked</Badge> : org.isAdmin ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(editing === k.id ? null : k.id)}>Settings</Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            const r = await fetch(`/api/orgs/${org.id}/connections/${k.id}`, { method: "DELETE" });
                            onMessage(r.ok ? "Connection revoked; the key no longer works" : "Could not revoke");
                            await load();
                          }}>Revoke</Button>
                        </>
                      ) : null}
                    </span>
                  </div>
                  {editing === k.id && !k.revokedAt ? <MappingEditor org={org} k={k} onSaved={(m) => { onMessage(m); void load(); }} /> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">For your integrator</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-muted">
            <p>Send FHIR R4 resources (single or in a Bundle) or plain JSON, with <code>Authorization: Bearer &lt;key&gt;</code>.</p>
            <p><code className="text-foreground">POST {origin}/api/connect/v1/slots</code> — <code>Slot</code> with <code>status</code> free (offerable) or busy (taken). <code>id</code> and <code>meta.versionId</code> make retries safe.</p>
            <p><code className="text-foreground">POST {origin}/api/connect/v1/observations</code> — CGM or meter glucose as FHIR <code>Observation</code> (final; glucose code; <code>valueQuantity</code> in mmol/L or mg/dL; <code>effectiveDateTime</code> with an offset; the patient&apos;s record number as <code>subject.identifier.value</code>). Up to 5000 per Bundle; repeats are skipped.</p>
            <p><code className="text-foreground">POST {origin}/api/connect/v1/appointments</code> — <code>Appointment</code> (booked, arrived, fulfilled) referencing the <code>Slot</code>, with the patient&apos;s record number as <code>participant.actor.identifier.value</code>.</p>
            <pre className="overflow-x-auto rounded-lg bg-surface-muted p-2 text-[11px] text-foreground">{`curl -X POST ${origin}/api/connect/v1/slots \\
  -H "Authorization: Bearer $AKSH_KEY" -H "Content-Type: application/json" \\
  -d '{"resourceType":"Slot","id":"slot-123","status":"free",
       "start":"2026-11-02T09:00:00Z","end":"2026-11-02T09:20:00Z",
       "serviceType":[{"text":"Foot check"}]}'`}</pre>
            <p>Each item gets a result code (for example ACCEPTED, REPLAY, UNKNOWN_APPOINTMENT_TYPE, BOOKED_VERIFIED, BOOKED_FOR_ANOTHER_PATIENT).</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent messages ({events.length})</CardTitle></CardHeader>
        <CardContent>
          {events.length === 0 ? <p className="text-sm text-muted">Nothing received yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" data-connection-events>
                <thead className="text-muted"><tr><th className="py-1 pr-3">Received</th><th className="pr-3">Kind</th><th className="pr-3">Their ID</th><th className="pr-3">Result</th><th>Detail</th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-t border-border-subtle">
                      <td className="py-1 pr-3">{new Date(e.receivedAt).toLocaleString()}</td>
                      <td className="pr-3">{e.kind} · {e.format}</td>
                      <td className="pr-3 font-mono">{e.externalRef ?? "–"}</td>
                      <td className="pr-3"><span className={GOOD.has(e.resultCode) ? "text-foreground" : "font-semibold text-red-700"}>{e.resultCode}</span></td>
                      <td>{e.detail?.message ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
