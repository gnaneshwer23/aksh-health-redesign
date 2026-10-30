"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { ConnectedPatientChrome } from "@/components/dashboard/diabetes-intelligence/ConnectedPatientChrome";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { ContinuousCareSnapshot } from "@/lib/diabetes-intelligence/continuous-care-types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function ContinuousCareWorkspace({ patientId, patientLabel }: Props) {
  const [snap, setSnap] = useState<ContinuousCareSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/continuous-care`, {
        credentials: "include",
      });
      const data = (await res.json()) as ContinuousCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Continuous care unavailable", description: data.error ?? "Could not load." });
        return;
      }
      setSnap(data);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/continuous-care`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ContinuousCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      setSnap(data);
      toast({ title: "Updated", description: "Synthetic continuous care advanced." });
    } finally {
      setBusy(false);
    }
  }

  async function decideEscalation(
    escalationId: string,
    action: "accept" | "edit" | "reject" | "resolve" | "queue"
  ) {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "reject") {
        body.reason = "Clinician rejected — escalation not appropriate";
      }
      if (action === "edit") {
        body.editedNote = "Edited: nurse phone check within 24h — no autonomous outreach";
        body.reason = "Edited draft escalation";
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/continuous-care/escalation/${encodeURIComponent(escalationId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as ContinuousCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setSnap(data);
      toast({ title: `Escalation ${action}`, description: "No EHR write · no autonomous action." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <ConnectedPatientChrome
        patientId={patientId}
        patientLabel={patientLabel ?? snap?.patientLabel}
        activeStep="continuous"
        subtitle="Phase 4 · follow-ups · escalations HITL · ops analytics"
        actions={
          <>
            <Button disabled={busy} onClick={() => void postAction({ action: "seed_synthetic" })}>
              Seed continuous care spine
            </Button>
            <Link href="/dashboard/gp/continuous-care">
              <Button variant="outline">GP worklist</Button>
            </Link>
            <Link href="/dashboard/nurse/continuous-care">
              <Button variant="outline">Nurse queue</Button>
            </Link>
          </>
        }
      />

      {loading || !snap ? (
        <p style={{ color: "#4a6278" }}>Loading continuous care…</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
            }}
          >
            <Stat label="Open follow-ups" value={String(snap.analytics.openFollowUps)} note="Worklist depth" />
            <Stat label="Overdue" value={String(snap.analytics.overdueFollowUps)} note="Past due" />
            <Stat label="HITL pending" value={String(snap.analytics.hitlPending)} note="Escalations" />
            <Stat label="Honesty" value="ehrWrite false" note="No autonomous clinical actions" />
          </div>

          <Section title="Follow-up worklist">
            {snap.followUpWorklist.length === 0 ? (
              <p style={muted}>No items — seed continuous care spine.</p>
            ) : (
              <ul style={list}>
                {snap.followUpWorklist.map((f) => (
                  <li key={f.id} style={{ marginBottom: 10 }}>
                    <strong>{f.title}</strong>
                    <div style={muted}>
                      owner {f.ownerRole}
                      {f.ownerDisplay ? ` (${f.ownerDisplay})` : ""} · {f.status} · {f.priority}
                      {f.dueAt ? ` · due ${f.dueAt.slice(0, 10)}` : ""} · outcome{" "}
                      {String(f.measurableOutcome.metric)}={String(f.measurableOutcome.value)}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {f.status === "open" || f.status === "acknowledged" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void postAction({
                              action: "update_follow_up",
                              itemId: f.id,
                              status: "in_progress",
                            })
                          }
                        >
                          Start
                        </Button>
                      ) : null}
                      {f.status !== "completed" && f.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void postAction({
                              action: "update_follow_up",
                              itemId: f.id,
                              status: "completed",
                              note: "Completed in synthetic continuous care",
                            })
                          }
                        >
                          Complete
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Appointment coordination">
            {snap.appointments.length === 0 ? (
              <p style={muted}>No appointments.</p>
            ) : (
              <ul style={list}>
                {snap.appointments.map((a) => (
                  <li key={a.id} style={{ marginBottom: 10 }}>
                    <strong>{a.title}</strong>
                    <div style={muted}>
                      {a.modality} · {a.status} · owner {a.ownerRole}
                      {a.scheduledAt ? ` · ${a.scheduledAt.slice(0, 16).replace("T", " ")}` : ""}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {a.status === "proposed" || a.status === "offered" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void postAction({
                              action: "update_appointment",
                              appointmentId: a.id,
                              status: "confirmed",
                            })
                          }
                        >
                          Confirm
                        </Button>
                      ) : null}
                      {a.status === "confirmed" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void postAction({
                              action: "update_appointment",
                              appointmentId: a.id,
                              status: "completed",
                            })
                          }
                        >
                          Mark attended
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Patient-reported updates">
            {snap.patientReportedUpdates.length === 0 ? (
              <p style={muted}>No patient updates.</p>
            ) : (
              <ul style={list}>
                {snap.patientReportedUpdates.map((u) => (
                  <li key={u.id} style={{ marginBottom: 10 }}>
                    <strong>{u.category}</strong> · {u.status}
                    <div style={muted}>{u.summary}</div>
                    {u.status === "submitted" || u.status === "triaged" ? (
                      <Button
                        size="sm"
                        style={{ marginTop: 6 }}
                        disabled={busy}
                        onClick={() =>
                          void postAction({
                            action: "triage_patient_update",
                            updateId: u.id,
                            status: "acknowledged",
                            note: "Acknowledged — unverified patient report",
                          })
                        }
                      >
                        Acknowledge
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Notification preferences">
            {!snap.notificationPreferences ? (
              <p style={muted}>Not configured — seed spine.</p>
            ) : (
              <>
                <p style={muted}>
                  status {snap.notificationPreferences.status} · email{" "}
                  {String(snap.notificationPreferences.channels.email)} · sms{" "}
                  {String(snap.notificationPreferences.channels.sms)} · in-app{" "}
                  {String(snap.notificationPreferences.channels.inApp)} · topics{" "}
                  {snap.notificationPreferences.topics.join(", ")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void postAction({
                      action: "set_notification_prefs",
                      channels: {
                        ...snap.notificationPreferences!.channels,
                        sms: !snap.notificationPreferences!.channels.sms,
                      },
                    })
                  }
                >
                  Toggle SMS preference
                </Button>
              </>
            )}
          </Section>

          <Section title="Staff escalation queue (HITL)">
            {snap.escalationQueue.length === 0 ? (
              <p style={muted}>No escalations.</p>
            ) : (
              <ul style={list}>
                {snap.escalationQueue.map((e) => (
                  <li key={e.id} style={{ marginBottom: 12 }}>
                    <strong>{e.title}</strong>
                    <div style={muted}>
                      {e.severity} · {e.status} · owner {e.ownerRole} · HITL required ·{" "}
                      {e.autonomousClinicalAction === false ? "no autonomous action" : ""}
                    </div>
                    <p style={{ margin: "6px 0", color: "#334e68" }}>{e.reason}</p>
                    {e.status === "DRAFT" || e.status === "queued" || e.status === "in_review" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <Button size="sm" disabled={busy} onClick={() => void decideEscalation(e.id, "accept")}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void decideEscalation(e.id, "edit")}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void decideEscalation(e.id, "reject")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void decideEscalation(e.id, "queue")}
                        >
                          Queue
                        </Button>
                      </div>
                    ) : e.status === "accepted" || e.status === "edited" ? (
                      <Button size="sm" disabled={busy} onClick={() => void decideEscalation(e.id, "resolve")}>
                        Resolve
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Care-plan progress">
            {snap.carePlanProgress.length === 0 ? (
              <p style={muted}>No progress rows.</p>
            ) : (
              <ul style={list}>
                {snap.carePlanProgress.map((p) => (
                  <li key={p.id} style={{ marginBottom: 10 }}>
                    <strong>{p.title}</strong>
                    <div style={muted}>
                      {p.status} · {p.progressPct}% · owner {p.ownerRole} · outcome{" "}
                      {String(p.measurableOutcome.value)}
                      {p.measurableOutcome.unit ?? ""}
                    </div>
                    <ul style={{ ...list, marginTop: 6 }}>
                      {p.milestones.map((m) => (
                        <li key={m.id}>
                          {m.done ? "✓" : "○"} {m.title}
                          {!m.done ? (
                            <Button
                              size="sm"
                              variant="outline"
                              style={{ marginLeft: 8 }}
                              disabled={busy}
                              onClick={() =>
                                void postAction({
                                  action: "update_plan_progress",
                                  progressId: p.id,
                                  milestoneId: m.id,
                                  milestoneDone: true,
                                })
                              }
                            >
                              Mark done
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Completed actions">
            {snap.completedActions.length === 0 ? (
              <p style={muted}>None yet — complete a follow-up or resolve an escalation.</p>
            ) : (
              <ul style={list}>
                {snap.completedActions.map((c) => (
                  <li key={c.id}>
                    {c.title} · {c.actionKind} · {c.ownerRole} · {c.completedAt.slice(0, 19)}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Operational & safety analytics">
            <pre style={pre}>{JSON.stringify(snap.analytics, null, 2)}</pre>
          </Section>

          <Section title="Decision history">
            {snap.decisionHistory.length === 0 ? (
              <p style={muted}>No history yet.</p>
            ) : (
              <ul style={list}>
                {snap.decisionHistory.slice(0, 12).map((h) => (
                  <li key={h.id}>
                    {h.createdAt.slice(0, 19)} · {h.subjectKind}/{h.action} · {h.actor}
                    {h.reason ? ` — ${h.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #d9e2ec",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <h2 style={{ margin: "0 0 10px", fontSize: 16, color: "#0f2744" }}>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d9e2ec",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#627d98" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 650, color: "#0f2744" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#829ab1" }}>{note}</div>
    </div>
  );
}

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#627d98",
  fontWeight: 600,
};

const muted: CSSProperties = { color: "#627d98", fontSize: 13, lineHeight: 1.45 };

const list: CSSProperties = { margin: 0, paddingLeft: 18, color: "#243b53", lineHeight: 1.5 };

const pre: CSSProperties = {
  margin: 0,
  fontSize: 12,
  background: "#f0f4f8",
  padding: 12,
  borderRadius: 8,
  overflow: "auto",
  color: "#243b53",
};
