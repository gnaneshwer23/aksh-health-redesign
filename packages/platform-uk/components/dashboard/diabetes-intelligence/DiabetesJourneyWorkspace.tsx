"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";

import { ConnectedPatientChrome } from "@/components/dashboard/diabetes-intelligence/ConnectedPatientChrome";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { DiabetesJourneySnapshot } from "@/lib/diabetes-intelligence/types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function DiabetesJourneyWorkspace({ patientId, patientLabel }: Props) {
  const [journey, setJourney] = useState<DiabetesJourneySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const applyJourney = useCallback((data: DiabetesJourneySnapshot) => {
    setJourney(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/diabetes-journey`, {
        credentials: "include",
      });
      const data = (await res.json()) as DiabetesJourneySnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Journey unavailable", description: data.error ?? "Could not load." });
        return;
      }
      applyJourney(data);
    } finally {
      setLoading(false);
    }
  }, [patientId, applyJourney]);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/diabetes-journey`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as DiabetesJourneySnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      applyJourney(data);
      toast({ title: "Updated", description: "Synthetic journey advanced." });
    } finally {
      setBusy(false);
    }
  }

  async function decide(planId: string, action: "accept" | "edit" | "reject") {
    setBusy(true);
    try {
      const draft = journey?.carePlans.find((p) => p.id === planId);
      const body: Record<string, unknown> = { action };
      if (action === "reject") body.reason = "Clinician rejected — insufficient data or plan unsuitable";
      if (action === "edit" && draft) {
        body.editedSections = draft.sections.map((s) =>
          s.id === "follow_up"
            ? {
                ...s,
                items: [...s.items, "Edited: confirm face-to-face review within 7 days"],
              }
            : s
        );
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/diabetes-journey/care-plan/${encodeURIComponent(planId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as DiabetesJourneySnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      applyJourney(data);
      toast({ title: `Plan ${action}`, description: "No EHR write." });
    } finally {
      setBusy(false);
    }
  }

  async function followUp(taskId: string, action: "acknowledge" | "complete") {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/diabetes-journey/follow-up/${encodeURIComponent(taskId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = (await res.json()) as DiabetesJourneySnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Follow-up failed", description: data.error ?? "Could not update." });
        return;
      }
      applyJourney(data);
    } finally {
      setBusy(false);
    }
  }

  const label = journey?.patientLabel ?? patientLabel ?? patientId;
  const draft = journey?.carePlans.find((p) => p.status === "DRAFT");
  const approved = journey?.carePlans.filter((p) => p.status === "APPROVED") ?? [];

  return (
    <div
      className="dj-workspace space-y-6"
      style={
        {
          ["--dj-bg" as string]: "#f7fafc",
          ["--dj-ink" as string]: "#0f2744",
          ["--dj-muted" as string]: "#5b6b7c",
          ["--dj-line" as string]: "#d7e3ef",
          ["--dj-accent" as string]: "#0d9488",
          ["--dj-accent-soft" as string]: "#e6f7f5",
          ["--dj-warn" as string]: "#b45309",
        } as CSSProperties
      }
    >
      <ConnectedPatientChrome
        patientId={patientId}
        patientLabel={label}
        activeStep="journey"
        subtitle="Vertical slice · care-plan HITL · follow-up · timeline events"
        actions={
          <>
          <Button
            size="sm"
            disabled={busy || loading}
            onClick={() => void postAction({ action: "seed_synthetic" })}
            style={{ background: "var(--dj-ink)", color: "white" }}
          >
            Seed synthetic glucose
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || loading}
            onClick={() => void postAction({ action: "draft_care_plan" })}
          >
            Draft care plan
          </Button>
          <Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void load()}>
            Refresh
          </Button>
          </>
        }
      />

      {loading && !journey ? (
        <p className="text-sm" style={{ color: "var(--dj-muted)" }}>
          Loading journey…
        </p>
      ) : journey ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--dj-line)", background: "white" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--dj-ink)" }}>
              Clinical history
            </h2>
            <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--dj-ink)" }}>
              {journey.history.conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
              {journey.history.conditions.length === 0 && (
                <li style={{ color: "var(--dj-muted)" }}>No conditions recorded</li>
              )}
            </ul>
            <p className="mt-3 text-xs font-semibold uppercase" style={{ color: "var(--dj-muted)" }}>
              Medications
            </p>
            <ul className="mt-1 space-y-1 text-sm">
              {journey.history.medications.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            {journey.history.missingFields.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {journey.history.missingFields.map((f) => (
                  <span
                    key={f}
                    className="text-xs"
                    style={{ color: "var(--dj-warn)", background: "#fff7ed", padding: "2px 8px" }}
                  >
                    Missing: {f}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--dj-line)", background: "white" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--dj-ink)" }}>
                Glucose observations
              </h2>
              <span className="text-xs" style={{ color: "var(--dj-muted)" }}>
                Completeness {(journey.glucose.dataCompleteness * 100).toFixed(0)}%
              </span>
            </div>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded"
              style={{ background: "var(--dj-line)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${Math.round(journey.glucose.dataCompleteness * 100)}%`,
                  background: "var(--dj-accent)",
                }}
              />
            </div>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {journey.glucose.observations.map((o) => (
                <li key={`${o.recordedAt}-${o.glucoseMgDl}`} className="flex justify-between gap-2">
                  <span style={{ color: "var(--dj-muted)" }}>
                    {new Date(o.recordedAt).toLocaleString()}
                    {o.context ? ` · ${o.context}` : ""}
                  </span>
                  <span style={{ color: "var(--dj-ink)" }}>{o.glucoseMgDl} mg/dL</span>
                </li>
              ))}
              {journey.glucose.observations.length === 0 && (
                <li style={{ color: "var(--dj-muted)" }}>No observations — seed synthetic glucose</li>
              )}
            </ul>
            {journey.glucose.missingData.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--dj-warn)" }}>
                {journey.glucose.missingData.map((m) => (
                  <li key={m.code}>{m.message}</li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="rounded-lg border p-5 lg:col-span-2"
            style={{ borderColor: "var(--dj-line)", background: "white" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--dj-ink)" }}>
              Care plan review
            </h2>
            {!draft && approved.length === 0 && (
              <p className="mt-2 text-sm" style={{ color: "var(--dj-muted)" }}>
                No draft yet. Draft a care plan after seeding glucose.
              </p>
            )}
            {draft && (
              <div className="mt-3 space-y-3" style={{ background: "var(--dj-accent-soft)", padding: 16 }}>
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--dj-accent)" }}>
                  DRAFT · HITL required · ehrWrite=false
                </p>
                {draft.sections.map((s) => (
                  <div key={s.id}>
                    <p className="text-sm font-medium" style={{ color: "var(--dj-ink)" }}>
                      {s.title}
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm" style={{ color: "var(--dj-muted)" }}>
                      {s.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" disabled={busy} onClick={() => void decide(draft.id, "accept")}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decide(draft.id, "edit")}
                  >
                    Edit &amp; accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void decide(draft.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
            {approved.map((p) => (
              <div key={p.id} className="mt-3 border-t pt-3" style={{ borderColor: "var(--dj-line)" }}>
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--dj-accent)" }}>
                  APPROVED · {p.decidedBy} · {p.decidedAt ? new Date(p.decidedAt).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </section>

          <section
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--dj-line)", background: "white" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--dj-ink)" }}>
              Follow-up tasks
            </h2>
            <ul className="mt-3 space-y-3">
              {journey.followUps.map((t) => (
                <li key={t.id} className="text-sm">
                  <p style={{ color: "var(--dj-ink)" }}>{t.title}</p>
                  <p className="text-xs" style={{ color: "var(--dj-muted)" }}>
                    Owner {t.owner} · {t.status} · due {new Date(t.dueAt).toLocaleDateString()}
                  </p>
                  {(t.status === "open" || t.status === "acknowledged") && (
                    <div className="mt-2 flex gap-2">
                      {t.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void followUp(t.id, "acknowledge")}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void followUp(t.id, "complete")}
                      >
                        Complete
                      </Button>
                    </div>
                  )}
                </li>
              ))}
              {journey.followUps.length === 0 && (
                <li className="text-sm" style={{ color: "var(--dj-muted)" }}>
                  Follow-ups appear after Accept or Edit.
                </li>
              )}
            </ul>
          </section>

          <section
            className="rounded-lg border p-5"
            style={{ borderColor: "var(--dj-line)", background: "white" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--dj-ink)" }}>
              Longitudinal timeline
            </h2>
            <ol className="mt-3 max-h-80 space-y-3 overflow-y-auto border-l pl-4" style={{ borderColor: "var(--dj-line)" }}>
              {journey.timeline.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span
                    className="absolute -left-[21px] mt-1.5 h-2.5 w-2.5 rounded-full"
                    style={{ background: e.kind === "missing_data" ? "var(--dj-warn)" : "var(--dj-accent)" }}
                  />
                  <p className="font-medium" style={{ color: "var(--dj-ink)" }}>
                    {e.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--dj-muted)" }}>
                    {new Date(e.occurredAt).toLocaleString()} · {e.summary}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </div>
  );
}
