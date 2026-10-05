"use client";

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
        if (!cancelled) setData({ liveEmis: false, hitlRequired: true, error: ctxJson.error ?? "Context unavailable" });
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

  return (
    <section className="dashboard-card space-y-4 border-border-subtle p-6 shadow-sm" data-testid="clinical-intelligence-workspace">
      <div>
        <h2 className="text-base font-semibold">Clinical Intelligence Workspace</h2>
        <p className="text-xs text-muted">
          {patientLabel} · evidence before persuasion · fact ≠ inference · liveEmis:false · HITL required
        </p>
      </div>
      {data?.error && <p className="text-sm text-coral-deep">{data.error}</p>}
      {pkg && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Clinical context</p>
            <p className="mt-1 text-sm">
              {pkg.conditions.slice(0, 4).join(" · ") || "No conditions"} 
            </p>
            <p className="mt-1 text-xs text-muted">Source {pkg.dataSource} · {pkg.schemaVersion}</p>
          </div>
          <div>
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
          <div>
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evidence (retrieved, not generated)</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {(data.rag?.hits ?? pkg.evidence).slice(0, 4).map((h) => (
                <li key={h.citation}>
                  {h.title} — {h.citation}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
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
