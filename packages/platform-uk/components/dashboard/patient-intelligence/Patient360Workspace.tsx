"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { Patient360Profile } from "@/lib/patient-intelligence/types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function Patient360Workspace({ patientId, patientLabel }: Props) {
  const [profile, setProfile] = useState<Patient360Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/patient-360`, {
        credentials: "include",
      });
      const data = (await res.json()) as Patient360Profile & { error?: string };
      if (!res.ok) {
        toast({ title: "Patient 360 unavailable", description: data.error ?? "Could not load." });
        return;
      }
      setProfile(data);
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
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/patient-360`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as Patient360Profile & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      setProfile(data);
      toast({ title: "Updated", description: "Patient 360 advanced (synthetic)." });
    } finally {
      setBusy(false);
    }
  }

  async function decideRecon(runId: string, action: "complete" | "cancel") {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/patient-360/medication-reconciliation/${encodeURIComponent(runId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            note:
              action === "complete"
                ? "Clinician completed reconciliation scaffolding — no prescribe"
                : "Cancelled reconciliation run",
          }),
        }
      );
      const data = (await res.json()) as Patient360Profile & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setProfile(data);
      toast({ title: `Reconciliation ${action}`, description: "No EHR write · no prescribe." });
    } finally {
      setBusy(false);
    }
  }

  const label = profile?.identity.displayName ?? patientLabel ?? patientId;
  const pendingRecon = profile?.medicationReconciliations.find(
    (r) => r.status === "pending_clinician" || r.status === "in_progress" || r.status === "draft"
  );

  return (
    <div
      className="p360-workspace space-y-6"
      style={
        {
          ["--p360-bg" as string]: "#f7fafc",
          ["--p360-ink" as string]: "#0f2744",
          ["--p360-muted" as string]: "#5b6b7c",
          ["--p360-line" as string]: "#d7e3ef",
          ["--p360-accent" as string]: "#0d9488",
          ["--p360-blue" as string]: "#1d4ed8",
          ["--p360-warn" as string]: "#b45309",
        } as CSSProperties
      }
    >
      <header
        className="rounded-lg border p-5"
        style={{ borderColor: "var(--p360-line)", background: "white", color: "var(--p360-ink)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--p360-accent)" }}>
          Patient 360 · unified intelligence foundation · synthetic
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--p360-muted)" }}>
          Structured history, diabetes classification, allergies, meds reconciliation scaffolding, encounters,
          labs/vitals, care team, consent preferences, provenance and quality. Not clinically validated.
          ehrWrite=false · autonomousPrescribe=false.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}`}>Patient chart</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}/diabetes-intelligence`}>
              Glucose intelligence
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/gp/diabetes-journey/${encodeURIComponent(patientId)}`}>
              Diabetes journey
            </Link>
          </Button>
          <Button
            size="sm"
            disabled={busy || loading}
            onClick={() => void postAction({ action: "seed_synthetic" })}
            style={{ background: "var(--p360-ink)", color: "white" }}
          >
            Seed Patient 360 spine
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || loading}
            onClick={() => void postAction({ action: "start_med_recon" })}
          >
            Start med reconciliation
          </Button>
          <Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </header>

      {loading && !profile ? (
        <p className="text-sm" style={{ color: "var(--p360-muted)" }}>
          Loading Patient 360…
        </p>
      ) : profile ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Data completeness"
              value={`${Math.round(profile.dataCompleteness * 100)}%`}
            />
            <Metric label="Quality flags" value={String(profile.qualityIndicators.length)} />
            <Metric
              label="Diabetes type"
              value={profile.diabetes?.diabetesType?.replace(/_/g, " ") ?? "unset"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Identity">
              <dl className="space-y-1 text-sm">
                <Row k="NHS number" v={profile.identity.nhsNumber ?? "—"} />
                <Row k="DOB" v={profile.identity.dateOfBirth ?? "—"} />
                <Row k="Sex" v={profile.identity.sex ?? "—"} />
                <Row k="Organisation" v={profile.identity.organisation ?? "—"} />
              </dl>
            </Panel>

            <Panel title="Diabetes classification">
              {profile.diabetes ? (
                <dl className="space-y-1 text-sm">
                  <Row k="Type" v={profile.diabetes.diabetesType.replace(/_/g, " ")} />
                  <Row k="Status" v={profile.diabetes.status} />
                  <Row k="Diagnosed" v={profile.diabetes.diagnosedOn ?? "—"} />
                  <Row k="SNOMED" v={profile.diabetes.snomedCode ?? "—"} />
                  <Row k="Note" v={profile.diabetes.classificationNote ?? "—"} />
                </dl>
              ) : (
                <p className="text-sm" style={{ color: "var(--p360-muted)" }}>
                  Seed the spine to classify diabetes.
                </p>
              )}
            </Panel>

            <Panel title="Conditions & comorbidities">
              <ul className="space-y-1 text-sm">
                {profile.conditions.map((c) => (
                  <li key={c.id}>
                    {c.display}{" "}
                    <span style={{ color: "var(--p360-muted)" }}>· {c.category}</span>
                  </li>
                ))}
                {profile.conditions.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None structured yet</li>
                )}
              </ul>
            </Panel>

            <Panel title="Allergies">
              <ul className="space-y-1 text-sm">
                {profile.allergies.map((a) => (
                  <li key={a.id}>
                    {a.substance}{" "}
                    <span style={{ color: "var(--p360-muted)" }}>· {a.criticality}</span>
                  </li>
                ))}
                {profile.allergies.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None recorded</li>
                )}
              </ul>
            </Panel>

            <Panel title="Family history">
              <ul className="space-y-1 text-sm">
                {profile.familyHistory.map((f) => (
                  <li key={f.id}>
                    {f.relationship}: {f.conditionDisplay}
                  </li>
                ))}
                {profile.familyHistory.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None recorded</li>
                )}
              </ul>
            </Panel>

            <Panel title="Medications & reconciliation">
              <ul className="space-y-1 text-sm">
                {profile.medications.map((m) => (
                  <li key={m.name}>
                    {m.name}{" "}
                    {m.status === "proposed" && (
                      <span style={{ color: "var(--p360-warn)" }}>· proposed</span>
                    )}
                  </li>
                ))}
              </ul>
              {pendingRecon && (
                <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--p360-line)" }}>
                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--p360-muted)" }}>
                    Pending reconciliation · HITL required
                  </p>
                  <ul className="space-y-1 text-xs" style={{ color: "var(--p360-warn)" }}>
                    {pendingRecon.discrepancies.map((d) => (
                      <li key={d.code + (d.medication ?? "")}>{d.message}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void decideRecon(pendingRecon.id, "complete")}
                      style={{ background: "var(--p360-blue)", color: "white" }}
                    >
                      Complete (no prescribe)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void decideRecon(pendingRecon.id, "cancel")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Encounters">
              <ul className="space-y-2 text-sm">
                {profile.encounters.map((e) => (
                  <li key={e.id}>
                    <div className="font-medium">{e.reason ?? e.className}</div>
                    <div style={{ color: "var(--p360-muted)" }} className="text-xs">
                      {e.startedAt.slice(0, 10)} · {e.status}
                    </div>
                  </li>
                ))}
                {profile.encounters.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None recorded</li>
                )}
              </ul>
            </Panel>

            <Panel title="Labs & vitals">
              <ul className="space-y-1 text-sm">
                {profile.observations.map((o) => (
                  <li key={o.id}>
                    {o.display}:{" "}
                    {o.valueNumeric != null
                      ? `${o.valueNumeric}${o.unit ? ` ${o.unit}` : ""}`
                      : (o.valueText ?? "—")}{" "}
                    <span style={{ color: "var(--p360-muted)" }}>
                      · {o.qualityFlag}
                      {!o.verified ? " · unverified" : ""}
                    </span>
                  </li>
                ))}
                {profile.observations.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None recorded</li>
                )}
              </ul>
            </Panel>

            <Panel title="Care team">
              <ul className="space-y-1 text-sm">
                {profile.careTeam
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <li key={c.id}>
                      {c.memberDisplay}{" "}
                      <span style={{ color: "var(--p360-muted)" }}>· {c.careRole}</span>
                    </li>
                  ))}
                {profile.careTeam.filter((c) => c.status === "active").length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None assigned</li>
                )}
              </ul>
            </Panel>

            <Panel title="Consent & sharing">
              <ul className="space-y-1 text-sm">
                {profile.sharingPreferences.map((s) => (
                  <li key={s.id}>
                    {s.purpose.replace(/_/g, " ")}:{" "}
                    <span
                      style={{
                        color: s.status === "granted" ? "var(--p360-accent)" : "var(--p360-warn)",
                      }}
                    >
                      {s.status}
                    </span>
                  </li>
                ))}
                {profile.sharingPreferences.length === 0 && (
                  <li style={{ color: "var(--p360-muted)" }}>None recorded</li>
                )}
              </ul>
            </Panel>
          </div>

          <Panel title="Quality & provenance indicators">
            <ul className="flex flex-wrap gap-2">
              {profile.qualityIndicators.map((q) => (
                <li
                  key={q.code + (q.field ?? "")}
                  className="text-xs"
                  style={{
                    color: "var(--p360-warn)",
                    background: "#fff7ed",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}
                >
                  {q.flag}: {q.message}
                </li>
              ))}
              {profile.qualityIndicators.length === 0 && (
                <li className="text-sm" style={{ color: "var(--p360-muted)" }}>
                  No quality gaps flagged
                </li>
              )}
            </ul>
          </Panel>

          <Panel title="Longitudinal timeline">
            <ol className="space-y-2 text-sm">
              {[...profile.timeline].reverse().slice(0, 24).map((e) => (
                <li key={e.id} className="flex gap-3 border-b pb-2" style={{ borderColor: "var(--p360-line)" }}>
                  <span className="w-28 shrink-0 text-xs" style={{ color: "var(--p360-muted)" }}>
                    {e.occurredAt.slice(0, 10)}
                  </span>
                  <span>
                    <span className="font-medium">{e.title}</span>
                    <span style={{ color: "var(--p360-muted)" }}> — {e.summary}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="rounded-lg border p-5"
      style={{ borderColor: "var(--p360-line)", background: "white", color: "var(--p360-ink)" }}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--p360-line)", background: "white", color: "var(--p360-ink)" }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: "var(--p360-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: "var(--p360-muted)" }}>{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
