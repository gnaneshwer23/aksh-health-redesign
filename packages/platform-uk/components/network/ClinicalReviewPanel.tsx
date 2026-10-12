"use client";

import { useState } from "react";

import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";

type Review = {
  provenance: { patientSource: string; glucoseSource: string; cgmReadings: number; hba1cReadings: number };
  result: {
    safetyRouteLabel: string;
    diabetesModuleEnabled: boolean;
    diabetes: {
      horizonContributingFactors: string[];
      guardianSafetyFlags: string[];
      signals: { glucose: { tirPercent: number | null; variabilityScore: number | null; dataCompleteness: string; limitations: string[] } };
    } | null;
    guardianGateway?: { output_status: string; reasons: string[] };
  };
};

/**
 * Track B link (platform map G1/G2): run the clinical agents on this care-network patient. Synthetic validation only —
 * never shown in the real workspace, where the route also refuses. The output is a draft for a clinician.
 */
export function ClinicalReviewPanel({ patientId }: { patientId: string }) {
  const real = useRealWorkspace();
  const [state, setState] = useState<{ busy: boolean; error: string | null; review: Review | null }>({ busy: false, error: null, review: null });
  if (real) return null;

  async function run() {
    setState({ busy: true, error: null, review: null });
    try {
      const r = await fetch(`/api/network/patients/${patientId}/clinical-review`, { method: "POST" });
      const body = await r.json();
      setState({ busy: false, error: r.ok ? null : body.error ?? "Could not run the review", review: r.ok ? body : null });
    } catch {
      setState({ busy: false, error: "Could not run the review", review: null });
    }
  }

  const g = state.review?.result.diabetes?.signals.glucose;
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border-subtle p-3 text-xs" data-clinical-review>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 font-medium text-foreground">Clinical review <span className="font-normal text-muted">(synthetic validation, Track B)</span></p>
        <button type="button" onClick={run} disabled={state.busy} className="rounded-full bg-foreground px-3 py-1 text-background disabled:opacity-50">
          {state.busy ? "Running…" : "Run clinical review"}
        </button>
      </div>
      {state.error ? <p className="m-0 text-muted" role="alert">{state.error}</p> : null}
      {state.review ? (
        <div className="space-y-1.5" role="status">
          <p className="m-0"><span className="text-muted">Route:</span> <span className="text-foreground">{state.review.result.safetyRouteLabel}</span>{state.review.result.guardianGateway ? ` · Guardian ${state.review.result.guardianGateway.output_status}` : ""}</p>
          <p className="m-0 text-muted">
            Data: care-network record · {state.review.provenance.cgmReadings} trusted CGM readings (14 days) · {state.review.provenance.hba1cReadings} verified HbA1c
          </p>
          {!state.review.result.diabetesModuleEnabled ? <p className="m-0 text-muted">Aksh Diabetes is switched off in this environment.</p> : null}
          {g ? <p className="m-0"><span className="text-muted">Glucose:</span> <span className="text-foreground">{g.tirPercent !== null ? `time in range ${g.tirPercent}%, variability ${g.variabilityScore}%` : `not enough data (${g.dataCompleteness})`}</span></p> : null}
          {state.review.result.diabetes?.horizonContributingFactors.length ? (
            <ul className="m-0 list-disc space-y-0.5 pl-4 text-muted">{state.review.result.diabetes.horizonContributingFactors.slice(0, 6).map((f) => <li key={f}>{f}</li>)}</ul>
          ) : null}
          {state.review.result.diabetes?.guardianSafetyFlags.length ? (
            <ul className="m-0 list-disc space-y-0.5 pl-4 text-foreground">{state.review.result.diabetes.guardianSafetyFlags.slice(0, 6).map((f) => <li key={f}>{f}</li>)}</ul>
          ) : null}
          <p className="m-0 text-muted">Draft for a clinician. Nothing is written to the record and nothing is sent to the patient.</p>
        </div>
      ) : null}
    </div>
  );
}
