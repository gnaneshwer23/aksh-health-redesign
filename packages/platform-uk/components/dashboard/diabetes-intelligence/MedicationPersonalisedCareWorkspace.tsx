"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type {
  CarePlanTemplateId,
  MedicationPersonalisedCareSnapshot,
} from "@/lib/diabetes-intelligence/medcare-types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function MedicationPersonalisedCareWorkspace({ patientId, patientLabel }: Props) {
  const [snap, setSnap] = useState<MedicationPersonalisedCareSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/medication-care`, {
        credentials: "include",
      });
      const data = (await res.json()) as MedicationPersonalisedCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Medication care unavailable", description: data.error ?? "Could not load." });
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
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/medication-care`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as MedicationPersonalisedCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      setSnap(data);
      toast({ title: "Updated", description: "Synthetic medication / care plan advanced." });
    } finally {
      setBusy(false);
    }
  }

  async function decideSafety(reviewId: string, action: "accept" | "edit" | "reject") {
    setBusy(true);
    try {
      const draft = snap?.safetyReviews.find((r) => r.id === reviewId);
      const body: Record<string, unknown> = { action };
      if (action === "reject") {
        body.reason = "Clinician rejected — flags not appropriate for this context";
      }
      if (action === "edit" && draft) {
        body.editedSections = draft.summarySections.map((s) =>
          s.id === "honesty"
            ? { ...s, items: [...s.items, "Edited: discuss with patient at next medicines review"] }
            : s
        );
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/medication-care/safety-review/${encodeURIComponent(reviewId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as MedicationPersonalisedCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setSnap(data);
      toast({ title: `Safety review ${action}`, description: "No EHR write · no prescribe." });
    } finally {
      setBusy(false);
    }
  }

  async function decidePlan(planId: string, action: "accept" | "edit" | "reject") {
    setBusy(true);
    try {
      const draft = snap?.carePlans.find((p) => p.id === planId);
      const body: Record<string, unknown> = { action };
      if (action === "reject") {
        body.reason = "Clinician rejected — template not suitable";
      }
      if (action === "edit" && draft) {
        body.editedSections = draft.sections.map((s) =>
          s.id === "safety"
            ? { ...s, items: [...s.items, "Edited: add lifestyle follow-up in 2 weeks"] }
            : s
        );
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/medication-care/care-plan/${encodeURIComponent(planId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as MedicationPersonalisedCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setSnap(data);
      toast({ title: `Care plan ${action}`, description: "No EHR write." });
    } finally {
      setBusy(false);
    }
  }

  async function decideRecon(runId: string, action: "complete" | "cancel") {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/medication-care/medication-reconciliation/${encodeURIComponent(runId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            note: action === "complete" ? "Reconciled without prescribe" : "Cancelled by clinician",
          }),
        }
      );
      const data = (await res.json()) as MedicationPersonalisedCareSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Recon failed", description: data.error ?? "Could not update." });
        return;
      }
      setSnap(data);
      toast({ title: `Reconciliation ${action}`, description: "No prescribe · ehrWrite false." });
    } finally {
      setBusy(false);
    }
  }

  const pendingRecon = snap?.medicationReconciliations.find(
    (r) => r.status === "pending_clinician" || r.status === "in_progress"
  );

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <p style={eyebrow}>
          Medication & personalised care · Phase 3 · synthetic · not clinically validated
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 650, color: "#0f2744" }}>
          {patientLabel ?? snap?.patientLabel ?? patientId}
        </h1>
        <p style={{ margin: 0, color: "#4a6278", maxWidth: 62 * 8, lineHeight: 1.5 }}>
          Medication lists and reconciliation, allergy panel with a clearly labeled synthetic
          interaction stub (not a licensed drug database), clinician-reviewed safety flags,
          care-plan templates, goals, education, tasks and handoffs. ehrWrite stays false.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button disabled={busy} onClick={() => void postAction({ action: "seed_synthetic" })}>
            Seed synthetic meds & care spine
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void postAction({ action: "start_med_recon" })}
          >
            Start med reconciliation
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void postAction({ action: "draft_safety_review" })}
          >
            Draft safety review
          </Button>
          <Link href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}/patient-360`}>
            <Button variant="outline">Patient 360</Button>
          </Link>
          <Link href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}/diabetes-intelligence`}>
            <Button variant="outline">Glucose intelligence</Button>
          </Link>
        </div>
      </header>

      {loading || !snap ? (
        <p style={{ color: "#4a6278" }}>Loading medication & personalised care…</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 12,
            }}
          >
            <Stat label="Medications" value={String(snap.medications.length)} note="Cohort / recon list" />
            <Stat
              label="Safety flags"
              value={String(snap.safetyFlags.filter((f) => f.status === "pending_review").length)}
              note="Pending clinician review"
            />
            <Stat label="Goals" value={String(snap.goals.length)} note="Patient goals" />
            <Stat label="Honesty" value="ehrWrite false" note="No prescribe · stub interactions" />
          </div>

          <Section title="Medication list">
            {snap.medications.length === 0 ? (
              <p style={muted}>No medications — seed or confirm with patient.</p>
            ) : (
              <ul style={list}>
                {snap.medications.map((m) => (
                  <li key={m.name + (m.status ?? "")}>
                    {m.name}
                    {m.status ? ` · ${m.status}` : ""}
                    {m.source ? ` · ${m.source}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Medication reconciliation">
            {!pendingRecon ? (
              <p style={muted}>No pending recon — start reconciliation to extend Phase 1 workflow.</p>
            ) : (
              <div style={reviewBox}>
                <strong>
                  {pendingRecon.status} · {pendingRecon.discrepancies.length} discrepancy(ies)
                </strong>
                <ul style={list}>
                  {pendingRecon.discrepancies.map((d) => (
                    <li key={d.code + (d.medication ?? "")}>{d.message}</li>
                  ))}
                </ul>
                <p style={muted}>autonomousPrescribe false · ehrWrite false</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button disabled={busy} onClick={() => void decideRecon(pendingRecon.id, "complete")}>
                    Complete (no prescribe)
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decideRecon(pendingRecon.id, "cancel")}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Allergy & interaction information">
            <p style={{ ...muted, marginBottom: 8 }}>
              <strong>{snap.allergyInteractions.source.label}</strong>
              <br />
              {snap.allergyInteractions.source.note}
            </p>
            <ul style={list}>
              {snap.allergyInteractions.allergies.map((a) => (
                <li key={a.id}>
                  Allergy: {a.substance} · {a.criticality}
                  {a.reaction ? ` · ${a.reaction}` : ""}
                </li>
              ))}
              {snap.allergyInteractions.interactions.map((i) => (
                <li key={i.id}>
                  {i.severity.toUpperCase()}: {i.drugA} + {i.drugB} — {i.recommendation} ·{" "}
                  {i.referenceLabel}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Clinician-reviewed medication safety flags">
            {snap.safetyFlags.length === 0 ? (
              <p style={muted}>No flags — seed synthetic spine.</p>
            ) : (
              <ul style={list}>
                {snap.safetyFlags.map((f) => (
                  <li key={f.id}>
                    <strong>{f.status}</strong> · {f.severity}: {f.title}
                  </li>
                ))}
              </ul>
            )}
            {snap.safetyReviews.map((r) => (
              <div key={r.id} style={reviewBox}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong>
                    Review {r.status} · v{r.version}
                  </strong>
                  <span style={muted}>validatedCds false</span>
                </div>
                <ul style={list}>
                  {r.summarySections.map((s) => (
                    <li key={s.id}>
                      <em>{s.title}</em>: {s.items[0]}
                    </li>
                  ))}
                </ul>
                {r.status === "DRAFT" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button disabled={busy} onClick={() => void decideSafety(r.id, "accept")}>
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void decideSafety(r.id, "edit")}
                    >
                      Edit & accept
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void decideSafety(r.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </Section>

          <Section title="Individualised care-plan templates">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {snap.carePlanTemplates.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void postAction({
                      action: "apply_care_plan_template",
                      templateId: t.id as CarePlanTemplateId,
                    })
                  }
                >
                  Draft: {t.title}
                </Button>
              ))}
            </div>
            {snap.carePlans.length === 0 ? (
              <p style={muted}>No personalised plans yet — apply a template (creates DRAFT).</p>
            ) : (
              snap.carePlans.map((p) => (
                <div key={p.id} style={reviewBox}>
                  <strong>
                    {p.status} · {p.title}
                  </strong>
                  <ul style={list}>
                    {p.sections.map((s) => (
                      <li key={s.id}>
                        <em>{s.title}</em>: {s.items[0]}
                      </li>
                    ))}
                  </ul>
                  {p.status === "DRAFT" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button disabled={busy} onClick={() => void decidePlan(p.id, "accept")}>
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void decidePlan(p.id, "edit")}
                      >
                        Edit & accept
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void decidePlan(p.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </Section>

          <Section title="Patient goals & educational resources">
            <ul style={list}>
              {snap.goals.map((g) => (
                <li key={g.id}>
                  <strong>{g.status}</strong> · {g.title}
                  <div style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void postAction({
                          action: "set_goal_status",
                          goalId: g.id,
                          goalStatus: "active",
                        })
                      }
                    >
                      Activate
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <p style={{ ...muted, marginTop: 8 }}>Education catalog (synthetic):</p>
            <ul style={list}>
              {snap.educationalResources.map((e) => (
                <li key={e.id}>
                  {e.title} · {e.audience} · {e.urlOrRef}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Assigned tasks & care-team handoffs">
            <ul style={list}>
              {snap.assignedTasks.map((t) => (
                <li key={t.id}>
                  <strong>{t.status}</strong> · {t.title} · owner {t.ownerRole}
                  {t.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ marginLeft: 8 }}
                      disabled={busy}
                      onClick={() =>
                        void postAction({
                          action: "update_task",
                          taskId: t.id,
                          taskStatus: "in_progress",
                        })
                      }
                    >
                      Start
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <ul style={list}>
              {snap.handoffs.map((h) => (
                <li key={h.id}>
                  Handoff {h.fromRole} → {h.toRole}: {h.summary}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Review & approval history">
            {snap.approvalHistory.length === 0 ? (
              <p style={muted}>No history yet.</p>
            ) : (
              <ul style={list}>
                {snap.approvalHistory.slice(0, 12).map((h) => (
                  <li key={h.id}>
                    {new Date(h.createdAt).toLocaleString()} · {h.action} · {h.subjectKind} ·{" "}
                    {h.actor}
                    {h.reason ? ` — ${h.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {snap.missingData.length > 0 && (
            <Section title="Missing-data indicators">
              <ul style={list}>
                {snap.missingData.map((m) => (
                  <li key={m.code}>
                    <strong>{m.code}</strong> — {m.message}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={statBox}>
      <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5a738a" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 650, color: "#0f2744" }}>{value}</div>
      <div style={muted}>{note}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionBox}>
      <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 650, color: "#0f2744" }}>{title}</h2>
      {children}
    </section>
  );
}

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#2a6f8f",
  fontWeight: 600,
};

const muted: CSSProperties = { margin: 0, color: "#5a738a", fontSize: 13, lineHeight: 1.45 };

const list: CSSProperties = { margin: "0 0 0 1.1rem", padding: 0, color: "#243b53", lineHeight: 1.55 };

const sectionBox: CSSProperties = {
  background: "#fff",
  border: "1px solid #d9e6ef",
  borderRadius: 10,
  padding: 16,
};

const statBox: CSSProperties = {
  ...sectionBox,
  display: "grid",
  gap: 4,
};

const reviewBox: CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 8,
  background: "#f4f9fc",
  border: "1px solid #cfe0eb",
  display: "grid",
  gap: 8,
};
