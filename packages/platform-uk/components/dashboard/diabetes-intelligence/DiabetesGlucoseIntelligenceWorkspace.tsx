"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

import { ConnectedPatientChrome } from "@/components/dashboard/diabetes-intelligence/ConnectedPatientChrome";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { DiabetesGlucoseIntelligenceSnapshot } from "@/lib/diabetes-intelligence/glucose-types";

type Props = {
  patientId: string;
  patientLabel?: string;
};

export function DiabetesGlucoseIntelligenceWorkspace({ patientId, patientLabel }: Props) {
  const [snap, setSnap] = useState<DiabetesGlucoseIntelligenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/diabetes-intelligence`,
        { credentials: "include" }
      );
      const data = (await res.json()) as DiabetesGlucoseIntelligenceSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Glucose intelligence unavailable", description: data.error ?? "Could not load." });
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
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/diabetes-intelligence`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as DiabetesGlucoseIntelligenceSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Action failed", description: data.error ?? "Request failed." });
        return;
      }
      setSnap(data);
      toast({ title: "Updated", description: "Synthetic glucose intelligence advanced." });
    } finally {
      setBusy(false);
    }
  }

  async function decide(reviewId: string, action: "accept" | "edit" | "reject") {
    setBusy(true);
    try {
      const draft = snap?.reviews.find((r) => r.id === reviewId);
      const body: Record<string, unknown> = { action };
      if (action === "reject") {
        body.reason = "Clinician rejected — data quality or clinical context unsuitable";
      }
      if (action === "edit" && draft) {
        body.editedSections = draft.summarySections.map((s) =>
          s.id === "safety"
            ? {
                ...s,
                items: [...s.items, "Edited: discuss results at next diabetes review"],
              }
            : s
        );
      }
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/diabetes-intelligence/review/${encodeURIComponent(reviewId)}/decision`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await res.json()) as DiabetesGlucoseIntelligenceSnapshot & { error?: string };
      if (!res.ok) {
        toast({ title: "Decision failed", description: data.error ?? "Could not decide." });
        return;
      }
      setSnap(data);
      toast({ title: `Review ${action}`, description: "No EHR write." });
    } finally {
      setBusy(false);
    }
  }

  const sparkCgm = useMemo(
    () => sparkPath(downsample(snap?.cgm.chart.map((p) => p.value) ?? [], 96)),
    [snap]
  );
  const sparkHba1c = useMemo(() => sparkPath(snap?.hba1c.series.map((p) => p.value) ?? []), [snap]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1100 }}>
      <ConnectedPatientChrome
        patientId={patientId}
        patientLabel={patientLabel ?? snap?.patientLabel}
        activeStep="glucose"
        subtitle="Phase 2 · HbA1c / CGM / SMBG · deterministic calculations · clinician sign-off"
        actions={
          <>
            <Button disabled={busy} onClick={() => void postAction({ action: "seed_synthetic" })}>
              Seed synthetic CGM / SMBG / HbA1c
            </Button>
            <Button
              variant="outline"
              disabled={busy || !(snap && (snap.cgm.readings.length || snap.hba1c.series.length))}
              onClick={() => void postAction({ action: "draft_review" })}
            >
              Draft review for sign-off
            </Button>
            <Link href="/dashboard/gp/diabetes-intelligence">
              <Button variant="outline">Worklist</Button>
            </Link>
          </>
        }
      />

      {loading || !snap ? (
        <p style={{ color: "#4a6278" }}>Loading glucose intelligence…</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <Stat
              label="Data completeness"
              value={`${Math.round(snap.dataCompleteness * 100)}%`}
              note="Synthetic completeness score"
            />
            <Stat
              label="TIR (in range)"
              value={
                snap.cgm.tir.pct
                  ? `${snap.cgm.tir.pct.inRange.toFixed(1)}%`
                  : "—"
              }
              note={
                snap.cgm.tir.sufficient
                  ? "Consensus sufficiency met"
                  : "Insufficient for clinical TIR use"
              }
            />
            <Stat
              label="HbA1c trend"
              value={snap.hba1c.trend.replace(/_/g, " ")}
              note={
                snap.hba1c.latestMmolMol != null
                  ? `Latest ${snap.hba1c.latestMmolMol} mmol/mol`
                  : "No series"
              }
            />
            <Stat
              label="Honesty"
              value="ehrWrite false"
              note="HITL required · synthetic"
            />
          </div>

          <Section title="Glucose trend (CGM)">
            {snap.cgm.chart.length === 0 ? (
              <p style={muted}>No CGM points — seed synthetic data.</p>
            ) : (
              <>
                <Sparkline path={sparkCgm} label="mmol/L over window" />
                <p style={muted}>
                  {snap.cgm.readings.length} CGM readings · chart values in mmol/L · gaps and quality
                  flags appear in indicators below.
                </p>
              </>
            )}
          </Section>

          <Section title="SMBG series">
            {snap.smbg.chart.length === 0 ? (
              <p style={muted}>No SMBG points.</p>
            ) : (
              <ul style={list}>
                {snap.smbg.readings.slice(-8).map((r) => (
                  <li key={r.id}>
                    {new Date(r.recordedAt).toLocaleString()} ·{" "}
                    {r.valueMmolL?.toFixed(1) ?? r.valueNumeric} mmol/L
                    {r.context ? ` · ${r.context}` : ""} · {r.qualityFlag}
                    {!r.verified ? " · unverified" : ""}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="HbA1c trend">
            {snap.hba1c.series.length === 0 ? (
              <p style={muted}>No HbA1c series.</p>
            ) : (
              <>
                <Sparkline path={sparkHba1c} label="mmol/mol" />
                <ul style={list}>
                  {snap.hba1c.explanations.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                <p style={muted}>{snap.hba1c.limitations[0]}</p>
              </>
            )}
          </Section>

          <Section title="Time-in-range analytics">
            <ul style={list}>
              {snap.cgm.tir.explanations.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            {snap.cgm.tir.pct && (
              <p style={muted}>
                VL {snap.cgm.tir.pct.veryLow.toFixed(1)}% · L {snap.cgm.tir.pct.low.toFixed(1)}% ·
                IR {snap.cgm.tir.pct.inRange.toFixed(1)}% · H {snap.cgm.tir.pct.high.toFixed(1)}% ·
                VH {snap.cgm.tir.pct.veryHigh.toFixed(1)}%
                {snap.cgm.tir.cvPct != null ? ` · CV ${snap.cgm.tir.cvPct}%` : ""}
              </p>
            )}
          </Section>

          <Section title="Missing data & measurement quality">
            {snap.missingData.length === 0 && snap.qualityIndicators.length === 0 ? (
              <p style={muted}>No indicators raised.</p>
            ) : (
              <ul style={list}>
                {snap.missingData.map((m) => (
                  <li key={m.code}>
                    <strong>{m.code}</strong> — {m.message}
                  </li>
                ))}
                {snap.qualityIndicators.slice(0, 10).map((q, i) => (
                  <li key={`${q.code}-${i}`}>
                    <strong>{q.flag}</strong> — {q.message}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Clinician review & sign-off">
            {snap.reviews.length === 0 ? (
              <p style={muted}>No review drafts yet — draft after seeding.</p>
            ) : (
              snap.reviews.map((r) => (
                <div key={r.id} style={reviewBox}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>
                      {r.status} · v{r.version}
                    </strong>
                    <span style={muted}>urgency {r.worklistUrgency}</span>
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
                      <Button disabled={busy} onClick={() => void decide(r.id, "accept")}>
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void decide(r.id, "edit")}
                      >
                        Edit & accept
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void decide(r.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {r.decidedAt && (
                    <p style={muted}>
                      Decided by {r.decidedBy} at {new Date(r.decidedAt).toLocaleString()}
                      {r.decisionReason ? ` — ${r.decisionReason}` : ""}
                    </p>
                  )}
                </div>
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={section}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={stat}>
      <div style={{ fontSize: 12, color: "#5a738a", textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 650, color: "#0f2744" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#5a738a" }}>{note}</div>
    </div>
  );
}

function Sparkline({ path, label }: { path: string; label: string }) {
  if (!path) return <p style={muted}>Not enough points to chart.</p>;
  return (
    <div>
      <svg viewBox="0 0 320 64" width="100%" height={64} role="img" aria-label={label}>
        <path d={path} fill="none" stroke="#1d6f8a" strokeWidth="2" />
      </svg>
      <p style={muted}>{label}</p>
    </div>
  );
}

function downsample(values: number[], maxPoints: number): number[] {
  if (values.length <= maxPoints) return values;
  const out: number[] = [];
  const step = (values.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) out.push(values[Math.round(i * step)]!);
  return out;
}

function sparkPath(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 320;
      const y = 56 - ((v - min) / span) * 48;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "#5a738a",
};
const section: CSSProperties = {
  background: "#fff",
  border: "1px solid #d7e2ec",
  borderRadius: 12,
  padding: 16,
  display: "grid",
  gap: 8,
};
const h2: CSSProperties = { margin: 0, fontSize: 17, color: "#0f2744" };
const muted: CSSProperties = { margin: 0, color: "#5a738a", fontSize: 14, lineHeight: 1.45 };
const list: CSSProperties = { margin: 0, paddingLeft: 18, color: "#24384c", lineHeight: 1.45 };
const stat: CSSProperties = {
  background: "#fff",
  border: "1px solid #d7e2ec",
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 4,
};
const reviewBox: CSSProperties = {
  borderTop: "1px solid #e4edf4",
  paddingTop: 10,
  display: "grid",
  gap: 8,
};
