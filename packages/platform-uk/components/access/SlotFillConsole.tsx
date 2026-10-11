"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";
import { cn } from "@/lib/utils";

type QueueRow = {
  id: string;
  state: string;
  outcome: string | null;
  appointment_type: string;
  site: string | null;
  starts_at: string;
  offer_expires_at: string;
  slot_state: string;
  eligible: number;
  deferred_until?: string | null;
};

type Handoff = { id: string; workflow_id: string | null; reason: string; context: string; priority: string; due_at: string; acknowledged_at: string | null; overdue: boolean };
type Settings = { reasonOrder: string[]; maxOffersPer30Days: number; suppressedChannels: string[] };
type Org = { id: string; name: string; isAdmin: boolean };

const REASON_LABEL: Record<string, string> = { overdue_care: "Overdue care", patient_request: "Patient asked", clinician_request: "Clinician asked" };

type Candidate = {
  id: string;
  rank: number | null;
  patient_name: string | null;
  rules_passed: string[];
  exclusion_codes: string[];
  missing_fields: string[];
  reasons: string[];
  contact_channel: string | null;
};

type Workflow = QueueRow & {
  offer_text: string | null;
  rule_version: string;
  contact_mode: string;
  candidates: Candidate[];
  actions: { action_type: string; from_state: string | null; to_state: string; result_code: string; created_at: string }[];
  handoffs: { id: string; reason: string; priority: string; due_at: string; closed_at: string | null }[];
};

type Metrics = {
  fillRatePct: number | null;
  eligible_slots: number;
  booked_verified: number;
  pending_verification: number;
  expired: number;
  failed_safe: number;
  open_workflows: number;
  handoffs: { open: number; overdue: number };
  definition: string;
  note: string;
};

const STATE_LABEL: Record<string, string> = {
  SOURCE_VALIDATED: "New slot",
  STAFF_REVIEW: "Needs review",
  OFFER_DRAFTED: "Offer drafted",
  CONTACT_APPROVED: "Awaiting reply",
  PENDING_VERIFICATION: "Check schedule",
  CLOSED: "Closed",
  HANDOFF: "Handed off",
  FAILED_SAFE: "Needs a person",
};

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const key = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function SlotFillConsole() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [wf, setWf] = useState<Workflow | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const load = useCallback(async () => {
    setRefreshCount((n) => n + 1); // figures follow every action
    const [q, m, h, o] = await Promise.all([fetch("/api/access/queue"), fetch("/api/access/metrics"), fetch("/api/access/handoffs"), fetch("/api/orgs")]);
    const qd = await q.json();
    if (!q.ok) return setError(qd.error ?? "Not available");
    setError(null);
    setQueue(qd.rows);
    if (m.ok) setMetrics(await m.json());
    if (h.ok) setHandoffs((await h.json()).rows);
    if (o.ok) {
      const rows = (await o.json()).rows as Org[];
      setOrgs(rows);
      const admin = rows.find((x) => x.isAdmin);
      if (admin) {
        const sr = await fetch(`/api/orgs/${admin.id}/access-settings`);
        if (sr.ok) setSettings(await sr.json());
      }
    }
  }, []);

  const open = useCallback(async (id: string) => {
    setSelected(id);
    const r = await fetch(`/api/access/workflows/${id}`);
    if (r.ok) setWf(await r.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    if (!wf) return;
    setBusy(true);
    setMessage(null);
    // One key per click: a double click or retry replays instead of acting twice.
    const r = await fetch(`/api/access/workflows/${wf.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey: key(), ...body }),
    });
    const data = await r.json();
    setBusy(false);
    setMessage(r.ok ? `${data.result_code.replace(/_/g, " ").toLowerCase()}` : data.error ?? "Action failed");
    await Promise.all([open(wf.id), load()]);
  }

  async function handoff(id: string, body: Record<string, unknown>) {
    setBusy(true);
    const r = await fetch(`/api/access/handoffs/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    setMessage(r.ok ? "Hand-off updated" : (await r.json()).error ?? "Could not update hand-off");
    await load();
    if (wf) await open(wf.id);
  }

  async function saveSettings(next: Settings) {
    const admin = orgs.find((x) => x.isAdmin);
    if (!admin) return;
    const r = await fetch(`/api/orgs/${admin.id}/access-settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    if (r.ok) setSettings(await r.json());
  }

  const open_ = queue.filter((q) => !["CLOSED"].includes(q.state));
  const closed = queue.filter((q) => q.state === "CLOSED");

  return (
    <div className="space-y-5 p-4 md:p-6" data-slot-fill>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Fill cancelled slots</h1>
        <p className="text-sm text-muted">
          When an appointment frees up, Aksh lists who on your waiting list fits, with the reasons, using your clinic’s rules. You decide every step.
        </p>
        <p className="mt-2 inline-flex rounded-full bg-[#8a5a00] px-3 py-1 text-xs font-semibold text-white" data-shadow-mode>
          Shadow mode — Aksh never sends messages or books appointments
        </p>
      </div>

      {error ? <p className="rounded-xl border border-border-subtle bg-card p-4 text-sm text-muted" role="status">{error}</p> : null}

      {metrics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-access-metrics>
          {[
            { k: "Fill rate (30 days)", v: metrics.fillRatePct === null ? "–" : `${metrics.fillRatePct}%` },
            { k: "Booked and verified", v: metrics.booked_verified },
            { k: "Awaiting schedule check", v: metrics.pending_verification },
            { k: "Expired unfilled", v: metrics.expired },
            { k: "Open hand-offs", v: `${metrics.handoffs.open}${metrics.handoffs.overdue ? ` (${metrics.handoffs.overdue} overdue)` : ""}` },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-border-subtle bg-card p-3">
              <p className="text-xs text-muted">{x.k}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{x.v}</p>
            </div>
          ))}
          <p className="text-xs text-muted sm:col-span-2 lg:col-span-5">{metrics.definition} {metrics.note}</p>
        </div>
      ) : null}

      {orgs.length ? <BaselinePanel orgs={orgs} refresh={refreshCount} /> : null}

      {orgs.length ? (
        <details className="rounded-xl border border-border-subtle bg-card p-4" open={queue.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Record a freed slot</summary>
          <div className="mt-3">
            <RecordSlot
              orgs={orgs}
              onRecorded={(id) => {
                setMessage("Slot recorded. Review who fits below.");
                void load().then(() => (id ? open(id) : undefined));
              }}
            />
          </div>
        </details>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Slots ({open_.length} open)</CardTitle></CardHeader>
          <CardContent>
            {queue.length === 0 ? <p className="text-sm text-muted">No freed slots yet. They appear here when your schedule reports a cancellation.</p> : null}
            <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-slot-queue>
              {[...open_, ...closed.slice(0, 10)].map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => void open(q.id)} className={cn("flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left hover:bg-surface-muted", selected === q.id && "bg-surface-muted")}>
                    <span>
                      <span className="block text-sm text-foreground">{APPOINTMENT_TYPE_LABEL[q.appointment_type] ?? q.appointment_type} · {when(q.starts_at)}</span>
                      <span className="block text-xs text-muted">{q.site ?? "Site not recorded"} · offer until {when(q.offer_expires_at)} · {q.eligible} eligible{q.deferred_until && new Date(q.deferred_until) > new Date() ? ` · deferred until ${when(q.deferred_until)}` : ""}</span>
                    </span>
                    <Badge variant={q.state === "FAILED_SAFE" || q.state === "HANDOFF" ? "danger" : q.state === "CLOSED" ? "outline" : "warning"}>
                      {q.state === "CLOSED" && q.outcome ? q.outcome.replace("_", " ") : STATE_LABEL[q.state] ?? q.state}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{wf ? `${APPOINTMENT_TYPE_LABEL[wf.appointment_type] ?? wf.appointment_type} · ${when(wf.starts_at)}` : "Select a slot"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm" data-slot-detail>
            {wf ? (
              <>
                <p className="text-xs text-muted">
                  {STATE_LABEL[wf.state] ?? wf.state} · rules {wf.rule_version} · {wf.contact_mode === "shadow" ? "shadow mode" : wf.contact_mode}
                </p>
                {message ? <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs" role="status">{message}</p> : null}

                {["SOURCE_VALIDATED", "STAFF_REVIEW"].includes(wf.state) ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "match" })}>
                    {wf.candidates.length ? "Re-check waiting list" : "Find patients for this slot"}
                  </Button>
                ) : null}

                {wf.candidates.length ? (
                  <ul className="m-0 list-none space-y-2 p-0" data-candidates>
                    {wf.candidates.map((c) => (
                      <li key={c.id} className={cn("rounded-xl border p-3", c.rank === null ? "border-border-subtle bg-surface-muted/50" : "border-secondary/30 bg-card")}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{c.rank !== null ? `#${c.rank} ` : ""}{c.patient_name ?? "Patient"}</span>
                          {c.rank !== null && wf.state === "STAFF_REVIEW" ? (
                            <span className="flex gap-1">
                              <Button size="sm" disabled={busy} onClick={() => void act({ action: "select", candidateId: c.id })}>Draft offer</Button>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "skip", candidateId: c.id, reason: "Not suitable today" })}>Skip</Button>
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted">{c.reasons.join(" · ")}</p>
                        {c.exclusion_codes.length ? <p className="mt-1 text-xs text-muted">Not eligible: {c.exclusion_codes.map((x) => x.replace(/_/g, " ").toLowerCase()).join(", ")}</p> : null}
                        {c.missing_fields.length ? <p className="mt-1 text-xs text-[#8a5a00]">Missing: {c.missing_fields.join(", ")}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {wf.offer_text ? (
                  <div className="rounded-xl border border-border-subtle bg-surface-muted/60 p-3">
                    <p className="text-xs font-medium text-foreground">Offer draft (approved template{wf.state === "OFFER_DRAFTED" ? ", you can reword it" : ""})</p>
                    {editing !== null ? (
                      <div className="mt-2 space-y-2">
                        <label className="sr-only" htmlFor="offer-edit">Offer text</label>
                        <textarea id="offer-edit" className="h-28 w-full rounded-lg border border-border-subtle p-2 text-sm" maxLength={480} value={editing} onChange={(e) => setEditing(e.target.value)} />
                        <p className="text-xs text-muted">Keep it to the appointment facts. Never include clinical details or why the person was chosen.</p>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy || editing.trim().length < 20} onClick={() => { void act({ action: "edit_offer", text: editing }); setEditing(null); }}>Save wording</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-foreground" data-offer-text>{wf.offer_text}</p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {wf.state === "OFFER_DRAFTED" ? (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => void act({ action: "approve_contact" })}>Approve — I will contact them</Button>
                      {editing === null ? <Button size="sm" variant="outline" onClick={() => setEditing(wf.offer_text ?? "")}>Edit wording</Button> : null}
                    </>
                  ) : null}
                  {["SOURCE_VALIDATED", "STAFF_REVIEW"].includes(wf.state) && new Date(wf.offer_expires_at).getTime() - Date.now() > 3 * 3_600_000 ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "defer", until: new Date(Date.now() + 2 * 3_600_000).toISOString() })}>Defer 2 hours</Button>
                  ) : null}
                  {wf.state === "CONTACT_APPROVED" ? (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => void act({ action: "record_response", response: "accepted" })}>They accepted</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "record_response", response: "declined" })}>Declined</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "record_response", response: "no_response" })}>No reply</Button>
                    </>
                  ) : null}
                  {wf.state === "PENDING_VERIFICATION" ? (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => void act({ action: "confirm_booking", confirmed: true, sourceReference: "Checked in the clinic schedule" })}>Booking shows in our schedule</Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "confirm_booking", confirmed: false, sourceReference: "Not found in the clinic schedule" })}>Not in schedule</Button>
                    </>
                  ) : null}
                  {["SOURCE_VALIDATED", "STAFF_REVIEW", "OFFER_DRAFTED", "CONTACT_APPROVED", "PENDING_VERIFICATION"].includes(wf.state) ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void act({ action: "handoff", reason: "Needs a person to decide" })}>Hand off</Button>
                  ) : null}
                </div>
                {wf.state === "PENDING_VERIFICATION" ? (
                  <p className="text-xs text-muted">Accepted is not booked. Check your schedule, then confirm. Aksh never marks a slot booked without this check.</p>
                ) : null}

                {wf.handoffs.length ? (
                  <p className="text-xs text-red-700">Hand-off: {wf.handoffs.map((h) => `${h.reason} (${h.priority}, due ${when(h.due_at)})`).join("; ")}</p>
                ) : null}

                <details className="text-xs text-muted">
                  <summary className="cursor-pointer">History ({wf.actions.length})</summary>
                  <ol className="mt-2 space-y-1 pl-4">
                    {wf.actions.map((a, i) => (
                      <li key={i}>{when(a.created_at)} · {a.action_type.replace("_", " ")} → {STATE_LABEL[a.to_state] ?? a.to_state} ({a.result_code.replace(/_/g, " ").toLowerCase()})</li>
                    ))}
                  </ol>
                </details>
              </>
            ) : (
              <p className="text-xs text-muted">Pick a freed slot to see who fits and why.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Hand-offs ({handoffs.length} open)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm" data-handoffs>
            {handoffs.length === 0 ? <p className="text-xs text-muted">Nothing waiting for a person.</p> : null}
            {handoffs.map((h) => (
              <div key={h.id} className={cn("rounded-xl border p-3", h.overdue ? "border-red-300 bg-red-50" : "border-border-subtle")}>
                <p className="font-medium text-foreground">{h.reason}</p>
                <p className="text-xs text-muted">{h.context} · {h.priority} · due {when(h.due_at)}{h.overdue ? " · overdue" : ""}{h.acknowledged_at ? " · acknowledged" : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!h.acknowledged_at ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void handoff(h.id, { action: "acknowledge" })}>I’m on it</Button> : null}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void handoff(h.id, { action: "close", outcome: "released", disposition: "Patient kept on the waiting list" })}>Close — keep on list</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void handoff(h.id, { action: "close", outcome: "booked", disposition: "Booked and checked in the schedule by staff" })}>Close — booked</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {settings ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Your clinic’s rules</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm" data-access-settings>
              <div>
                <p className="text-xs text-muted">Who is offered first (then whoever has waited longest)</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  {settings.reasonOrder.map((r, i) => (
                    <li key={r} className="flex items-center justify-between gap-2">
                      <span>{REASON_LABEL[r] ?? r}</span>
                      {i > 0 ? (
                        <Button size="sm" variant="outline" onClick={() => { const next = [...settings.reasonOrder]; [next[i - 1], next[i]] = [next[i]!, next[i - 1]!]; void saveSettings({ ...settings, reasonOrder: next }); }}>Move up</Button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Most offers per patient in 30 days</span>
                <input type="number" min={1} max={20} className="h-9 w-20 rounded-lg border border-border-subtle px-2" value={settings.maxOffersPer30Days} onChange={(e) => void saveSettings({ ...settings, maxOffersPer30Days: Number(e.target.value) || 1 })} />
              </label>
              <fieldset>
                <legend className="text-xs text-muted">Channels you do not use for offers</legend>
                <div className="mt-1 flex flex-wrap gap-3">
                  {["sms", "phone", "email", "app", "whatsapp"].map((c) => (
                    <label key={c} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={settings.suppressedChannels.includes(c)} onChange={(e) => void saveSettings({ ...settings, suppressedChannels: e.target.checked ? [...settings.suppressedChannels, c] : settings.suppressedChannels.filter((x) => x !== c) })} />
                      {c}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="text-xs text-muted">Only organisation admins can change these. Every change is audited. Ranking never uses clinical urgency.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Record a freed slot by hand, for clinics without a schedule connector. The slot enters the same validated workflow as
 * an imported one; the offer window closes before the slot starts.
 */
function RecordSlot({ orgs, onRecorded }: { orgs: Org[]; onRecorded: (workflowId: string) => void }) {
  const tomorrow = new Date(Date.now() + 24 * 3600_000);
  tomorrow.setHours(10, 0, 0, 0);
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [type, setType] = useState("diabetes_review");
  const [startsAt, setStartsAt] = useState(localInput(tomorrow));
  const [duration, setDuration] = useState(20);
  const [site, setSite] = useState("");
  const [closeHours, setCloseHours] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!orgs.length) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const start = new Date(startsAt);
    const expires = new Date(start.getTime() - closeHours * 3600_000);
    if (Number.isNaN(start.getTime()) || start <= new Date()) return setError("Pick a time in the future.");
    if (expires <= new Date()) return setError("The offer window would already be closed. Close offers fewer hours before the start.");
    setBusy(true);
    const r = await fetch(`/api/orgs/${orgId || orgs[0]!.id}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "manual",
        sourceRef: `manual-${key()}`,
        appointmentType: type,
        site: site.trim() || undefined,
        startsAt: start.toISOString(),
        durationMin: duration,
        offerExpiresAt: expires.toISOString(),
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) onRecorded(data.workflowId);
    else setError(data.error ?? "Could not record the slot");
  }

  const field = "h-9 w-full rounded-lg border border-border-subtle bg-card px-2 text-sm";
  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-6" data-record-slot>
      {orgs.length > 1 ? (
        <label className="lg:col-span-2"><span className="text-muted">Organisation</span>
          <select className={field} value={orgId} onChange={(e) => setOrgId(e.target.value)}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        </label>
      ) : null}
      <label className="lg:col-span-2"><span className="text-muted">Appointment type</span>
        <select className={field} value={type} onChange={(e) => setType(e.target.value)} aria-label="Appointment type">
          {Object.entries(APPOINTMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v[0]!.toUpperCase() + v.slice(1)}</option>)}
        </select>
      </label>
      <label className="lg:col-span-2"><span className="text-muted">Starts</span>
        <input type="datetime-local" className={field} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} aria-label="Starts" required />
      </label>
      <label><span className="text-muted">Minutes</span>
        <input type="number" min={5} max={240} className={field} value={duration} onChange={(e) => setDuration(Number(e.target.value))} aria-label="Minutes" />
      </label>
      <label><span className="text-muted">Close offers (hours before)</span>
        <input type="number" min={0} max={72} className={field} value={closeHours} onChange={(e) => setCloseHours(Number(e.target.value))} aria-label="Close offers hours before" />
      </label>
      <label className="lg:col-span-3"><span className="text-muted">Site (optional)</span>
        <input className={field} value={site} onChange={(e) => setSite(e.target.value)} maxLength={80} aria-label="Site" />
      </label>
      <div className="flex items-end lg:col-span-3"><Button type="submit" disabled={busy}>{busy ? "Recording…" : "Record freed slot"}</Button></div>
      {error ? <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-6" role="alert">{error}</p> : null}
    </form>
  );
}

type Measurement = {
  mode: "live_shadow" | "rehearsal";
  period: { since: string; label: string };
  baseline: { periodStart: string; periodEnd: string; freed: number; filled: number; ratePct: number | null; method: string } | null;
  current: { eligible: number; booked: number; ratePct: number | null };
  comparison: { verdict: "too_early" | "above" | "similar" | "below"; differencePts: number | null; ci95: [number, number] | null } | null;
  weekly: { week: string; eligible: number; booked: number }[];
  notes: string[];
};

const VERDICT: Record<string, string> = {
  too_early: "Too few slots to compare yet",
  above: "Higher than your baseline",
  similar: "No clear difference from your baseline yet",
  below: "Lower than your baseline",
};

/** Fill rate against the baseline the organisation locked at go-live. Counts are always shown next to rates. */
function BaselinePanel({ orgs, refresh }: { orgs: Org[]; refresh: number }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [m, setM] = useState<Measurement | null>(null);
  useEffect(() => setM(null), [orgId]); // never show one organisation's figures under another
  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    void fetch(`/api/orgs/${orgId}/measurement`)
      .then(async (r) => {
        if (!r.ok) return;
        const data = (await r.json()) as Measurement;
        if (!cancelled) setM(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [orgId, refresh]);
  if (!m) return null;
  const max = Math.max(1, ...m.weekly.map((w) => w.eligible));
  return (
    <Card data-baseline>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Against your baseline</CardTitle>
        {orgs.length > 1 ? (
          <select aria-label="Organisation for measurement" className="h-9 rounded-full border border-border-subtle bg-card px-3 text-sm" value={orgId} onChange={(e) => { setM(null); setOrgId(e.target.value); }}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs text-muted">Baseline (before Aksh)</p>
            {m.baseline ? (
              <>
                <p className="mt-1 text-2xl font-semibold text-foreground">{m.baseline.ratePct ?? "–"}%</p>
                <p className="text-xs text-muted">{m.baseline.filled} of {m.baseline.freed} freed slots · {m.baseline.periodStart} to {m.baseline.periodEnd}</p>
              </>
            ) : <p className="mt-1 text-sm text-muted">Not locked yet. It is part of the go-live checklist.</p>}
          </div>
          <div className="rounded-xl border border-border-subtle p-3">
            <p className="text-xs text-muted">{m.period.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{m.current.ratePct ?? "–"}%</p>
            <p className="text-xs text-muted">{m.current.booked} of {m.current.eligible} slots booked and verified</p>
          </div>
          <div className="rounded-xl border border-border-subtle p-3" data-baseline-verdict>
            <p className="text-xs text-muted">Difference</p>
            {m.comparison ? (
              <>
                <p className="mt-1 text-base font-semibold text-foreground">{VERDICT[m.comparison.verdict]}</p>
                {m.comparison.differencePts !== null ? (
                  <p className="text-xs text-muted">{m.comparison.differencePts > 0 ? "+" : ""}{m.comparison.differencePts} points (95% range {m.comparison.ci95![0]} to {m.comparison.ci95![1]})</p>
                ) : null}
              </>
            ) : <p className="mt-1 text-sm text-muted">Needs a locked baseline.</p>}
          </div>
        </div>
        {m.weekly.length ? (
          <div aria-label="Weekly slots received and filled" role="img" className="flex h-24 items-end gap-1">
            {m.weekly.map((w) => (
              <div key={w.week} className="flex flex-1 flex-col items-center gap-0.5" title={`Week of ${w.week}: ${w.booked} of ${w.eligible} filled`}>
                <div className="relative w-full rounded-t bg-surface-muted" style={{ height: `${(w.eligible / max) * 80}px` }}>
                  <div className="absolute bottom-0 w-full rounded-t bg-secondary" style={{ height: `${w.eligible ? (w.booked / w.eligible) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] text-muted">{w.week.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : null}
        <ul className="m-0 list-disc space-y-0.5 pl-5 text-xs text-muted">{m.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </CardContent>
    </Card>
  );
}
