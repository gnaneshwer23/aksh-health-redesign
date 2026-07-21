/**
 * Phase C clinical-spine intelligence: orchestrate agents + twin ranking + safety route.
 * Reuses clinical-proof orchestration. Honest: ehrWrite:false · physiologicalTwin:false · autoRetrain:false.
 */

import {
  runAgentOrchestration,
  type OrchestrationOptions,
  type OrchestrationResult
} from "@/lib/clinical-proof/agent-orchestration";
import { getOracleModelCard, type OracleModelCard } from "@/lib/precision-health/oracle-model-card";
import { runScenario, type TwinSimulationResult } from "@/lib/precision-health/twin-simulation";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

import {
  resolveSafetyRouteFromOrchestration,
  SAFETY_ROUTE_LABELS,
  type SafetyRoute
} from "./safety-route";

export type ClinicalSpineOrchestrateResult = {
  artifactType: "aksh-clinical-spine-orchestrate";
  orchestration: OrchestrationResult;
  safetyRoute: SafetyRoute;
  safetyRouteLabel: string;
  twin: TwinSimulationResult | null;
  modelCard: OracleModelCard;
  ehrWrite: false;
  hitlRequired: true;
  physiologicalTwin: false;
  autoRetrain: false;
  liveEmis: false;
  note: string;
};

export type ClinicalSpineOrchestrateInput = OrchestrationOptions & {
  /** Run synthetic_rules twin ranking after ORACLE (default true). */
  includeTwinRanking?: boolean;
  actor?: string;
  caseId?: string;
};

export async function runClinicalSpineOrchestrate(
  input: ClinicalSpineOrchestrateInput
): Promise<ClinicalSpineOrchestrateResult> {
  const includeTwinRanking = input.includeTwinRanking !== false;
  const orchestration = await runAgentOrchestration({
    patientId: input.patientId,
    proposedDrug: input.proposedDrug,
    transcript: input.transcript,
    includeDrAssist: input.includeDrAssist ?? false,
    includeNexus: input.includeNexus !== false,
    agentTimeoutMs: input.agentTimeoutMs,
    overallTimeoutMs: input.overallTimeoutMs
  });

  const safetyRoute = resolveSafetyRouteFromOrchestration(orchestration);
  const twin = includeTwinRanking ? runScenario(input.patientId) : null;
  const modelCard = getOracleModelCard();

  if (twin && (twin.physiologicalTwin !== false || twin.simulationMode !== "synthetic_rules")) {
    throw new Error("Twin honesty check failed — refuse to return physiological twin claim");
  }

  const actor = input.actor ?? "clinical-spine-orchestrate";
  void persistShieldAuditEvent({
    action: "defer",
    actor,
    label: `SHIELD: clinical spine orchestrate (${orchestration.queuePriority} → ${safetyRoute})`,
    detail: `reviewOrder=${orchestration.reviewOrder.join("→")}; twin=${twin ? "synthetic_rules" : "off"}; HITL required`,
    category: "system",
    caseId: input.caseId,
    agentLabel: "CONDUCTOR",
    resourceRef: `${orchestration.sharedContext.patientLabel} (${orchestration.sharedContext.patientId})`,
    payload: {
      queuePriority: orchestration.queuePriority,
      reviewOrder: orchestration.reviewOrder,
      safetyRoute,
      ehrWrite: false,
      hitlRequired: true,
      physiologicalTwin: false,
      autoRetrain: false,
      liveEmis: false,
      twinMode: twin?.simulationMode ?? null,
      modelCardId: modelCard.modelId,
      clinicalOwner: modelCard.clinicalOwner
    }
  });

  return {
    artifactType: "aksh-clinical-spine-orchestrate",
    orchestration,
    safetyRoute,
    safetyRouteLabel: SAFETY_ROUTE_LABELS[safetyRoute].title,
    twin,
    modelCard,
    ehrWrite: false,
    hitlRequired: true,
    physiologicalTwin: false,
    autoRetrain: false,
    liveEmis: false,
    note:
      "Clinical spine Phase C — drafts only. SYNTHESIS→GUARDIAN→HORIZON→NEXUS. GUARDIAN first when urgent. Twin ranking is synthetic_rules. Model card clinical owner may be UNASSIGNED. Zero autonomous EHR write."
  };
}

export function getClinicalSpineOrchestrateCapabilities() {
  const modelCard = getOracleModelCard();
  return {
    available: true,
    agents: ["SYNTHESIS", "GUARDIAN", "ORACLE", "NEXUS"] as const,
    twinRanking: true,
    simulationMode: "synthetic_rules" as const,
    physiologicalTwin: false as const,
    ehrWrite: false as const,
    hitlRequired: true as const,
    autoRetrain: false as const,
    liveEmis: false as const,
    modelCard,
    note: "One-click SYNTHESIS→GUARDIAN→HORIZON→NEXUS (api ids ORACLE/NEXUS) on clinical spine. Urgent prioritises GUARDIAN. All drafts require HITL."
  };
}
