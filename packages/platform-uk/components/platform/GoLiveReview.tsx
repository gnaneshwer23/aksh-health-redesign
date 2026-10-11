"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ACTION_LABEL, STATE_BADGE, evidenceSummary, type GoLiveSnapshot } from "@/components/organisation/GoLiveTab";
import { RegistrationCheckForm } from "@/components/organisation/RegistrationCheckForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type QueueRow = { id: string; name: string; status: string; awaiting: number; accepted: number; last_activity: string | null; is_member: boolean };
type ReviewMember = { id: string; display_name: string; role: string; is_admin: boolean; registration_status: string; registration_number: string | null; registration_body: string | null; last_check: { outcome: string; registry: string | null; registration_number: string | null; checked_on: string; evidence_ref: string | null; checked_by_kind: string } | null };
type Review = GoLiveSnapshot & { members: ReviewMember[] };

const LICENSED = new Set(["gp", "nurse", "clinical-pharmacist"]);

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

/** Aksh platform admins: review go-live evidence, check registrations, approve or return. */
export function GoLiveReview() {
  const [queue, setQueue] = useState<QueueRow[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [decisionNote, setDecisionNote] = useState("");
  const [checking, setChecking] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    const r = await fetch("/api/platform/go-live");
    if (!r.ok) return setDenied(true);
    setQueue((await r.json()).rows);
  }, []);
  const latest = useRef<string | null>(null);
  const open = useCallback(async (id: string, keepMessage = false) => {
    const switching = latest.current !== id;
    latest.current = id;
    setSelected(id);
    if (switching) {
      // Never show one organisation's controls, or carry its notes, while another is selected.
      setReview(null);
      setNotes({});
      setDecisionNote("");
      setChecking(null);
    }
    if (!keepMessage) setMessage(null);
    const r = await fetch(`/api/platform/go-live/${id}`);
    const data = await r.json().catch(() => ({}));
    if (latest.current !== id) return; // a newer selection won
    if (r.ok) setReview(data);
    else {
      setReview(null);
      setMessage(data.error ?? "Could not open");
    }
  }, []);
  useEffect(() => void loadQueue(), [loadQueue]);

  async function act(orgId: string, url: string, body: unknown, ok: string) {
    const r = await post(url, body);
    await loadQueue();
    if (latest.current !== orgId) return; // the reviewer moved on; don't steal the selection back
    setMessage(r.ok ? ok : r.data.error ?? "Action failed");
    await open(orgId, true);
  }

  if (denied) return <p className="p-6 text-sm text-muted" data-platform-denied>This page is for Aksh go-live reviewers.</p>;

  return (
    <div className="space-y-5 p-4 md:p-6" data-platform-review>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Go-live reviews</h1>
        <p className="text-sm text-muted">Accept evidence item by item, check clinicians’ registrations where needed, then approve into live (shadow mode) or return with a reason. Every decision is recorded.</p>
      </div>
      {message ? <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm" role="status">{message}</p> : null}
      <div className="grid gap-5 xl:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Queue ({queue?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {queue && queue.length === 0 ? <p className="text-sm text-muted">Nothing waiting.</p> : null}
            <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-review-queue>
              {(queue ?? []).map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => void open(q.id)} className={cn("flex w-full flex-wrap items-center justify-between gap-2 py-2.5 text-left hover:bg-surface-muted", selected === q.id && "bg-surface-muted")}>
                    <span>
                      <span className="block text-sm text-foreground">{q.name}</span>
                      <span className="block text-xs text-muted">{q.awaiting} awaiting · {q.accepted} accepted{q.is_member ? " · you are a member (another reviewer must decide)" : ""}</span>
                    </span>
                    <Badge variant={q.status === "onboarding" ? "warning" : "outline"}>{q.status === "onboarding" ? "Review requested" : "Evidence in progress"}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {review ? (
          <div className="space-y-5" data-review-detail>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{review.org.name}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="m-0 list-none space-y-1 p-0">
                  {review.autos.map((a) => <li key={a.key}><span aria-hidden className={a.ok ? "text-secondary" : "text-red-700"}>{a.ok ? "✓ " : "✗ "}</span>{a.title}<span className="sr-only">{a.ok ? " (done)" : " (not done)"}</span> <span className="text-xs text-muted">· {a.detail}</span></li>)}
                </ul>
                <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-review-items>
                  {review.items.map((i) => (
                    <li key={i.key} className="py-3" data-review-item={i.key}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{i.title}</span>
                        <Badge variant={STATE_BADGE[i.state].variant}>{STATE_BADGE[i.state].label}</Badge>
                      </div>
                      {i.evidence ? <p className="mt-1 text-xs text-foreground">{evidenceSummary(i.key, i.evidence)}</p> : null}
                      {i.state === "submitted" ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Button size="sm" onClick={() => void act(review.org.id, `/api/platform/go-live/${review.org.id}/items/${i.key}`, { decision: "accepted" }, `${i.title}: accepted`)}>Accept</Button>
                          <Input className="max-w-xs" aria-label={`What needs to change: ${i.title}`} placeholder="What needs to change" value={notes[i.key] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [i.key]: e.target.value }))} />
                          <Button size="sm" variant="outline" disabled={!notes[i.key]?.trim()} onClick={() => void act(review.org.id, `/api/platform/go-live/${review.org.id}/items/${i.key}`, { decision: "rejected", note: notes[i.key] }, `${i.title}: changes requested`)}>Request changes</Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Clinicians and registration</CardTitle></CardHeader>
              <CardContent>
                <ul className="m-0 list-none divide-y divide-border-subtle p-0 text-sm" data-review-members>
                  {review.members.map((m) => (
                    <li key={m.id} className="py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <span className="block text-foreground">{m.display_name}{m.is_admin ? " (admin)" : ""}</span>
                          <span className="block text-xs text-muted">
                            {m.role} · {m.registration_status.replace("_", " ")}
                            {m.last_check ? ` · ${m.last_check.registry ?? ""} ${m.last_check.registration_number ?? ""} checked ${m.last_check.checked_on.slice(0, 10)} by ${m.last_check.checked_by_kind === "platform_admin" ? "Aksh" : "the organisation"}${m.last_check.evidence_ref ? ` (${m.last_check.evidence_ref})` : ""}` : ""}
                          </span>
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setChecking(checking === m.id ? null : m.id)}>Check registration</Button>
                      </div>
                      {checking === m.id ? (
                        <RegistrationCheckForm
                          endpoint={`/api/platform/go-live/${review.org.id}/members/${m.id}/registration`}
                          licensed={LICENSED.has(m.role)}
                          defaults={{ registry: m.registration_body, registrationNumber: m.registration_number }}
                          onDone={(msg) => { if (latest.current !== review.org.id) return; setMessage(msg); setChecking(null); void open(review.org.id, true); }}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {review.org.status === "onboarding" ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Decision</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {!review.canApprove ? <p className="text-muted">Approval opens when every automatic check passes and every item is accepted.</p> : null}
                  <Input aria-label="Decision note" placeholder="Note (required to return)" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={!review.canApprove} onClick={() => void act(review.org.id, `/api/platform/go-live/${review.org.id}/approve`, { note: decisionNote || undefined }, "Approved: live in shadow mode")}>Approve go-live</Button>
                    <Button variant="outline" disabled={!decisionNote.trim()} onClick={() => void act(review.org.id, `/api/platform/go-live/${review.org.id}/return`, { note: decisionNote }, "Returned to the organisation")}>Return</Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
              <CardContent>
                <ol className="m-0 list-none space-y-1 p-0 text-xs text-muted">
                  {[...review.events].reverse().map((e) => (
                    <li key={e.id}><span className="text-foreground">{ACTION_LABEL[e.action] ?? e.action}</span>{e.item_key ? ` · ${e.item_key}` : ""}{e.note ? ` · “${e.note}”` : ""} · {new Date(e.created_at).toLocaleString()}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card><CardContent className="p-5 text-sm text-muted">Choose an organisation to review.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
