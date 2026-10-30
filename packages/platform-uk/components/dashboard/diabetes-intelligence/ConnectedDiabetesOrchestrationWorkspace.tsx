"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ConnectedPatientChrome } from "@/components/dashboard/diabetes-intelligence/ConnectedPatientChrome";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { ConnectedDiabetesOrchestrationSnapshot } from "@/lib/diabetes-intelligence/connected-journey-orchestrate";

type Props = {
  patientId: string;
  patientLabel: string;
};

export function ConnectedDiabetesOrchestrationWorkspace({ patientId, patientLabel }: Props) {
  const { toast } = useToast();
  const [snap, setSnap] = useState<ConnectedDiabetesOrchestrationSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/connected-diabetes`, {
      credentials: "include",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Failed to load (${res.status})`);
    }
    setSnap((await res.json()) as ConnectedDiabetesOrchestrationSnapshot);
  }, [patientId]);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Load failed");
    });
  }, [load]);

  async function runPipeline(action: "run_pipeline" | "seed_all") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}/connected-diabetes`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as ConnectedDiabetesOrchestrationSnapshot & {
        error?: string;
        phasesExecuted?: Array<{ stepId: string; ok: boolean; detail: string }>;
        ehrWrite?: boolean;
      };
      if (!res.ok) throw new Error(body.error ?? `Pipeline failed (${res.status})`);
      if (body.ehrWrite !== false) throw new Error("Safety invariant: ehrWrite must be false");
      setSnap(body);
      const failed = (body.phasesExecuted ?? []).filter((p) => !p.ok);
      toast({
        title: action === "seed_all" ? "Pipeline re-seeded" : "Pipeline advanced",
        description:
          failed.length > 0
            ? `${failed.length} phase(s) reported errors — HITL gates still required`
            : "Phases walked with shared patient context. Clinician HITL still required.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pipeline failed";
      setError(message);
      toast({ title: "Pipeline error", description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" aria-busy={busy}>
      <ConnectedPatientChrome
        patientId={patientId}
        patientLabel={patientLabel}
        activeStep="orchestrate"
        subtitle="Synthetic connected pipeline · Single orchestration path across diabetes phases"
        actions={
          <>
            <Button disabled={busy} onClick={() => void runPipeline("run_pipeline")} data-testid="run-connected-pipeline">
              Run connected pipeline
            </Button>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() => void runPipeline("seed_all")}
              data-testid="seed-connected-pipeline"
            >
              Re-seed all phases
            </Button>
            <Button disabled={busy} variant="ghost" onClick={() => void load()}>
              Refresh status
            </Button>
          </>
        }
      />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {!snap ? (
        <p className="text-sm text-[#5b6b7c]" aria-live="polite">
          Loading orchestration status…
        </p>
      ) : (
        <>
          <section
            className="rounded-lg border border-[#d7e3ef] bg-white p-5 text-[#0f2744]"
            data-testid="connected-pipeline-status"
            aria-label="Pipeline phase status"
          >
            <h2 className="text-lg font-semibold">Phase status</h2>
            <p className="mt-1 text-sm text-[#5b6b7c]">
              Shared scope · ehrWrite={String(snap.ehrWrite)} · HITL required · LIVE organisations={" "}
              {snap.liveOrganisations}
            </p>
            <ul className="mt-4 space-y-2">
              {snap.steps.map((step) => (
                <li
                  key={step.stepId}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef3f8] py-2 last:border-0"
                  data-testid={`pipeline-step-${step.stepId}`}
                  data-status={step.status}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {step.phase} · {step.label}
                      <span className="ml-2 text-xs font-normal uppercase tracking-wide text-teal-700">
                        {step.status}
                      </span>
                    </p>
                    <p className="text-sm text-[#5b6b7c]">{step.summary}</p>
                  </div>
                  <Link
                    href={step.href}
                    className="text-sm text-teal-800 underline-offset-2 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-[#d7e3ef] bg-white p-5 text-[#0f2744]">
            <h2 className="text-lg font-semibold">Unified care plans</h2>
            <p className="mt-1 text-sm text-[#5b6b7c]">
              Journey HITL + medcare templates projected with provenance (INT-03 facade).
            </p>
            {snap.unifiedCarePlans.length === 0 ? (
              <p className="mt-3 text-sm text-[#5b6b7c]">No care plans yet — run the pipeline.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {snap.unifiedCarePlans.map((plan) => (
                  <li key={plan.unifiedKey} className="text-sm" data-testid="unified-care-plan">
                    <span className="font-medium">{plan.title}</span>
                    <span className="text-[#5b6b7c]">
                      {" "}
                      · {plan.status} · {plan.provenance} · {plan.sourceStore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-[#d7e3ef] bg-white p-5 text-[#0f2744]">
            <h2 className="text-lg font-semibold">Shared patient context sources</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {snap.sharedContext.sources.map((s) => (
                <li key={s.module}>
                  <span className={s.available ? "text-teal-800" : "text-[#5b6b7c]"}>
                    {s.available ? "●" : "○"} {s.module}
                  </span>
                  <span className="text-[#5b6b7c]"> — {s.note}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
