"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Org = { id: string; name: string; status: string; isAdmin: boolean };
type Item = { key: string; title: string; help: string; state: "missing" | "submitted" | "accepted" | "rejected"; evidence: Record<string, unknown> | null; note: string | null; at: string | null; locked: boolean };
type Auto = { key: string; title: string; ok: boolean; detail: string };
type Event = { id: number; item_key: string | null; action: string; note: string | null; actor_kind: string; created_at: string };
export type GoLiveSnapshot = { org: { id: string; name: string; status: string; verifiedAt: string | null; pilotStage?: string }; items: Item[]; autos: Auto[]; events: Event[]; canRequest: boolean; canApprove: boolean; blockers: string[] };
type Member = { id: string; display_name: string; role: string; status: string; registration_status: string };

type Field = { name: string; label: string; type?: "date" | "number" | "select" | "member"; options?: [string, string][]; optional?: boolean };

const FIELDS: Record<string, Field[]> = {
  dpa: [
    { name: "signedOn", label: "Signed on", type: "date" },
    { name: "signatoryName", label: "Signed by (name)" },
    { name: "signatoryRole", label: "Their role" },
    { name: "documentRef", label: "Document reference or version" },
  ],
  dpia: [
    { name: "completedOn", label: "Completed on", type: "date" },
    { name: "reference", label: "Assessment reference" },
    { name: "residualRisk", label: "Residual risk", type: "select", options: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] },
    { name: "summary", label: "Summary (optional)", optional: true },
  ],
  safety_lead: [{ name: "membershipId", label: "Clinical safety lead", type: "member" }],
  contact_channel: [
    { name: "channel", label: "Channel", type: "select", options: [["sms", "Text message"], ["phone", "Phone call"], ["email", "Email"], ["app", "Patient app"], ["whatsapp", "WhatsApp"]] },
    { name: "senderName", label: "Sender name patients will see" },
    { name: "optOutWording", label: "How patients opt out" },
    { name: "contactHours", label: "Contact hours (optional)", optional: true },
  ],
  baseline: [
    { name: "periodStart", label: "Period start", type: "date" },
    { name: "periodEnd", label: "Period end", type: "date" },
    { name: "freedSlots", label: "Freed slots in the period", type: "number" },
    { name: "filledSlots", label: "Of those, filled", type: "number" },
    { name: "method", label: "How you filled them before Aksh" },
    { name: "staffMinutesPerSlot", label: "Staff minutes per freed slot, sampled (optional)", type: "number", optional: true },
  ],
};

export const STATE_BADGE: Record<Item["state"], { label: string; variant: "outline" | "warning" | "danger" | "default" }> = {
  missing: { label: "Not submitted", variant: "outline" },
  submitted: { label: "Awaiting Aksh review", variant: "warning" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Changes requested", variant: "danger" },
};

export const ACTION_LABEL: Record<string, string> = {
  submitted: "Evidence submitted",
  accepted: "Accepted by Aksh",
  rejected: "Changes requested by Aksh",
  requested: "Go-live review requested",
  approved: "Approved: live in shadow mode",
  returned: "Returned by Aksh",
};

const LICENSED = new Set(["gp", "nurse", "clinical-pharmacist"]);

export function evidenceSummary(key: string, ev: Record<string, unknown> | null) {
  if (!ev) return null;
  if (key === "safety_lead") return `${ev.displayName ?? ""} · ${ev.registry ?? ""} ${ev.registrationNumber ?? ""}`.trim();
  return (FIELDS[key] ?? [])
    .filter((f) => ev[f.name] !== undefined && ev[f.name] !== "")
    .map((f) => `${f.label}: ${f.options?.find(([v]) => v === ev[f.name])?.[1] ?? String(ev[f.name])}`)
    .join(" · ");
}

function EvidenceForm({ org, item, members, onSaved }: { org: Org; item: Item; members: Member[]; onSaved: (s: GoLiveSnapshot) => void }) {
  const fields = FIELDS[item.key] ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, item.evidence?.[f.name] !== undefined ? String(item.evidence[f.name]) : ""]))
  );
  const [error, setError] = useState<string | null>(null);
  const field = "mt-1 h-10 w-full rounded-xl border border-border bg-card px-2 text-sm";
  return (
    <form
      className="mt-3 grid gap-2 text-sm sm:grid-cols-2"
      data-evidence-form={item.key}
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const body = Object.fromEntries(
          fields.filter((f) => !(f.optional && !values[f.name])).map((f) => [f.name, f.type === "number" ? Number(values[f.name]) : values[f.name]])
        );
        const r = await fetch(`/api/orgs/${org.id}/go-live/items/${item.key}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await r.json().catch(() => ({}));
        if (r.ok) onSaved(data);
        else setError(data.error ?? "Could not save");
      }}
    >
      {fields.map((f) => (
        <label key={f.name} className={f.name === "method" || f.name === "optOutWording" || f.name === "summary" ? "sm:col-span-2" : undefined}>
          <span className="text-muted">{f.label}</span>
          {f.type === "select" ? (
            <select className={field} aria-label={f.label} required value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}>
              <option value="" disabled>Choose</option>
              {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ) : f.type === "member" ? (
            <select className={field} aria-label={f.label} required value={values[f.name]} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}>
              <option value="">Choose a clinician with a checked registration</option>
              {members.filter((m) => m.status === "active" && LICENSED.has(m.role) && m.registration_status === "verified").map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          ) : (
            <Input
              aria-label={f.label}
              type={f.type ?? "text"}
              min={f.type === "number" ? 0 : undefined}
              required={!f.optional}
              value={values[f.name]}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          )}
        </label>
      ))}
      <div className="sm:col-span-2"><Button type="submit" size="sm">{item.state === "missing" ? "Submit" : "Resubmit"}</Button></div>
      {error ? <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p> : null}
    </form>
  );
}

export function GoLiveTab({ org, onMessage, onStatusChange }: { org: Org; onMessage: (m: string | null) => void; onStatusChange: () => void }) {
  const [s, setS] = useState<GoLiveSnapshot | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const current = useRef(org.id);
  const load = useCallback(async () => {
    const id = org.id;
    const [g, m] = await Promise.all([fetch(`/api/orgs/${id}/go-live`), fetch(`/api/orgs/${id}/members`)]);
    const [gd, md] = await Promise.all([g.ok ? g.json() : null, m.ok ? m.json() : null]);
    if (current.current !== id) return; // never render one organisation's checklist under another
    if (gd) setS(gd);
    if (md) setMembers(md.rows);
  }, [org.id]);
  useEffect(() => {
    current.current = org.id;
    setS(null);
    setMembers([]);
    setEditing(null);
    void load();
  }, [org.id, load]);

  // Never show (or let anyone edit) one organisation's checklist under another's name.
  if (!s || s.org.id !== org.id) return <p className="text-sm text-muted">Loading the checklist…</p>;
  const editable = org.isAdmin && (s.org.status === "sandbox" || s.org.status === "onboarding");
  const live = s.org.status === "live_read_only" || s.org.status === "live";

  return (
    <div className="space-y-5" data-go-live>
      <Card>
        <CardContent className="space-y-2 p-5 text-sm">
          {live ? (
            <p className="font-medium text-foreground" data-go-live-status>Live in shadow mode since {s.org.verifiedAt ? new Date(s.org.verifiedAt).toLocaleDateString() : "approval"}. Aksh drafts; your staff decide and act.</p>
          ) : s.org.status === "onboarding" ? (
            <p className="font-medium text-foreground" data-go-live-status>Review requested. Aksh is checking your evidence; you can still update items marked “Changes requested”.</p>
          ) : (
            <p className="font-medium text-foreground" data-go-live-status>Complete every item, then ask Aksh to review. Your organisation goes live in shadow mode: Aksh never contacts patients or books on its own.</p>
          )}
          {s.blockers.length && !live ? (
            <ul className="m-0 list-disc space-y-0.5 pl-5 text-muted" data-go-live-blockers>{s.blockers.map((b) => <li key={b}>{b}</li>)}</ul>
          ) : null}
          {org.isAdmin && s.org.status === "sandbox" ? (
            <Button
              disabled={!s.canRequest}
              onClick={async () => {
                const r = await fetch(`/api/orgs/${org.id}/go-live/request`, { method: "POST" });
                const data = await r.json().catch(() => ({}));
                if (r.ok) {
                  onStatusChange(); // the request succeeded even if the user has since switched organisation
                  if (data.org?.id === current.current) { setS(data); onMessage("Go-live review requested"); }
                } else if (current.current === org.id) onMessage(data.error ?? "Could not request review");
              }}
            >
              Request go-live review
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Automatic checks</CardTitle></CardHeader>
          <CardContent>
            <ul className="m-0 list-none space-y-2 p-0 text-sm" data-auto-checks>
              {s.autos.map((a) => (
                <li key={a.key} className="flex items-start gap-2">
                  <span aria-hidden className={a.ok ? "text-secondary" : "text-red-700"}>{a.ok ? "✓" : "✗"}</span>
                  <span><span className="block text-foreground">{a.title}<span className="sr-only">{a.ok ? " (done)" : " (not done)"}</span></span><span className="block text-xs text-muted">{a.detail}</span></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Evidence</CardTitle></CardHeader>
          <CardContent>
            <ul className="m-0 list-none divide-y divide-border-subtle p-0" data-evidence>
              {s.items.map((i) => (
                <li key={i.key} className="py-3 text-sm" data-evidence-item={i.key}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{i.title}</span>
                    <Badge variant={STATE_BADGE[i.state].variant}>{i.locked ? "Accepted · locked" : STATE_BADGE[i.state].label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{i.help}</p>
                  {i.evidence ? <p className="mt-1 text-xs text-foreground">{evidenceSummary(i.key, i.evidence)}</p> : null}
                  {i.state === "rejected" && i.note ? <p className="mt-1 text-xs text-red-700">Aksh: {i.note}</p> : null}
                  {editable && !i.locked && (s.org.status === "sandbox" || i.state === "rejected") ? (
                    editing === i.key ? (
                      <EvidenceForm org={org} item={i} members={members} onSaved={(next) => { if (next.org.id !== current.current) return; setS(next); setEditing(null); onMessage(`${i.title}: submitted`); }} />
                    ) : (
                      <Button className="mt-2" size="sm" variant="outline" onClick={() => setEditing(i.key)}>{i.state === "missing" ? "Add evidence" : "Update"}</Button>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <CapabilityRegister orgId={org.id} />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent>
          {s.events.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : null}
          <ol className="m-0 list-none space-y-1 p-0 text-xs" data-go-live-history>
            {[...s.events].reverse().map((e) => (
              <li key={e.id} className="text-muted">
                <span className="text-foreground">{ACTION_LABEL[e.action] ?? e.action}</span>
                {e.item_key ? ` · ${s.items.find((i) => i.key === e.item_key)?.title ?? e.item_key}` : ""}
                {e.note ? ` · “${e.note}”` : ""} · {new Date(e.created_at).toLocaleString()}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

type Register = {
  workflow: { mode: string; contactExecutedBy: string; ruleVersion: string; templateVersion: string; metricVersion: string };
  stageHistory: { stage: string; note: string; at: string }[];
  connectors: { active: number; environment: string; capabilities: Record<string, boolean> };
  honesty: Record<string, boolean>;
};
const MODE_LABEL: Record<string, string> = { rehearsal: "Rehearsal (before go-live)", shadow: "Shadow mode", staff_assisted: "Staff-assisted" };
const HONESTY_LABEL: Record<string, string> = {
  liveEmis: "Writes to your records system",
  ehrWrite: "Writes to any EHR",
  messagesSentByAksh: "Aksh sends messages to patients",
  bookingConfirmedOnlyByReadBack: "A booking counts only after read-back",
  hitlRequired: "A person decides every step",
  aiOnPatientData: "Patient data sent to an AI model",
  autoRetrain: "Automatic model retraining",
  physiologicalTwin: "Physiological digital twin",
  PRISM_ATLAS_live: "Imaging or research agents live",
};

/** PRD v1.1 PA-10 / §8.1: what is switched on for this organisation, read from configuration. */
function CapabilityRegister({ orgId }: { orgId: string }) {
  const [r, setR] = useState<Register | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/orgs/${orgId}/capabilities`).then(async (res) => { if (res.ok && !cancelled) setR(await res.json()); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [orgId]);
  if (!r) return null;
  const caps = Object.entries(r.connectors.capabilities);
  return (
    <Card data-capability-register>
      <CardHeader className="pb-2"><CardTitle className="text-base">Capability register</CardTitle></CardHeader>
      <CardContent className="grid gap-4 text-sm md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">Workflow</p>
          <p className="text-foreground">{MODE_LABEL[r.workflow.mode] ?? r.workflow.mode} · contact by {r.workflow.contactExecutedBy}</p>
          <p className="text-xs text-muted">Rules {r.workflow.ruleVersion} · wording {r.workflow.templateVersion} · metric {r.workflow.metricVersion}</p>
          {r.stageHistory[0] ? <p className="text-xs text-muted">Last stage change: {r.stageHistory[0].stage.replace("_", "-")} · {new Date(r.stageHistory[0].at).toLocaleDateString()} · “{r.stageHistory[0].note}”</p> : null}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">Connections ({r.connectors.active} active · {r.connectors.environment})</p>
          <ul className="flex flex-wrap gap-1">
            {caps.map(([k, on]) => <li key={k}><Badge variant={on ? "default" : "outline"}>{k}{on ? "" : " · off"}</Badge></li>)}
          </ul>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">Honesty fields</p>
          <ul className="space-y-0.5 text-xs">
            {Object.entries(r.honesty).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span className="text-muted">{HONESTY_LABEL[k] ?? k}</span><span className="font-medium text-foreground">{v ? "Yes" : "No"}</span></li>)}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
