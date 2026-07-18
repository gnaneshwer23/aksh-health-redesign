"use client";

import { useCallback, useState } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { TwinSimulationResult } from "@/lib/precision-health/twin-simulation";

/**
 * Scenario ranking panel — synthetic rules only.
 * Explicitly not a living physiological digital twin.
 */
export function ScenarioRankingPanel({
  patientId,
  patientLabel,
}: {
  patientId: string;
  patientLabel?: string;
}) {
  const [result, setResult] = useState<TwinSimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hitlStatus, setHitlStatus] = useState<"Pending" | "Accepted" | "Rejected" | "Edited">(
    "Pending"
  );
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setHitlStatus("Pending");
    setRejectReason(null);
    try {
      const response = await fetch("/api/precision-health/twin/simulate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        toast({
          title: "Scenario ranking unavailable",
          description:
            typeof data.error === "string" ? data.error : "Could not run synthetic simulation.",
        });
        return;
      }
      if (data.physiologicalTwin === true || data.ehrWrite === true) {
        toast({
          title: "Honesty check failed",
          description: "API claimed physiological twin or EHR write — refuse to stage.",
        });
        return;
      }
      if (!Array.isArray(data.options) || data.simulationMode !== "synthetic_rules") {
        toast({
          title: "Scenario ranking unavailable",
          description: "Unexpected response shape.",
        });
        return;
      }
      setResult(data as unknown as TwinSimulationResult);
      toast({
        title: "Synthetic ranking ready",
        description: "Not a living digital twin · HITL required before plan promotion",
      });
    } catch {
      toast({ title: "Scenario ranking failed", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const stageAccept = async () => {
    if (!result) return;
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          agentLabel: "TWIN_SIM",
          label: "SHIELD: synthetic scenario ranking staged (not physiological twin)",
          detail: `Top: ${result.options[0]?.label ?? "n/a"} · mode=${result.simulationMode}`,
          resourceRef: `${patientLabel ?? patientId} (${patientId})`,
          category: "reviewer_decision",
          payload: {
            physiologicalTwin: false,
            simulationMode: "synthetic_rules",
            ehrWrite: false,
            hitlRequired: true,
            planPromotionRequiresHitl: true,
            topIntervention: result.options[0]?.interventionId ?? null,
          },
        }),
      });
    } catch {
      // Local staging still applies.
    }
    setHitlStatus("Accepted");
    toast({
      title: "Staged for clinician review",
      description: "Ranking logged to SHIELD · no plan promotion · no EHR write",
    });
  };

  return (
    <Card className="shadow-sm" data-testid="scenario-ranking-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">
            Scenario ranking (synthetic) — not a living digital twin
          </CardTitle>
          <p className="text-xs text-muted">
            Rules + ORACLE risk-state only · simulationMode: synthetic_rules · ehrWrite: false · HITL
            before plan promotion
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void run()}>
          {loading ? "Ranking…" : "Run scenario ranking"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {!result ? (
          <p
            role="status"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            No ranking yet. This is rehearsal scoring — not physiology simulation or MHRA-cleared CDS.
          </p>
        ) : (
          <div className="space-y-3" data-testid="scenario-ranking-result">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted">
              <span className="rounded bg-warning/15 px-1.5 py-0.5 font-semibold uppercase text-warning">
                {result.simulationMode}
              </span>
              <span>physiologicalTwin: false</span>
              <span>· ORACLE {result.oracleScoreUsed ?? "—"} ({result.oracleRiskUsed ?? "n/a"})</span>
            </div>

            <ol className="space-y-2">
              {result.options.map((opt) => (
                <li
                  key={opt.interventionId}
                  className="rounded-sm border border-border p-2 text-xs"
                >
                  <p className="font-semibold">
                    #{opt.rank} {opt.label}
                  </p>
                  <p className="mt-1 text-muted">
                    Benefit {opt.benefitScore} · Risk {opt.riskScore} · Confidence {opt.confidence} ·
                    Cost {opt.estimatedRelativeCost}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">{opt.rationale}</p>
                </li>
              ))}
            </ol>

            <ul className="space-y-0.5 text-[10px] text-muted">
              {result.limitations.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>

            {hitlStatus === "Accepted" ? (
              <p className="text-xs font-medium text-accent">
                Staged to SHIELD · plan promotion still requires separate HITL · no EHR write
              </p>
            ) : hitlStatus === "Rejected" ? (
              <p className="text-xs font-medium text-danger">
                Rejected: {rejectReason || "No reason provided"}
              </p>
            ) : (
              <HitlActions
                status="Pending"
                onAccept={() => void stageAccept()}
                onEdit={() => {
                  toast({
                    title: "Edit not available on ranking list",
                    description: "Reject and re-run, or promote via health plan draft after HITL.",
                  });
                }}
                onReject={(reason) => {
                  setHitlStatus("Rejected");
                  setRejectReason(reason || null);
                  toast({
                    title: "Scenario ranking rejected",
                    description: reason || "No reason provided",
                  });
                }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
