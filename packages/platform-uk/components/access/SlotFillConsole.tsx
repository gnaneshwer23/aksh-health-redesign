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

  const load = useCallback(async () => {
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
