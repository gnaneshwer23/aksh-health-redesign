"use client";

import { useState } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { CausalAiResult } from "@/lib/precision-health/causal-ai";

/**
 * Phase 3 causal AI stub UI — hypothesis only, not causal proof.
 */
export function CausalHypothesisPanel({
  patientId,
  patientLabel,
}: {
  patientId: string;
  patientLabel?: string;
}) {
  const [result, setResult] = useState<CausalAiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hitlStatus, setHitlStatus] = useState<"Pending" | "Accepted" | "Rejected">("Pending");

  const run = async () => {
    setBusy(true);
    setHitlStatus("Pending");
    try {
      const response = await fetch("/api/agents/causal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          question: "What hypothesized drivers may elevate short-term deterioration risk?",
        }),
      });
      const data = (await response.json()) as CausalAiResult & { error?: string };
      if (!response.ok) {
        toast({
          title: "Causal stub unavailable",
          description: data.error ?? "Could not generate hypothesis.",
        });
        return;
      }
      setResult(data);
      toast({
        title: "Hypothesis ready",
        description: "Hypothesis only, not causal proof · no EHR write",
      });
    } catch {
      toast({ title: "Causal stub unavailable", description: "Network error." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-sm" data-testid="causal-hypothesis-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">Causal AI hypothesis stub</CardTitle>
          <p className="text-xs text-muted">
            Hypothesis only, not causal proof
            {patientLabel ? ` · ${patientLabel}` : null} · clinical owner UNASSIGNED · ehrWrite:false
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void run()}>
          {busy ? "Running…" : "Run hypothesis"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {!result ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted">
            Stub returns rule + ORACLE risk-state hypothesized drivers. Not DAG-validated causal
            identification or RCT evidence.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-muted">
              mode:{result.mode} · {result.disclaimer} · owner:{result.modelCard.clinicalOwner}
            </p>
            <ul className="space-y-2">
              {result.hypothesizedDrivers.map((d) => (
                <li key={d.id} className="rounded-sm border border-border p-2 text-xs">
                  <p className="font-semibold">
                    {d.label}{" "}
                    <span className="font-normal text-muted">
                      · {d.hypothesizedEffect} · conf {d.confidence.toFixed(2)}
                    </span>
                  </p>
                  <p className="mt-1 text-muted">{d.evidenceBasis}</p>
                </li>
              ))}
            </ul>
            <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted">
              {result.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div>
              <p className="mb-2 text-xs font-semibold">HITL (hypothesis review — no EHR write)</p>
              <HitlActions
                status={hitlStatus}
                onAccept={() => {
                  setHitlStatus("Accepted");
                  toast({
                    title: "Hypothesis noted",
                    description: "Accept recorded in UI only — ehrWrite remains false",
                  });
                }}
                onEdit={() => {
                  toast({
                    title: "Edit path",
                    description: "Clinician should amend narrative outside this stub before care use",
                  });
                }}
                onReject={(reason) => {
                  setHitlStatus("Rejected");
                  setResult(null);
                  toast({
                    title: "Hypothesis rejected",
                    description: reason || "Discarded locally",
                  });
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
