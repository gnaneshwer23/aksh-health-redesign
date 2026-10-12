"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AshaConversation } from "@/components/front-desk/AshaConversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { buildFrontDeskView } from "@/lib/front-desk/view";
import type { CampaignKind, WorkItem } from "@/lib/front-desk/types";
import { cn } from "@/lib/utils";

type View = ReturnType<typeof buildFrontDeskView>;
type QueueFilter = "needs_staff" | "awaiting_clinician" | "resolved" | "all";

const CAMPAIGN_KINDS: { kind: CampaignKind; label: string; detail: string }[] = [
  { kind: "missed_appointment", label: "Missed appointments", detail: "Rebook diabetes reviews that were missed" },
  { kind: "lapsed_review", label: "Lapsed reviews", detail: "Not seen for over 6 months" },
  { kind: "recall", label: "Annual recall", detail: "Book the blood test that starts the review" },
  { kind: "health_check_in", label: "Health check-ins", detail: "Asha calls high-risk patients; a GP approves" },
];

const SAMPLE_REFERRAL = `From: Dr Ahmed, Community Diabetes Service
Re: James Patel, DOB 22/11/1971
Reason: diabetes review after starting a new medicine; please book with the diabetes nurse.`;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

function priorityBadge(p: WorkItem["priority"]) {
  if (p === "emergency") return <Badge variant="danger" className="text-red-700">emergency</Badge>;
  if (p === "urgent") return <Badge variant="warning">urgent</Badge>;
  return <Badge variant="outline">routine</Badge>;
}

function statusLabel(s: WorkItem["status"]) {
  return s === "handed_off" ? "Needs staff" : s === "awaiting_clinician" ? "Awaiting clinician" : s === "resolved" ? "Resolved by Asha" : "Open";
}

async function post(url: string, body: object) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export function FrontDeskConsole() {
  const [view, setView] = useState<View | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("needs_staff");
  const [busy, setBusy] = useState<string | null>(null);
  const [referralText, setReferralText] = useState("");
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const [callTarget, setCallTarget] = useState<{ patientId: string; kind: CampaignKind; campaignId: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/front-desk/state", { cache: "no-store" });
    if (res.ok) setView((await res.json()) as View);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function act(key: string, fn: () => Promise<unknown>, success?: string) {
    setBusy(key);
    try {
      await fn();
      if (success) toast({ title: success });
      await load();
    } catch (e) {
      toast({ title: "Not done", description: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setBusy(null);
    }
  }

  if (!view) return <p className="p-6 text-sm text-muted">Loading Front Desk…</p>;

  const items = view.workItems.filter((w) =>
    filter === "all" ? true : filter === "needs_staff" ? w.status === "handed_off" || w.status === "open" : w.status === filter
  );
  const pendingDrafts = view.drafts.filter((d) => d.status === "pending");
  const m = view.metrics;
  const metricRows: { label: string; key: keyof typeof m.current; unit: string; better: "up" | "down" }[] = [
    { label: "Calls answered", key: "callsAnsweredPct", unit: "%", better: "up" },
    { label: "Average wait", key: "avgWaitSeconds", unit: "s", better: "down" },
    { label: "Calendar booked (14 days)", key: "slotsFilledPct", unit: "%", better: "up" },
    { label: "Missed appointments rebooked", key: "missedRebookedPct", unit: "%", better: "up" },
    { label: "Handed to staff", key: "handOffPct", unit: "%", better: "down" },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6" data-front-desk>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Front Desk</h1>
          <p className="text-sm text-muted">
            {view.practiceName} · inbound calls, recall campaigns, open slots, referrals and hand-offs, handled by Asha with staff and clinicians in the loop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={view.storage === "postgres" ? "success" : "warning"}>{view.storage === "postgres" ? "Shared state (Postgres)" : "Demo memory (not durable)"}</Badge>
          <Button variant="outline" size="sm" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="rounded-xl border border-border-subtle bg-card px-4 py-2.5 text-xs text-muted">
        Synthetic patients · simulated telephony · no EHR write · Asha gives no medical advice · safety thresholds await clinical safety sign-off
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lift against the baseline</CardTitle>
          <p className="text-xs text-muted">
            Baseline locked {fmt(m.baseline.lockedAt)} · {m.baseline.label}. {m.note}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metricRows.map((r) => {
            const lift = m.lift[r.key];
            const good = r.better === "up" ? lift > 0 : lift < 0;
            return (
              <div key={r.key} className="rounded-xl border border-border-subtle p-3">
                <p className="text-xs text-muted">{r.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {m.current[r.key]}
                  <span className="text-sm font-normal text-muted">{r.unit}</span>
                </p>
                <p className={cn("text-xs", lift === 0 ? "text-muted" : good ? "text-secondary" : "text-red-700")}>
                  {lift > 0 ? "+" : ""}
                  {lift}
                  {r.unit} vs {m.baseline[r.key]}
                  {r.unit} baseline
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Live queue</CardTitle>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Queue filter">
              {(
                [
                  ["needs_staff", "Needs staff"],
                  ["awaiting_clinician", "Awaiting clinician"],
                  ["resolved", "Resolved by Asha"],
                  ["all", "All"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={filter === k}
                  onClick={() => setFilter(k)}
                  className={cn("rounded-full px-3 py-1 text-xs", filter === k ? "bg-foreground text-background" : "bg-surface-muted text-foreground")}
                >
                  {label} ({view.workItems.filter((w) => (k === "all" ? true : k === "needs_staff" ? w.status === "handed_off" || w.status === "open" : w.status === k)).length})
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {items.length ? (
              <ul className="m-0 list-none p-0 divide-y divide-border-subtle" data-queue>
                {items.slice(0, 25).map((w) => (
                  <li key={w.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{w.summary}</p>
                      <p className="text-xs text-muted">
                        {fmt(w.at)} · {w.direction} {w.channel.replace("_", " ")} · {statusLabel(w.status)}
                        {w.handOffReason ? ` · ${w.handOffReason}` : ""}
                      </p>
                    </div>
                    {priorityBadge(w.priority)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted">Nothing here. Make a call with Asha below to see items arrive.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient-reported data for GP review ({pendingDrafts.length})</CardTitle>
            <p className="text-xs text-muted">Unverified until a GP accepts. Accept stages FHIR for the record (rehearsal, no live write).</p>
          </CardHeader>
          <CardContent className="space-y-3" data-drafts>
            {view.drafts.slice(0, 8).map((d) => (
              <div key={d.id} className="rounded-xl border border-border-subtle p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{d.patientName}</p>
                  <div className="flex gap-1">
                    {d.safety !== "none" ? <Badge variant="warning">{d.safety.replace(/_/g, " ")}</Badge> : null}
                    <Badge variant={d.status === "accepted" ? "success" : d.status === "rejected" ? "danger" : "outline"}>{d.status}</Badge>
                  </div>
                </div>
                <ul className="m-0 list-none p-0 mt-2 space-y-0.5 text-xs text-muted">
                  {d.observations.map((o, i) => (
                    <li key={i}>
                      {o.display.replace(" (patient-reported)", "")}: <span className="text-foreground">{o.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-muted">
                  {fmt(d.createdAt)} · via {d.direction} {d.channel.replace("_", " ")}
                  {d.decidedBy ? ` · ${d.status} by ${d.decidedBy}` : ""}
                  {d.reason ? ` · “${d.reason}”` : ""}
                </p>
                {d.status === "pending" ? (
                  rejecting?.id === d.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        className="h-9 flex-1 rounded-full border border-border-subtle px-3 text-sm"
                        placeholder="Reason for rejecting"
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ id: d.id, reason: e.target.value })}
                        aria-label="Reason for rejecting"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!rejecting.reason.trim() || busy === d.id}
                        onClick={() =>
                          act(d.id, () => post(`/api/front-desk/drafts/${d.id}`, { decision: "reject", reason: rejecting.reason }), "Rejected").then(() => setRejecting(null))
                        }
                      >
                        Confirm
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" disabled={busy === d.id} onClick={() => act(d.id, () => post(`/api/front-desk/drafts/${d.id}`, { decision: "accept" }), "Accepted and staged")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejecting({ id: d.id, reason: "" })}>
                        Reject
                      </Button>
                    </div>
                  )
                ) : null}
              </div>
            ))}
            {!view.drafts.length ? <p className="py-4 text-center text-sm text-muted">No patient updates yet.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recall campaigns</CardTitle>
          <p className="text-xs text-muted">Drafted by anyone; approved by a GP (check-ins) or GP / practice manager (rebooking). No call before approval; patients who opted out of phone contact are skipped.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CAMPAIGN_KINDS.map((c) => (
              <button
                key={c.kind}
                type="button"
                disabled={busy === c.kind}
                onClick={() => act(c.kind, () => post("/api/front-desk/campaigns", { action: "create", kind: c.kind }), "Campaign drafted")}
                className="rounded-xl border border-border-subtle p-3 text-left hover:border-accent/40"
              >
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted">{c.detail}</p>
                <p className="mt-1 text-xs text-foreground">{view.campaignPreview[c.kind]} patients · Draft campaign</p>
              </button>
            ))}
          </div>
          {view.campaigns.slice(0, 4).map((c) => (
            <div key={c.id} className="rounded-xl border border-border-subtle p-3" data-campaign={c.kind}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {c.name} <span className="text-xs font-normal text-muted">· {c.targets.length} patients</span>
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "complete" ? "success" : c.status === "approved" ? "clinical" : "outline"}>{c.status}</Badge>
                  {c.status === "draft" ? (
                    <Button size="sm" disabled={busy === c.id} onClick={() => act(c.id, () => post("/api/front-desk/campaigns", { action: "approve", id: c.id }), "Approved")}>
                      Approve
                    </Button>
                  ) : null}
                  {c.status === "approved" ? (
                    <Button size="sm" disabled={busy === c.id} onClick={() => act(c.id, () => post("/api/front-desk/campaigns", { action: "run", id: c.id }), "Calls simulated")}>
                      Run calls
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs text-muted">Script: “{c.script}”</p>
              {c.approvedBy ? <p className="mt-1 text-[11px] text-muted">Approved by {c.approvedBy}</p> : null}
              <ul className="m-0 list-none p-0 mt-2 grid gap-1 text-xs sm:grid-cols-2">
                {c.targets.slice(0, 10).map((t) => (
                  <li key={t.patientId} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-surface-muted">
                    <span className="truncate">
                      <span className="text-foreground">{t.patientName}</span> · {t.outcome ? t.outcome.replace(/_/g, " ") : t.reason}
                      {t.detail ? ` · ${t.detail}` : ""}
                    </span>
                    {c.status === "approved" ? (
                      <button
                        type="button"
                        className="shrink-0 text-[11px] font-medium text-accent underline-offset-2 hover:underline"
                        onClick={() => setCallTarget({ patientId: t.patientId, kind: c.kind, campaignId: c.id, name: t.patientName ?? t.patientId })}
                      >
                        Call with Asha
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {callTarget ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Asha calling {callTarget.name} (simulated)</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setCallTarget(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted">You play the patient. Answer with their name and date of birth from the synthetic record.</p>
            <AshaConversation
              key={`${callTarget.campaignId}-${callTarget.patientId}`}
              compact
              defaultStart={{ direction: "outbound", expectedPatientId: callTarget.patientId, campaignKind: callTarget.kind, campaignId: callTarget.campaignId }}
              onActivity={() => void load()}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Referral Desk</CardTitle>
            <p className="text-xs text-muted">Paste a referral letter. Routine referrals get a proposed slot to confirm; urgent ones go to a clinician first.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="h-28 w-full rounded-xl border border-border-subtle p-3 text-sm"
              value={referralText}
              onChange={(e) => setReferralText(e.target.value)}
              placeholder="Paste referral text"
              aria-label="Referral letter"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setReferralText(SAMPLE_REFERRAL)}>
                Use sample letter
              </Button>
              <Button
                size="sm"
                disabled={referralText.trim().length < 10 || busy === "referral"}
                onClick={() => act("referral", () => post("/api/front-desk/referrals", { action: "intake", text: referralText }), "Referral processed").then(() => setReferralText(""))}
              >
                Process referral
              </Button>
            </div>
            {view.referrals.slice(0, 4).map((r) => (
              <div key={r.id} className="rounded-xl border border-border-subtle p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{r.patientName ?? "Patient not matched"}</p>
                  <div className="flex gap-1">
                    {r.urgency === "urgent" ? <Badge variant="warning">urgent</Badge> : null}
                    <Badge variant={r.status === "booked" ? "success" : r.status === "handed_off" ? "warning" : "outline"}>{r.status.replace("_", " ")}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {r.reason}
                  {r.referrer ? ` · from ${r.referrer}` : ""}
                </p>
                {r.status === "proposed" && r.proposedSlot ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-foreground">
                      Proposed: {fmt(r.proposedSlot.start)} with {r.proposedSlot.clinicianName}
                    </p>
                    <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, () => post("/api/front-desk/referrals", { action: "confirm", id: r.id }), "Booked")}>
                      Confirm booking
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Calendar and waiting list</CardTitle>
            <p className="text-xs text-muted">Cancellations are offered to the longest-waiting matching patient (Slot Fill).</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="m-0 list-none p-0 space-y-1.5">
              {view.calendar.map((d) => (
                <li key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-24 text-muted">{new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((d.booked / d.total) * 100)}%` }} />
                  </span>
                  <span className="w-14 text-right text-foreground">
                    {d.booked}/{d.total}
                  </span>
                </li>
              ))}
            </ul>
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Waiting list ({view.waitlist.filter((w) => w.status === "waiting" || w.status === "offered").length})</p>
              <ul className="m-0 list-none p-0 space-y-1 text-xs text-muted">
                {view.waitlist.slice(0, 8).map((w) => (
                  <li key={w.id}>
                    {w.patientName} · {w.type.replace(/_/g, " ")} · {w.status}
                    {w.priority === "soon" ? " · soon" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Try an inbound call</CardTitle>
          <p className="text-xs text-muted">Book, move or cancel, give a health update, or ask a practice question. Watch the queue and drafts update.</p>
        </CardHeader>
        <CardContent>
          <AshaConversation onActivity={() => void load()} />
        </CardContent>
      </Card>
    </div>
  );
}
