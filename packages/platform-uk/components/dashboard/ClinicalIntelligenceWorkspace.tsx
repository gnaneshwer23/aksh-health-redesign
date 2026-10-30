"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WorkspacePayload = {
  liveEmis: false;
  hitlRequired: true;
  package?: {
    contextId: string;
    schemaVersion: string;
    patient_context: { patientId: string; label: string };
    conditions: string[];
    medications: string[];
    laboratory_results: Array<{ name: string; value: string; recordedAt?: string }>;
    risk_factors: string[];
    missing_information: string[];
    uncertainties: string[];
    evidence: Array<{ title: string; citation: string; kind: string }>;
    provenance: Array<{ field: string; source: string }>;
    dataSource: string;
  };
  rag?: {
    dataSource: string;
    subgraph: Array<{ from: string; rel: string; to: string }>;
    hits: Array<{ title: string; citation: string; kind: string }>;
  };
  error?: string;
};

/**
 * Unified clinical intelligence panel — lives beside the review queue on GP surfaces.
 * Evidence before persuasion; connected diabetes journey opens from here without inventing new capabilities.
 */
export function ClinicalIntelligenceWorkspace({
  patientId,
  patientLabel,
}: {
  patientId: string;
  patientLabel: string;
}) {
  const [data, setData] = useState<WorkspacePayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ctxRes = await fetch(`/api/context/package?patientId=${encodeURIComponent(patientId)}`, {
        credentials: "include",
      });
      const ctxJson = (await ctxRes.json()) as WorkspacePayload & { package?: WorkspacePayload["package"] };
      if (!ctxRes.ok) {
        if (!cancelled)
          setData({
            liveEmis: false,
            hitlRequired: true,
            error:
              ctxRes.status === 401
                ? "Sign in to load the authorised patient context and cited evidence. The review queue below is a synthetic demo."
                : (ctxJson.error ?? "Context unavailable"),
          });
        return;
      }
      const ragRes = await fetch("/api/graphrag/retrieve", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patientId, query: "diabetes hba1c metformin renal" }),
      });
      const ragJson = ragRes.ok ? ((await ragRes.json()) as WorkspacePayload["rag"]) : undefined;
      if (!cancelled) {
        setData({
          liveEmis: false,
          hitlRequired: true,
          package: ctxJson.package,
          rag: ragJson,
        });
      }
    }
    void load().catch(() => {
      if (!cancelled) setData({ liveEmis: false, hitlRequired: true, error: "Failed to load intelligence workspace" });
    });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const pkg = data?.package;
  const connectedHref = `/dashboard/gp/patients/${encodeURIComponent(patientId)}/connected-diabetes`;

  return (
    <section
      className="dashboard-card space-y-4 border-border-subtle p-5 shadow-sm sm:p-6"
      data-testid="clinical-intelligence-workspace"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e4d52]">
            Clinical intelligence
          </p>
          <h2 className="mt-1 font-display text-base font-semibold tracking-tight text-foreground">
            Evidence before the draft
          </h2>
          <p className="mt-1 text-xs text-muted">
            {patientLabel} · fact ≠ inference · liveEmis:false · HITL required
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={connectedHref}
            className="inline-flex items-center rounded-full bg-[#121715] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
            data-testid="ci-open-connected-diabetes"
          >
            Connected diabetes
          </Link>
          <Link
            href={`/dashboard/gp/patients/${encodeURIComponent(patientId)}/patient-360`}
            className="inline-flex items-center rounded-full border border-border-subtle bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-[#121715]"
          >
            Patient 360
          </Link>
        </div>
      </div>

      {data?.error && <p className="text-sm text-muted">{data.error}</p>}
      {pkg && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-[#f7f6f0] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Clinical context</p>
            <p className="mt-1 text-sm text-foreground">
              {pkg.conditions.slice(0, 4).join(" · ") || "No conditions"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Source {pkg.dataSource} · {pkg.schemaVersion}
            </p>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-[#f7f6f0] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Key findings (retrieved facts)</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {pkg.laboratory_results.slice(0, 4).map((lab) => (
                <li key={`${lab.name}-${lab.value}`}>
                  {lab.name}: {lab.value}
                </li>
              ))}
              {pkg.laboratory_results.length === 0 && <li className="text-muted">No lab facts in package</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-white p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Uncertainty / missing</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {pkg.missing_information.map((m) => (
                <li key={m}>Missing: {m}</li>
              ))}
              {pkg.uncertainties.map((u) => (
                <li key={u}>{u}</li>
              ))}
              {pkg.missing_information.length === 0 && pkg.uncertainties.length === 0 && (
                <li className="text-muted">None flagged</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-white p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evidence (retrieved, not generated)</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {(data.rag?.hits ?? pkg.evidence).slice(0, 4).map((h) => (
                <li key={h.citation}>
                  {h.title} — {h.citation}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-white p-3.5 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Relationship view</p>
            <p className="mt-1 text-xs text-muted">
              Graph {data.rag?.dataSource === "neo4j" ? "live" : "mock/fixture"} — not a live EHR
            </p>
            <ul className="mt-1 max-h-28 overflow-auto text-xs">
              {(data.rag?.subgraph ?? []).slice(0, 12).map((e) => (
                <li key={`${e.from}-${e.rel}-${e.to}`}>
                  {e.from} —{e.rel}→ {e.to}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2 text-xs text-muted">
            Actions remain Accept / Edit / Reject / Escalate in the review queue. Context {pkg.contextId}. Provenance
            fields: {pkg.provenance.map((p) => p.field).join(", ")}.
          </div>
        </div>
      )}
    </section>
  );
}
