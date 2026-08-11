/**
 * Phase C clinical-spine intelligence: orchestrate agents + twin ranking + safety route.
 * Reuses clinical-proof orchestration. Honest: ehrWrite:false · physiologicalTwin:false · autoRetrain:false.
 */

import {
  runAgentOrchestration,
  type OrchestrationOptions,
  type OrchestrationResult
} from "@/lib/clinical-proof/agent-orchestration";
import { buildDiabetesRiskContribution, type DiabetesRiskContribution } from "@/lib/disease-modules/diabetes";
import { loadDiabetesPatientStateOverrides } from "@/lib/disease-modules/diabetes/ingest";
import { recordDiabetesDecisionSnapshot } from "@/lib/disease-modules/diabetes/decision-history";
import { isDiabetesModuleEnabled } from "@/lib/integration-config";
import { getPatientById } from "@/lib/mock-data/patients";
import { getOracleModelCard, type OracleModelCard } from "@/lib/precision-health/oracle-model-card";
import { runScenario, type TwinSimulationResult } from "@/lib/precision-health/twin-simulation";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

import { resolveDecision, type DecisionEscalation } from "@/lib/decision";

import { SAFETY_ROUTE_LABELS, type SafetyRoute } from "./safety-route";

export type ClinicalSpineOrchestrateResult = {
  artifactType: "aksh-clinical-spine-orchestrate";
  orchestration: OrchestrationResult;
  safetyRoute: SafetyRoute;
  safetyRouteLabel: string;
  twin: TwinSimulationResult | null;
  modelCard: OracleModelCard;
  /** B3 — Diabetes v1: null unless ENABLE_DIABETES_MODULE=true AND the patient is diabetes-flagged (clinicalProfiles includes "t2d"). Additive only — see FR-DIAB-018/019/022. */
  diabetesModuleEnabled: boolean;
  diabetes: DiabetesRiskContribution | null;
  /** C6 (P1-3) — Decision.escalation for the diabetes contribution; always "none" when `diabetes` is null (non-diabetes patient or module off) — byte-identical to pre-C6 output. */
  diabetesEscalation: DecisionEscalation;
  ehrWrite: false;
  hitlRequired: true;
  physiologicalTwin: false;
  autoRetrain: false;
  liveEmis: false;
  note: string;
};

/**
 * B3 (docs/PHASED_BUILD_PLAN.md): apply the Diabetes module's HORIZON/GUARDIAN
 * contribution additively — never replacing existing CVD/T2D contributing
 * factors or safety notes (FR-DIAB-018/019). Only called when
 * ENABLE_DIABETES_MODULE=true and the patient is diabetes-flagged; when
 * either is false this function is never invoked and orchestration output is
 * byte-identical to pre-B3 behaviour (FR-DIAB-022).
 */
function applyDiabetesContributionAdditively(
  orchestration: OrchestrationResult,
  diabetes: DiabetesRiskContribution
): OrchestrationResult {
  const diabetesFactors = diabetes.horizonContributingFactors.map((factor) => `[Diabetes] ${factor}`);
  const diabetesSafetyFlags = diabetes.guardianSafetyFlags.map((flag) => `[Diabetes] ${flag}`);

  return {
    ...orchestration,
    outputs: {
      ...orchestration.outputs,
      ORACLE: {
        ...orchestration.outputs.ORACLE,
        contributingFactors: [...orchestration.outputs.ORACLE.contributingFactors, ...diabetesFactors]
      },
      GUARDIAN: {
        ...orchestration.outputs.GUARDIAN,
        safetyNotes: [...orchestration.outputs.GUARDIAN.safetyNotes, ...diabetesSafetyFlags]
      }
    }
  };
}

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
  const baseOrchestration = await runAgentOrchestration({
    patientId: input.patientId,
    proposedDrug: input.proposedDrug,
    transcript: input.transcript,
    includeDrAssist: input.includeDrAssist ?? false,
    includeNexus: input.includeNexus !== false,
    agentTimeoutMs: input.agentTimeoutMs,
    overallTimeoutMs: input.overallTimeoutMs
  });

  // --- B3 Diabetes v1 (docs/PHASED_BUILD_PLAN.md) ---
  // Same position existing Knowledge Graph signals occupy: an additional
  // data-gathering step feeding HORIZON/GUARDIAN inputs, BEFORE the
  // deterministic safety-route step below (FR-DIAB-015). Flag-gated; the
  // patient must also be diabetes-flagged (clinicalProfiles includes "t2d")
  // — a non-diabetes patient's orchestration output is byte-identical to
  // pre-B3 behaviour even with the flag on (FR-DIAB-022).
  const diabetesModuleEnabled = isDiabetesModuleEnabled();
  const diabetesFlagged = Boolean(getPatientById(input.patientId)?.clinicalProfiles?.includes("t2d"));
  // C6 (docs/PHASED_BUILD_PLAN_C.md, P1-2): look up any real glucose/HbA1c
  // readings ingested into Patient State for this patient before building
  // the composite. When nothing has been ingested yet (the common case
  // today), loadDiabetesPatientStateOverrides returns an empty `input` and
  // buildDiabetesRiskContribution falls back to the fixture bundle exactly
  // as it did pre-C6 — byte-identical, per P1-2's own regression requirement.
  const diabetesOverrides =
    diabetesModuleEnabled && diabetesFlagged
      ? await loadDiabetesPatientStateOverrides(baseOrchestration.sharedContext.patientId)
      : null;
  const diabetes =
    diabetesModuleEnabled && diabetesFlagged
      ? buildDiabetesRiskContribution(
          {
            patientId: baseOrchestration.sharedContext.patientId,
            patientLabel: baseOrchestration.sharedContext.patientLabel
          },
          diabetesOverrides?.input,
          {
            glucose: diabetesOverrides?.glucoseReadingsSource,
            hba1c: diabetesOverrides?.hba1cReadingsSource
          }
        )
      : null;
  const orchestration = diabetes
    ? applyDiabetesContributionAdditively(baseOrchestration, diabetes)
    : baseOrchestration;

  // C2 (docs/PHASED_BUILD_PLAN_C.md, P0-2) — Decision domain entry point.
  // resolveDecision delegates to the same resolveSafetyRouteFromOrchestration
  // this call site used pre-C2; the route value is byte-identical. C6/P1-3
  // additionally passes the diabetes contribution through for the
  // `escalation` field only — `diabetes` is null for every non-diabetes-
  // flagged patient and for every patient when the module is off, so
  // `escalation` resolves to "none" in both cases, matching pre-C6 output.
  const decision = resolveDecision({ orchestration, diabetes });
  const safetyRoute = decision.route;

  // D4 (docs/PHASED_BUILD_PLAN_D.md): write this run's diabetes Decision
  // outcome back onto Patient State as a durable, queryable fact — only for
  // diabetes-flagged patients with the module enabled (i.e. `diabetes` is
  // non-null); non-diabetes patients and flag-off runs produce zero new
  // facts, byte-identical to pre-D4 behaviour. Fire-and-forget, fail-open:
  // recordDiabetesDecisionSnapshot never throws, and this call is never
  // awaited, so it can never delay or alter the clinician-facing response.
  if (diabetes) {
    void recordDiabetesDecisionSnapshot({
      patientId: baseOrchestration.sharedContext.patientId,
      snapshot: {
        escalation: decision.escalation,
        horizonContributingFactorCount: diabetes.horizonContributingFactors.length,
        guardianSafetyFlagCount: diabetes.guardianSafetyFlags.length,
        areaFailures: diabetes.areaFailures,
        orchestratedAt: new Date().toISOString()
      }
    });
  }

  const twin = includeTwinRanking ? runScenario(input.patientId) : null;
  const modelCard = getOracleModelCard();

  if (twin && (twin.physiologicalTwin !== false || twin.simulationMode !== "synthetic_rules")) {
    throw new Error("Twin honesty check failed — refuse to return physiological twin claim");
  }

  const actor = input.actor ?? "clinical-spine-orchestrate";
  // FR-DIAB-016: every diabetes-module output reaching a clinician is
  // SHIELD-audited exactly like existing agent outputs — reuses this same
  // orchestrate audit event (no new audit table/event schema); the payload
  // below simply names the diabetes contribution when one was applied.
  void persistShieldAuditEvent({
    action: "defer",
    actor,
    label: `SHIELD: clinical spine orchestrate (${orchestration.queuePriority} → ${safetyRoute})`,
    detail: `reviewOrder=${orchestration.reviewOrder.join("→")}; twin=${twin ? "synthetic_rules" : "off"}; HITL required${
      diabetes
        ? `; diabetes module contributed ${diabetes.horizonContributingFactors.length} HORIZON factor(s), ${diabetes.guardianSafetyFlags.length} GUARDIAN flag(s)`
        : ""
    }`,
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
      clinicalOwner: modelCard.clinicalOwner,
      diabetesModuleEnabled,
      diabetesFlagged,
      diabetesContributingFactorCount: diabetes?.horizonContributingFactors.length ?? 0,
      diabetesSafetyFlagCount: diabetes?.guardianSafetyFlags.length ?? 0,
      diabetesAreaFailures: diabetes?.areaFailures ?? [],
      diabetesEscalation: decision.escalation
    }
  });

  return {
    artifactType: "aksh-clinical-spine-orchestrate",
    orchestration,
    safetyRoute,
    safetyRouteLabel: SAFETY_ROUTE_LABELS[safetyRoute].title,
    twin,
    modelCard,
    diabetesModuleEnabled,
    diabetes,
    diabetesEscalation: decision.escalation,
    ehrWrite: false,
    hitlRequired: true,
    physiologicalTwin: false,
    autoRetrain: false,
    liveEmis: false,
    note:
      "Clinical spine Phase C — drafts only. SYNTHESIS→GUARDIAN→HORIZON→NEXUS. GUARDIAN first when urgent. Twin ranking is synthetic_rules. Model card clinical owner may be UNASSIGNED. Zero autonomous EHR write." +
      (diabetesModuleEnabled
        ? " Diabetes module (B3) enabled — additive HORIZON/GUARDIAN contribution only for diabetes-flagged patients; Glucose Intelligence stays insufficient_data pending OQ-DIAB-1."
        : "")
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
    diabetesModule: {
      enabled: isDiabetesModuleEnabled(),
      flag: "ENABLE_DIABETES_MODULE",
      defaultEnabled: false as const,
      glucoseIntelligence: "insufficient_data_pending_OQ-DIAB-1" as const
    },
    note: "One-click SYNTHESIS→GUARDIAN→HORIZON→NEXUS (api ids ORACLE/NEXUS) on clinical spine. Urgent prioritises GUARDIAN. All drafts require HITL."
  };
}
