"use client";

import { useCallback, useState, type ReactNode } from "react";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { ReviewHonestyStrip } from "@/components/dashboard/review/ReviewHonestyStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { resolveClinicalAgentLabel } from "@/lib/agents";
import type { OrchestrationAgentId, QueuePriority } from "@/lib/clinical-proof/agent-orchestration";
import type { SafetyRoute } from "@/lib/clinical-spine/safety-route";
import type { DiabetesRiskContribution } from "@/lib/disease-modules/diabetes";
import type { OracleModelCard } from "@/lib/precision-health/oracle-model-card";
import type { TwinSimulationResult } from "@/lib/precision-health/twin-simulation";
import { formatHbA1c } from "@/lib/diabetes-units";
import { summarizeExecutionModesFromAgents } from "@/lib/review/honesty-strip-client";

/** B4: HORIZON/GUARDIAN items sourced from the Diabetes module are prefixed "[Diabetes] " by
 * lib/clinical-spine/orchestrate.ts (applyDiabetesContributionAdditively) — strip the prefix for
 * display and use its presence to render a distinct provenance badge, never an unlabeled generic factor. */
const DIABETES_FACTOR_PREFIX = "[Diabetes] ";

function isDiabetesSourced(item: string) {
  return item.startsWith(DIABETES_FACTOR_PREFIX);
}

function stripDiabetesPrefix(item: string) {
  return isDiabetesSourced(item) ? item.slice(DIABETES_FACTOR_PREFIX.length) : item;
}

function DiabetesBadge() {
  return (
    <span
      className="rounded bg-accent/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent"
      data-testid="diabetes-sourced-badge"
    >
      Diabetes module
    </span>
  );
}

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
        safetyNotes?: string[];
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
    /** A1 run bundle — drives Milestone C2 honesty strip executionMode chips. */
    execution?: {
      correlationId?: string;
      evidenceRefs?: string[];
      guardianOutcome?: string | null;
      agents?: Array<{ agentId: string; executionMode: string }>;
    };
    agentMetadata?: Partial<Record<string, { agentId: string; executionMode: string }>>;
  };
  safetyRoute?: SafetyRoute;
  safetyRouteLabel?: string;
  twin?: TwinSimulationResult | null;
  modelCard?: OracleModelCard;
  ehrWrite?: boolean;
  physiologicalTwin?: boolean;
  autoRetrain?: boolean;
  liveEmis?: boolean;
  /** B4 — Diabetes v1 UI: null unless ENABLE_DIABETES_MODULE=true and the patient is diabetes-flagged. */
  diabetesModuleEnabled?: boolean;
  diabetes?: DiabetesRiskContribution | null;
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
          description: "API claimed EHR write, physiological twin, auto-retrain, or live EHR — refused.",
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
        body: JSON.stringify({ event: "decided", subject: "draft", action: "accept", agent, note: summary.slice(0, 280), resourceRef: `${patientLabel ?? patientId} (${patientId})` }),
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
  const runHonesty = orch?.execution?.agents?.length
    ? summarizeExecutionModesFromAgents(orch.execution.agents, {
        evidenceRefCount: orch.execution.evidenceRefs?.length ?? 0,
        correlationId: orch.execution.correlationId ?? null,
        guardianOutcome: orch.execution.guardianOutcome ?? null,
      })
    : null;

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
        <ReviewHonestyStrip
          surface="CONDUCTOR agent brief"
          variant="run"
          runSummary={runHonesty}
          fetchSessionMode={false}
          showHcpSessionLink={false}
        />
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
                const safetyNotes = g.safetyNotes ?? [];
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
                    {safetyNotes.length > 0 && (
                      <ul className="space-y-1 text-[11px] text-muted" data-testid="guardian-safety-notes">
                        {safetyNotes.map((note, idx) => (
                          <li key={idx} className="flex flex-wrap items-center gap-1.5">
                            <span>• {stripDiabetesPrefix(note)}</span>
                            {isDiabetesSourced(note) && <DiabetesBadge />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              } else if (agent === "ORACLE") {
                const o = orch.outputs.ORACLE;
                const contributingFactors = o.contributingFactors ?? [];
                summary = o.summary;
                body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      HORIZON · {o.oracleScore} ({o.oracleRisk})
                    </p>
                    <p className="text-sm">{o.summary}</p>
                    {contributingFactors.length > 0 && (
                      <ul className="space-y-1 text-[11px] text-muted" data-testid="oracle-contributing-factors">
                        {contributingFactors.map((factor, idx) => (
                          <li key={idx} className="flex flex-wrap items-center gap-1.5">
                            <span>• {stripDiabetesPrefix(factor)}</span>
                            {isDiabetesSourced(factor) && <DiabetesBadge />}
                          </li>
                        ))}
                      </ul>
                    )}
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

            {result?.diabetesModuleEnabled && result.diabetes && (
              <div
                className="space-y-3 rounded-sm border border-accent/30 bg-accent/5 p-3"
                data-testid="diabetes-module-signals"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Diabetes module signals
                  </p>
                  <DiabetesBadge />
                </div>
                <p className="text-[10px] text-muted">
                  Demo/synthetic-cohort data · draft only, not a diagnosis · already folded into the HORIZON
                  and GUARDIAN Accept/Edit/Reject above (no separate review paradigm) · hitlRequired: true ·
                  ehrWrite: false · autoRetrain: false.
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]">
                    <p className="font-semibold">Glucose</p>
                    <p className="text-muted">
                      {result.diabetes.signals.glucose.limitations[0] ?? "insufficient_data"}
                    </p>
                  </div>

                  <div className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]">
                    <p className="font-semibold">HbA1c</p>
                    <p className="text-muted">
                      {result.diabetes.signals.hba1c.latestValueMmolMol !== null
                        ? `Latest ${formatHbA1c(result.diabetes.signals.hba1c.latestValueMmolMol)} · trend ${result.diabetes.signals.hba1c.trend}`
                        : (result.diabetes.signals.hba1c.limitations[0] ?? "no data on file")}
                    </p>
                  </div>

                  <div
                    className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]"
                    data-testid="diabetes-insulin-signal"
                  >
                    <p className="font-semibold">Insulin — explanatory only</p>
                    <p className="text-muted">{result.diabetes.signals.insulin.regimenSummary}</p>
                    {result.diabetes.signals.insulin.timingObservations.map((note, idx) => (
                      <p key={idx} className="text-muted">
                        • {note}
                      </p>
                    ))}
                    <p className="mt-1 font-medium text-accent">
                      No dose-change recommendation shown — clinician decision only.
                    </p>
                  </div>

                  <div
                    className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]"
                    data-testid="diabetes-glp1-signal"
                  >
                    <p className="font-semibold">GLP-1 — explanatory only</p>
                    {result.diabetes.signals.glp1.sideEffectFlags.length > 0 ? (
                      result.diabetes.signals.glp1.sideEffectFlags.map((flag, idx) => (
                        <p key={idx} className="text-muted">
                          • {flag}
                        </p>
                      ))
                    ) : (
                      <p className="text-muted">No reported side effects on file.</p>
                    )}
                    <p className="mt-1 font-medium text-accent">
                      No prescribing recommendation shown — clinician decision only.
                    </p>
                  </div>
                </div>

                {result.diabetes.signals.complications.some((c) => c.flagLevel !== "none" || (c.missingLabs?.length ?? 0) > 0) && (
                  <div className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]">
                    <p className="font-semibold">Complications</p>
                    <ul className="mt-1 space-y-1">
                      {result.diabetes.signals.complications
                        .filter((c) => c.flagLevel !== "none")
                        .map((c) => (
                          <li key={c.domain} className="flex flex-wrap items-center gap-1.5">
                            <span className="capitalize">{c.domain.replaceAll("_", " ")}:</span>
                            <span
                              className={
                                c.flagLevel === "referral_indicated"
                                  ? "rounded bg-danger/15 px-1 py-0.5 font-semibold uppercase text-danger"
                                  : "rounded bg-warning/15 px-1 py-0.5 font-semibold uppercase text-warning"
                              }
                            >
                              {c.flagLevel.replaceAll("_", " ")}
                            </span>
                            {c.flagLevel === "referral_indicated" && (
                              <span className="text-muted" data-testid={`diabetes-referral-gate-${c.domain}`}>
                                → routes via existing referral_pathway human gate (confirm in case review — no
                                new gate type)
                              </span>
                            )}
                            {c.evidenceRefs.length > 0 && (
                              <span className="w-full text-muted" data-testid={`diabetes-complication-evidence-${c.domain}`}>
                                {c.basis === "laboratory" ? "From laboratory results: " : "Evidence: "}
                                {c.evidenceRefs.join(" · ")}
                              </span>
                            )}
                          </li>
                        ))}
                    </ul>
                    {result.diabetes.signals.complications.some((c) => (c.missingLabs?.length ?? 0) > 0) && (
                      <p className="mt-1 text-warning" data-testid="diabetes-missing-labs">
                        Missing or out of date (not assumed normal):{" "}
                        {[...new Set(result.diabetes.signals.complications.flatMap((c) => c.missingLabs ?? []))].join(" · ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-sm border border-border-subtle bg-card p-2 text-[11px]">
                  <p className="font-semibold">Prevention (rules-based composite, not a physiological twin)</p>
                  <p className="text-muted">Trajectory: {result.diabetes.signals.prevention.riskTrajectoryLabel}</p>
                  {result.diabetes.signals.prevention.personalisedPriorities.map((priority, idx) => (
                    <p key={idx} className="text-muted">
                      • {priority}
                    </p>
                  ))}
                </div>

                {result.diabetes.areaFailures.length > 0 && (
                  <p className="text-[10px] text-warning" data-testid="diabetes-area-failures">
                    Degraded gracefully (fail-open, still visible, not silently dropped):{" "}
                    {result.diabetes.areaFailures.join(", ")}
                  </p>
                )}
              </div>
            )}

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
