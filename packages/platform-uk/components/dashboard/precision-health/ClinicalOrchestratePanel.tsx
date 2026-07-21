"use client";

import { useCallback, useState, type ReactNode } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { resolveClinicalAgentLabel } from "@/lib/agents";
import type { OrchestrationAgentId, QueuePriority } from "@/lib/clinical-proof/agent-orchestration";
import type { SafetyRoute } from "@/lib/clinical-spine/safety-route";
import type { OracleModelCard } from "@/lib/precision-health/oracle-model-card";
import type { TwinSimulationResult } from "@/lib/precision-health/twin-simulation";

type OrchestrateResponse = {
  artifactType?: string;
  orchestration?: {
    queuePriority: QueuePriority;
    reviewOrder: OrchestrationAgentId[];
    outputs: {
      SYNTHESIS: { subjective: string; objective: string; assessment: string; plan: string; confidence: number };
      GUARDIAN: {
        overallStatus: string;
        summary: string;
        interactions: Array<{
          severity?: string;
          drugA?: string;
          drugB?: string;
          recommendation?: string;
        }>;
        confidence: number;
      };
      ORACLE: {
        oracleScore: number;
        oracleRisk: string;
        summary: string;
        contributingFactors?: string[];
        confidence: number;
      };
      NEXUS?: {
        status: "draft";
        summary: string;
        correlations: Array<{
          link: string;
          significance: string;
          suggestedConsideration: string;
        }>;
        confidence: number;
        mode?: string;
      };
    };
    ehrWrite: false;
    hitlRequired: true;
    elapsedMs: number;
  };
  safetyRoute?: SafetyRoute;
  safetyRouteLabel?: string;
  twin?: TwinSimulationResult | null;
  modelCard?: OracleModelCard;
  ehrWrite?: boolean;
  physiologicalTwin?: boolean;
  autoRetrain?: boolean;
  liveEmis?: boolean;
  error?: string;
};

type HitlMap = Partial<Record<OrchestrationAgentId | "TWIN", "Pending" | "Accepted" | "Rejected" | "Edited">>;

/**
 * CONDUCTOR — one-click SYNTHESIS → GUARDIAN → HORIZON → NEXUS on the clinical spine.
 * GUARDIAN first when urgent; twin ranking after HORIZON; all drafts HITL; liveEmis:false.
 */
export function ClinicalOrchestratePanel({
  patientId,
  patientLabel,
  onComplete,
}: {
  patientId: string;
  patientLabel?: string;
  onComplete?: (payload: {
    safetyRoute: SafetyRoute;
    twin: TwinSimulationResult | null;
    queuePriority: QueuePriority;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrateResponse | null>(null);
  const [hitl, setHitl] = useState<HitlMap>({});

  const run = useCallback(async () => {
    setLoading(true);
    setHitl({});
    setResult(null);
    try {
      const response = await fetch("/api/agents/orchestrate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, includeTwinRanking: true, includeDrAssist: false }),
      });
      const data = (await response.json()) as OrchestrateResponse;
      if (!response.ok || !data.orchestration) {
        toast({
          title: "Orchestrate unavailable",
          description: data.error ?? "Could not run clinical spine agents.",
        });
        return;
      }
      if (
        data.ehrWrite === true ||
        data.physiologicalTwin === true ||
        data.autoRetrain === true ||
        data.liveEmis === true
      ) {
        toast({
          title: "Honesty check failed",
          description: "API claimed EHR write, physiological twin, auto-retrain, or live EMIS — refused.",
        });
        return;
      }
      setResult(data);
      const initial: HitlMap = {};
      for (const agent of data.orchestration.reviewOrder) {
        initial[agent] = "Pending";
      }
      if (data.twin) initial.TWIN = "Pending";
      setHitl(initial);
      onComplete?.({
        safetyRoute: data.safetyRoute ?? "clinical_review_queue",
        twin: data.twin ?? null,
        queuePriority: data.orchestration.queuePriority,
      });
      toast({
        title: `Orchestrate ready · ${data.orchestration.queuePriority}`,
        description: `${data.safetyRouteLabel ?? data.safetyRoute} · GUARDIAN ${
          data.orchestration.reviewOrder[0] === "GUARDIAN" ? "first" : "in order"
        } · HITL required`,
      });
    } catch {
      toast({ title: "Orchestrate failed", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId, onComplete]);

  const stageAccept = async (agent: OrchestrationAgentId | "TWIN", summary: string) => {
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          agentLabel: agent,
          label: `SHIELD: ${agent} draft accepted (clinical spine orchestrate)`,
          detail: summary.slice(0, 280),
          resourceRef: `${patientLabel ?? patientId} (${patientId})`,
          category: "reviewer_decision",
          payload: {
            ehrWrite: false,
            hitlRequired: true,
            physiologicalTwin: false,
            liveEmis: false,
            safetyRoute: result?.safetyRoute ?? null,
          },
        }),
      });
    } catch {
      // Local HITL still applies.
    }
    setHitl((prev) => ({ ...prev, [agent]: "Accepted" }));
    toast({
      title: `${agent} accepted`,
      description: "Staged to SHIELD · no EHR write",
    });
  };

  const orch = result?.orchestration;
  const order = orch?.reviewOrder ?? [];

  return (
    <Card className="shadow-sm" data-testid="clinical-orchestrate-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm" data-testid="conductor-panel-title">
            CONDUCTOR · Orchestrate
          </CardTitle>
          <p className="text-xs text-muted">
            Supervisor agent — SYNTHESIS → GUARDIAN → HORIZON → NEXUS · twin ranking after HORIZON · drafts
            only · HITL mandatory · ehrWrite: false · liveEmis: false · physiologicalTwin: false. Accepted
            drafts stage via BRIDGE.
          </p>
        </div>
        <Button size="sm" disabled={loading} onClick={() => void run()} data-testid="orchestrate-run">
          {loading ? "Running CONDUCTOR…" : "Run CONDUCTOR"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {!orch ? (
          <p role="status" className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted">
            CONDUCTOR runs the shared clinical-proof orchestration on this patient. Urgent cases surface
            GUARDIAN first. NEXUS correlations are drafts. Dr.Assist coding remains an optional
            sub-capability (not a 13th directory agent). Not live EMR / CDS clearance.
          </p>
        ) : (
          <div className="space-y-4" data-testid="clinical-orchestrate-result">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span
                className={`rounded px-1.5 py-0.5 font-semibold uppercase ${
                  orch.queuePriority === "Urgent"
                    ? "bg-danger/15 text-danger"
                    : orch.queuePriority === "High"
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted"
                }`}
              >
                {orch.queuePriority}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5">
                Route: {result?.safetyRouteLabel ?? result?.safetyRoute}
              </span>
              <span className="text-muted">
                Review: {order.map((a) => resolveClinicalAgentLabel(a)).join(" → ")} · {orch.elapsedMs}ms
              </span>
            </div>

            {result?.modelCard && (
              <p className="text-[10px] text-muted" data-testid="orchestrate-oracle-model-card">
                HORIZON model {result.modelCard.modelId}@{result.modelCard.version} · owner:{" "}
                {result.modelCard.clinicalOwner} · autoRetrain: false
              </p>
            )}

            {order.map((agent) => {
              const status = hitl[agent] ?? "Pending";
              let summary = "";
              let body: ReactNode = null;
              if (agent === "GUARDIAN") {
                const g = orch.outputs.GUARDIAN;
                summary = g.summary;
                body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      GUARDIAN · {g.overallStatus}
                    </p>
                    <p className="text-sm">{g.summary}</p>
                    {g.interactions.length > 0 && (
                      <ul className="text-[11px] text-muted">
                        {g.interactions.slice(0, 4).map((i, idx) => (
                          <li key={idx}>
                            • {i.severity ?? "note"}: {i.drugA ?? "?"} + {i.drugB ?? "?"} —{" "}
                            {i.recommendation ?? "review"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              } else if (agent === "ORACLE") {
                const o = orch.outputs.ORACLE;
                summary = o.summary;
                body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      HORIZON · {o.oracleScore} ({o.oracleRisk})
                    </p>
                    <p className="text-sm">{o.summary}</p>
                  </>
                );
              } else if (agent === "SYNTHESIS") {
                const s = orch.outputs.SYNTHESIS;
                summary = `${s.assessment} ${s.plan}`;
                body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide">SYNTHESIS SOAP draft</p>
                    <p className="text-xs text-muted">A: {s.assessment}</p>
                    <p className="text-xs text-muted">P: {s.plan}</p>
                  </>
                );
              } else if (agent === "NEXUS") {
                const n = orch.outputs.NEXUS;
                if (!n) return null;
                summary = n.summary;
                body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      NEXUS · draft · {n.correlations.length} correlation(s)
                    </p>
                    <p className="text-sm">{n.summary}</p>
                    {n.correlations.length > 0 && (
                      <ul className="text-[11px] text-muted">
                        {n.correlations.slice(0, 3).map((c, idx) => (
                          <li key={idx}>
                            • {c.link} — {c.suggestedConsideration}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              } else {
                return null;
              }

              return (
                <div
                  key={agent}
                  className="space-y-2 rounded-sm border border-border-subtle p-3"
                  data-testid={`orchestrate-draft-${agent}`}
                >
                  {body}
                  {status === "Accepted" ? (
                    <p className="text-xs text-accent">Accepted · SHIELD · no EHR write</p>
                  ) : status === "Rejected" ? (
                    <p className="text-xs text-danger">Rejected</p>
                  ) : (
                    <HitlActions
                      status="Pending"
                      onAccept={() => void stageAccept(agent, summary)}
                      onEdit={() => {
                        setHitl((prev) => ({ ...prev, [agent]: "Edited" }));
                        toast({
                          title: "Edit noted",
                          description: "Re-run Orchestrate or open review queue for full edit.",
                        });
                      }}
                      onReject={(reason) => {
                        setHitl((prev) => ({ ...prev, [agent]: "Rejected" }));
                        toast({ title: `${agent} rejected`, description: reason || "No reason" });
                      }}
                    />
                  )}
                </div>
              );
            })}

            {result?.twin && (
              <div
                className="space-y-2 rounded-sm border border-border-subtle p-3"
                data-testid="orchestrate-twin-ranking"
              >
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Twin scenario ranking · {result.twin.simulationMode}
                </p>
                <p className="text-[10px] text-muted">
                  physiologicalTwin: false · HITL before plan promotion · not a living twin
                </p>
                <ol className="space-y-1 text-xs">
                  {result.twin.options.slice(0, 4).map((opt) => (
                    <li key={opt.interventionId}>
                      #{opt.rank} {opt.label} · benefit {opt.benefitScore} · risk {opt.riskScore}
                    </li>
                  ))}
                </ol>
                {hitl.TWIN === "Accepted" ? (
                  <p className="text-xs text-accent">Ranking staged · plan promotion still needs HITL</p>
                ) : hitl.TWIN === "Rejected" ? (
                  <p className="text-xs text-danger">Ranking rejected</p>
                ) : (
                  <HitlActions
                    status="Pending"
                    onAccept={() =>
                      void stageAccept(
                        "TWIN",
                        `Top: ${result.twin?.options[0]?.label ?? "n/a"} · synthetic_rules`
                      )
                    }
                    onEdit={() =>
                      toast({
                        title: "Use Scenario ranking panel",
                        description: "Full ranking HITL is also available below.",
                      })
                    }
                    onReject={(reason) => {
                      setHitl((prev) => ({ ...prev, TWIN: "Rejected" }));
                      toast({ title: "Twin ranking rejected", description: reason || "No reason" });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
