/**
 * Synthetic whole-loop orchestrator for the Precision Health Mermaid flowchart.
 *
 * Exercises every major stage in one runnable journey with ruthless honesty:
 * physiologicalTwin:false · liveEmis:false · autoRetrain:false · synthetic modalities.
 *
 * HITL remains real for clinical outputs. Demo mode may offer one-click
 * "demo clinician accept" that still writes SHIELD as a labelled demo actor —
 * never live EMR write-back.
 */

import { z } from "zod";

import { stageAcceptedCaseToBridge } from "@/lib/bridge-staging";
import { runAgentOrchestration, type OrchestrationResult } from "@/lib/clinical-proof/agent-orchestration";
import { getPatientById } from "@/lib/mock-data";
import { checkNeo4jHealth } from "@/lib/neo4j";
import { upsertConsentGrant, listConsentGrants } from "@/lib/repositories/consent-grant-repository";
import { createHealthPlanDraft } from "@/lib/repositories/health-plan-repository";
import { recordLearningEvent } from "@/lib/repositories/learning-event-repository";
import { ingestModalitySampleStub, listModalitySamples } from "@/lib/repositories/modality-sample-repository";
import { readReviewCases } from "@/lib/review-case-repository";

import {
  buildCausalHypothesis,
  type CausalAiResult
} from "./causal-ai";
import {
  buildNutritionCoachingDraft,
  buildSleepCoachingDraft,
  type CoachingDraft
} from "./coaching";
import { MODALITY_IDS, SYNTHETIC_MODALITY_FIXTURES, type ModalityId, type ModalitySample } from "./modalities";
import { runIngestionPipeline, type IngestPipelineResult } from "./ingestion-pipeline";
import { buildPatientTimeline, type PatientTimeline } from "./timeline";
import { runScenario, type TwinSimulationResult } from "./twin-simulation";
import type { HealthPlanDraft } from "./health-plan";
import type { ConnectorId } from "./connectors";
import {
  resolveSafetyRouteFromOrchestration,
  type SafetyRoute
} from "@/lib/clinical-spine/safety-route";

export type { SafetyRoute };

export const WHOLE_LOOP_STAGES = [
  "consent",
  "ingest",
  "validate_timeline",
  "knowledge_graph",
  "agents",
  "twin_simulate",
  "health_plan",
  "safety_route",
  "hitl_staging",
  "learning"
] as const;

export type WholeLoopStageId = (typeof WHOLE_LOOP_STAGES)[number];

export type StageStatus = "pass" | "partial" | "synthetic" | "skipped" | "blocked" | "failed";

export type LoopStageReport = {
  id: WholeLoopStageId;
  label: string;
  status: StageStatus;
  message: string;
  durationMs: number;
  artifacts?: Record<string, unknown>;
};

export type StakeholderGlimpse = {
  id: string;
  label: string;
  href: string;
  note: string;
};

export type LoopHonestyFlags = {
  synthetic: true;
  scaffolding: true;
  physiologicalTwin: false;
  liveEmis: false;
  autoRetrain: false;
  ehrWrite: false;
  hitlRequired: true;
  liveStream: false;
  realPatientData: false;
  demoMode: boolean;
  demoAcceptUsed: boolean;
};

export type LoopRunReport = {
  artifactType: "aksh-precision-health-whole-loop";
  runId: string;
  patientId: string;
  patientLabel: string;
  startedAt: string;
  finishedAt: string;
  elapsedMs: number;
  mode: "authenticated" | "public_demo";
  demoMode: boolean;
  honesty: LoopHonestyFlags;
  stages: LoopStageReport[];
  safetyRoute: SafetyRoute | null;
  hitlGate: {
    status: "pending" | "demo_accepted" | "accepted" | "skipped_awaiting_clinician";
    message: string;
    demoActor: string | null;
  };
  artifacts: {
    consentGrantIds: string[];
    ingestedSampleIds: string[];
    timelineEventCount: number;
    kg: { attempted: boolean; applied: boolean; mode: string; nodesTouched: number };
    orchestration: OrchestrationResult | null;
    coaching: CoachingDraft[];
    causal: CausalAiResult | null;
    twin: TwinSimulationResult | null;
    plan: HealthPlanDraft | null;
    staging: {
      stagingEntryId: string | null;
      simWriteId: string | null;
      fhirResourceCount: number;
      liveEmis: false;
    } | null;
    learningEventId: string | null;
  };
  stakeholderGlimpses: StakeholderGlimpse[];
  partnerGaps: string[];
};

export const wholeLoopRequestSchema = z.object({
  patientId: z.string().min(1).default("P001"),
  /** When true, one-click demo clinician accept stages FHIR + SHIELD as labelled demo actor. */
  demoAccept: z.boolean().optional().default(false),
  /** Public demo path — P001 only, synthetic-only. */
  publicDemo: z.boolean().optional().default(false),
  includeCausal: z.boolean().optional().default(true),
  includeCoaching: z.boolean().optional().default(true),
  updateKg: z.boolean().optional().default(true)
});

export type WholeLoopRequest = z.infer<typeof wholeLoopRequestSchema>;

export type WholeLoopCapabilities = {
  available: true;
  stages: typeof WHOLE_LOOP_STAGES;
  publicDemoPatientId: "P001";
  honesty: Omit<LoopHonestyFlags, "demoMode" | "demoAcceptUsed"> & {
    note: string;
  };
  partnerGaps: string[];
  stakeholderGlimpsesTemplate: StakeholderGlimpse[];
};

const DEMO_PUBLIC_PATIENT = "P001";
const DEMO_ACTOR = "demo-clinician@aksh.health (demo accept — not a live EMR actor)";

const CONNECTOR_INGEST_PLAN: Array<{ connectorId: ConnectorId; purposeCode: "care_delivery" }> = [
  { connectorId: "wearable_synthetic_stream", purposeCode: "care_delivery" },
  { connectorId: "lifestyle_diary", purposeCode: "care_delivery" },
  { connectorId: "imaging_dicom_meta_stub", purposeCode: "care_delivery" },
  { connectorId: "omics_panel_stub", purposeCode: "care_delivery" },
  { connectorId: "environment_openweather_stub", purposeCode: "care_delivery" }
];

const PARTNER_GAPS = [
  "Live wearable / Fitbit streams — partner OAuth + DPIA (connectors are synthetic/stub)",
  "DICOM / PACS pixel archive — imaging_meta stubs only (dicomPresent:false)",
  "Multi-omics sequencing pipeline — panel meta stubs only (rawOmicsPresent:false)",
  "Live EMIS / SystmOne write-back — Partner API + CSO sign-off (liveEmis:false)",
  "MHRA-approved CDS / physiological digital twin validation study",
  "Auto-retrain from RWE — governed release only (autoRetrain:false)"
];

function remapFixtureToPatient(fixture: ModalitySample, patientId: string): ModalitySample {
  return { ...fixture, patientId } as ModalitySample;
}

function buildStakeholderGlimpses(patientId: string): StakeholderGlimpse[] {
  return [
    {
      id: "patient_coaching",
      label: "Patient coaching",
      href: `/dashboard/patient?patientId=${encodeURIComponent(patientId)}`,
      note: "Wellness coaching drafts — not clinical advice"
    },
    {
      id: "gp_review",
      label: "GP clinical review",
      href: `/dashboard/gp/patients/${encodeURIComponent(patientId)}`,
      note: "Risk state, plan draft, HITL queue"
    },
    {
      id: "pharmacy_guardian",
      label: "Pharmacy GUARDIAN",
      href: `/dashboard/pharmacist`,
      note: "Med safety drafts — HITL before staging"
    },
    {
      id: "ics_equity",
      label: "ICS equity overlay",
      href: `/dashboard/ics/equity`,
      note: "Aggregate synthetic EQUITY — not live population feed"
    },
    {
      id: "researcher_federated",
      label: "Researcher federated stub",
      href: `/dashboard/researcher`,
      note: "Ethics-gated federated jobs — synthetic aggregates"
    },
    {
      id: "admin_ph_status",
      label: "Admin Precision Health status",
      href: `/dashboard/admin/precision-health`,
      note: "Honesty flags: physiologicalTwin / liveEmis / connectors"
    }
  ];
}

export function getWholeLoopCapabilities(): WholeLoopCapabilities {
  return {
    available: true,
    stages: WHOLE_LOOP_STAGES,
    publicDemoPatientId: DEMO_PUBLIC_PATIENT,
    honesty: {
      synthetic: true,
      scaffolding: true,
      physiologicalTwin: false,
      liveEmis: false,
      autoRetrain: false,
      ehrWrite: false,
      hitlRequired: true,
      liveStream: false,
      realPatientData: false,
      note:
        "Whole-loop demo is a synthetic closed rehearsal of the Precision Health flowchart. Not a living twin, not live EMR, not MHRA-approved CDS."
    },
    partnerGaps: PARTNER_GAPS,
    stakeholderGlimpsesTemplate: buildStakeholderGlimpses(DEMO_PUBLIC_PATIENT)
  };
}

function resolveSafetyRoute(
  orchestration: OrchestrationResult | null,
  ingestedCount: number,
  expectedModalities: number
): SafetyRoute {
  return resolveSafetyRouteFromOrchestration(orchestration, {
    ingestedCount,
    expectedModalities
  });
}

async function stageDemoHitlAccept(options: {
  caseId: string;
  patientId: string;
  patientLabel: string;
  planId: string;
  actor: string;
}): Promise<{
  stagingEntryId: string;
  bridgeStagingId: string;
  simWriteId: string;
  fhirResourceCount: number;
  liveEmis: false;
}> {
  const result = await stageAcceptedCaseToBridge({
    caseId: options.caseId,
    acceptedBy: options.actor,
    clinicianId: "demo-loop-clinician",
    scopeKey: "shared",
    runSimWriteback: true
  });

  if (!result.simWriteId) {
    throw new Error(
      `Demo sim write failed for ${options.patientLabel} (${options.patientId}) plan=${options.planId}`
    );
  }

  return {
    stagingEntryId: result.emisStagingEntryId,
    bridgeStagingId: result.bridgeRecord.id,
    simWriteId: result.simWriteId,
    fhirResourceCount: result.fhirResourceCount,
    liveEmis: false
  };
}

/**
 * Run the synthetic Precision Health whole loop for one patient.
 */
export async function runWholeLoop(
  raw: unknown,
  options: {
    scopeKey: string;
    actor: string;
    mode: "authenticated" | "public_demo";
  }
): Promise<LoopRunReport> {
  const input = wholeLoopRequestSchema.parse(raw);
  const startedAt = new Date().toISOString();
  const wallStart = Date.now();
  const runId = `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (options.mode === "public_demo" || input.publicDemo) {
    if (input.patientId !== DEMO_PUBLIC_PATIENT) {
      throw new Error(`Public demo mode allows ${DEMO_PUBLIC_PATIENT} only (synthetic).`);
    }
  }

  const patient = getPatientById(input.patientId);
  if (!patient) {
    throw new Error(`Unknown patient: ${input.patientId}`);
  }

  const demoMode = options.mode === "public_demo" || Boolean(input.publicDemo);
  /** Explicit opt-in only — never silent auto-accept. Always labelled as demo actor when used. */
  const demoAccept = Boolean(input.demoAccept);
  const actor = demoAccept ? DEMO_ACTOR : options.actor;
  const stages: LoopStageReport[] = [];

  const artifacts: LoopRunReport["artifacts"] = {
    consentGrantIds: [],
    ingestedSampleIds: [],
    timelineEventCount: 0,
    kg: { attempted: false, applied: false, mode: "skipped", nodesTouched: 0 },
    orchestration: null,
    coaching: [],
    causal: null,
    twin: null,
    plan: null,
    staging: null,
    learningEventId: null
  };

  let safetyRoute: SafetyRoute | null = null;
  let hitlGate: LoopRunReport["hitlGate"] = {
    status: "pending",
    message: "Clinical outputs require HITL Accept before staging.",
    demoActor: null
  };

  // --- 1. Consent ---
  {
    const t0 = Date.now();
    try {
      const careGrant = await upsertConsentGrant(
        {
          patientId: input.patientId,
          purposeCode: "care_delivery",
          modalities: [...MODALITY_IDS],
          grantedBy: actor,
          notes: `Whole-loop synthetic consent · run=${runId}`
        },
        { scopeKey: options.scopeKey, actor }
      );
      const coachingGrant = await upsertConsentGrant(
        {
          patientId: input.patientId,
          purposeCode: "coaching_wellness",
          modalities: ["lifestyle", "wearable"],
          grantedBy: actor,
          notes: `Whole-loop coaching consent · run=${runId}`
        },
        { scopeKey: options.scopeKey, actor }
      );
      artifacts.consentGrantIds = [careGrant.grant.id, coachingGrant.grant.id];
      stages.push({
        id: "consent",
        label: "Consent & permissions",
        status: "pass",
        message: `Active grants for care_delivery (${MODALITY_IDS.length} modalities) + coaching_wellness. ehrWrite:false.`,
        durationMs: Date.now() - t0,
        artifacts: { grantIds: artifacts.consentGrantIds }
      });
    } catch (error) {
      stages.push({
        id: "consent",
        label: "Consent & permissions",
        status: "failed",
        message: error instanceof Error ? error.message : "Consent stage failed",
        durationMs: Date.now() - t0
      });
      return finishReport();
    }
  }

  // --- 2. Ingest multimodal synthetic samples ---
  {
    const t0 = Date.now();
    const ingestResults: IngestPipelineResult[] = [];
    let kgApplied = 0;
    let kgAttempted = false;
    let kgMode = "skipped";
    let kgNodes = 0;

    for (const step of CONNECTOR_INGEST_PLAN) {
      const result = await runIngestionPipeline(
        {
          connectorId: step.connectorId,
          purposeCode: step.purposeCode,
          patientId: input.patientId,
          updateKg: input.updateKg !== false
        },
        { scopeKey: options.scopeKey, actor }
      );
      ingestResults.push(result);
      if (result.accepted && result.sample) {
        artifacts.ingestedSampleIds.push(result.sample.id);
      }
      if (result.kg.attempted) {
        kgAttempted = true;
        kgMode = result.kg.mode;
        if (result.kg.applied) {
          kgApplied += 1;
          kgNodes += result.kg.nodesTouched;
        }
      }
    }

    // Clinical + lab fixtures (no dedicated connector — direct stub ingest)
    const clinicalFixture =
      SYNTHETIC_MODALITY_FIXTURES.find((f) => f.modality === "clinical") ??
      ({
        modality: "clinical" as const,
        patientId: input.patientId,
        recordedAt: new Date().toISOString(),
        conditions: patient.activeConditions ?? [],
        medications: patient.activeMedications ?? [],
        allergies: patient.allergies ?? [],
        summary: "Synthetic clinical fixture for whole-loop",
        provenance: {
          source: "synthetic_fixture" as const,
          liveStream: false as const,
          realPatientData: false as const
        }
      });
    const labFixture =
      SYNTHETIC_MODALITY_FIXTURES.find((f) => f.modality === "lab") ??
      ({
        modality: "lab" as const,
        patientId: input.patientId,
        recordedAt: new Date().toISOString(),
        tests: [{ codeText: "eGFR", valueText: "unknown", interpretation: "unknown" as const }],
        summary: "Synthetic lab fixture for whole-loop",
        provenance: {
          source: "synthetic_fixture" as const,
          liveStream: false as const,
          realPatientData: false as const
        }
      });

    for (const fixture of [clinicalFixture, labFixture]) {
      const remapped = remapFixtureToPatient(fixture, input.patientId);
      const storeResult = await ingestModalitySampleStub(remapped, {
        scopeKey: options.scopeKey,
        purposeCode: "care_delivery"
      });
      if (storeResult.accepted && storeResult.sample) {
        artifacts.ingestedSampleIds.push(storeResult.sample.id);
      }
    }

    artifacts.kg = {
      attempted: kgAttempted,
      applied: kgApplied > 0,
      mode: kgMode,
      nodesTouched: kgNodes
    };

    const accepted = ingestResults.filter((r) => r.accepted).length;
    stages.push({
      id: "ingest",
      label: "Multimodal ingest (synthetic)",
      status: "synthetic",
      message: `Stored ${artifacts.ingestedSampleIds.length} synthetic samples (connectors accepted ${accepted}/${CONNECTOR_INGEST_PLAN.length} + clinical/lab fixtures). liveStream:false.`,
      durationMs: Date.now() - t0,
      artifacts: {
        sampleIds: artifacts.ingestedSampleIds,
        connectorResults: ingestResults.map((r) => ({
          connectorId: r.connectorId,
          accepted: r.accepted,
          liveStream: r.liveStream,
          kgMode: r.kg.mode
        }))
      }
    });
  }

  // --- 3. Validate + timeline ---
  {
    const t0 = Date.now();
    const [samples, grants, cases] = await Promise.all([
      listModalitySamples({ scopeKey: options.scopeKey, patientId: input.patientId }),
      listConsentGrants({ scopeKey: options.scopeKey, patientId: input.patientId }),
      readReviewCases(options.scopeKey).catch(() => [])
    ]);
    const timeline: PatientTimeline = buildPatientTimeline({
      patientId: input.patientId,
      patientLabelHint: patient.name,
      cases,
      modalitySamples: samples,
      consentGrants: grants,
      learningEvents: []
    });
    artifacts.timelineEventCount = timeline.eventCount;
    stages.push({
      id: "validate_timeline",
      label: "Validate / standardise / timeline",
      status: "partial",
      message: `Zod-validated samples merged into patient timeline (${timeline.eventCount} events). Not a production ETL.`,
      durationMs: Date.now() - t0,
      artifacts: { eventCount: timeline.eventCount, note: timeline.note }
    });
  }

  // --- 4. Knowledge graph honesty probe ---
  {
    const t0 = Date.now();
    let neoMode = "mock";
    try {
      const health = await checkNeo4jHealth();
      neoMode = health.mode;
    } catch {
      neoMode = "unavailable";
    }
    const status: StageStatus =
      artifacts.kg.applied && neoMode === "live" ? "pass" : artifacts.kg.attempted ? "partial" : "synthetic";
    stages.push({
      id: "knowledge_graph",
      label: "Living Health Web (Neo4j)",
      status,
      message: artifacts.kg.applied
        ? `MEASURED Observation MERGE applied (mode=${artifacts.kg.mode}, nodes=${artifacts.kg.nodesTouched}). Neo4j probe=${neoMode}.`
        : `KG update skipped or mock (mode=${artifacts.kg.mode}). Neo4j probe=${neoMode}. Synthetic cohort graph only.`,
      durationMs: Date.now() - t0,
      artifacts: { ...artifacts.kg, neo4jProbe: neoMode }
    });
  }

  // --- 5. Agents ---
  {
    const t0 = Date.now();
    try {
      const orchestration = await runAgentOrchestration({
        patientId: input.patientId,
        includeDrAssist: false,
        agentTimeoutMs: 8_000,
        overallTimeoutMs: 25_000
      });
      artifacts.orchestration = orchestration;

      if (input.includeCoaching !== false) {
        artifacts.coaching = [
          buildNutritionCoachingDraft({
            patientId: input.patientId,
            patientLabel: patient.name
          }),
          buildSleepCoachingDraft({
            patientId: input.patientId,
            patientLabel: patient.name
          })
        ];
      }

      if (input.includeCausal !== false) {
        artifacts.causal = buildCausalHypothesis({ patientId: input.patientId });
      }

      stages.push({
        id: "agents",
        label: "AI agents (SYNTHESIS · GUARDIAN · ORACLE · coaching · causal)",
        status: "partial",
        message: `Orchestration ${orchestration.queuePriority}; reviewOrder=${orchestration.reviewOrder.join("→")}. Coaching=${artifacts.coaching.length}; causal=${artifacts.causal ? "stub" : "off"}. Drafts ≠ records.`,
        durationMs: Date.now() - t0,
        artifacts: {
          queuePriority: orchestration.queuePriority,
          reviewOrder: orchestration.reviewOrder,
          evidence: orchestration.evidence,
          coachingAgents: artifacts.coaching.map((c) => c.agentId),
          causalDrivers: artifacts.causal?.hypothesizedDrivers?.length ?? 0
        }
      });
    } catch (error) {
      stages.push({
        id: "agents",
        label: "AI agents (SYNTHESIS · GUARDIAN · ORACLE · coaching · causal)",
        status: "failed",
        message: error instanceof Error ? error.message : "Agent orchestration failed",
        durationMs: Date.now() - t0
      });
    }
  }

  // --- 6. Twin simulate ---
  {
    const t0 = Date.now();
    const twin = runScenario(input.patientId);
    artifacts.twin = twin;
    stages.push({
      id: "twin_simulate",
      label: "Twin scenario ranking (synthetic_rules)",
      status: "synthetic",
      message: `Ranked ${twin.options.length} interventions. physiologicalTwin:false · simulationMode:synthetic_rules.`,
      durationMs: Date.now() - t0,
      artifacts: {
        topIntervention: twin.options[0]?.interventionId ?? null,
        physiologicalTwin: false,
        simulationMode: twin.simulationMode
      }
    });
  }

  // --- 7. Health plan DRAFT ---
  {
    const t0 = Date.now();
    const topScenario = artifacts.twin?.options[0];
    const plan = await createHealthPlanDraft(
      {
        patientId: input.patientId,
        patientLabel: patient.name,
        createdBy: actor,
        trigger: "risk_state_review",
        conditions: patient.activeConditions,
        medications: patient.activeMedications,
        riskSignals: [
          ...(patient.digitalTwinPrediction?.deteriorationSignals ?? []).slice(0, 3),
          topScenario
            ? `Top synthetic scenario: ${topScenario.label} (rank ${topScenario.rank})`
            : "No scenario ranking available"
        ],
        caseId: runId
      },
      { scopeKey: options.scopeKey }
    );
    artifacts.plan = plan;
    stages.push({
      id: "health_plan",
      label: "Personalised health plan (DRAFT)",
      status: "synthetic",
      message: `Plan ${plan.id} status=DRAFT · hitlRequired:true · ehrWrite:false · physiologicalTwin:false.`,
      durationMs: Date.now() - t0,
      artifacts: { planId: plan.id, sections: plan.sections.map((s) => s.id) }
    });
  }

  // --- 8. Safety route ---
  {
    const t0 = Date.now();
    const modalityCoverage = new Set(
      (await listModalitySamples({ scopeKey: options.scopeKey, patientId: input.patientId })).map(
        (s) => s.modality as ModalityId
      )
    );
    safetyRoute = resolveSafetyRoute(
      artifacts.orchestration,
      artifacts.ingestedSampleIds.length,
      MODALITY_IDS.length
    );
    // Prefer request_more_data when coverage is thin even if agents ran
    if (modalityCoverage.size < 4 && safetyRoute === "low_risk_coaching") {
      safetyRoute = "request_more_data";
    }
    stages.push({
      id: "safety_route",
      label: "Clinical safety / HITL branching",
      status: "pass",
      message: `Routed to ${safetyRoute}. Zero autonomous EHR write.`,
      durationMs: Date.now() - t0,
      artifacts: {
        safetyRoute,
        modalityCoverage: [...modalityCoverage],
        queuePriority: artifacts.orchestration?.queuePriority ?? null
      }
    });
  }

  // --- 9. HITL staging (demo accept only when explicitly requested) ---
  {
    const t0 = Date.now();
    if (demoAccept && artifacts.plan) {
      try {
        const staging = await stageDemoHitlAccept({
          caseId: runId,
          patientId: input.patientId,
          patientLabel: patient.name,
          planId: artifacts.plan.id,
          actor: DEMO_ACTOR
        });
        artifacts.staging = staging;
        hitlGate = {
          status: "demo_accepted",
          message:
            "Demo clinician Accept used — FHIR-shaped staging + SHIELD + sim write only. liveEmis:false. Not a live EMR write.",
          demoActor: DEMO_ACTOR
        };
        stages.push({
          id: "hitl_staging",
          label: "HITL Accept → FHIR stage → sim write",
          status: "partial",
          message: `Demo accept staged ${staging.fhirResourceCount} resources; simWrite=${staging.simWriteId}. liveEmis:false.`,
          durationMs: Date.now() - t0,
          artifacts: staging
        });
      } catch (error) {
        hitlGate = {
          status: "pending",
          message: error instanceof Error ? error.message : "Demo accept failed",
          demoActor: DEMO_ACTOR
        };
        stages.push({
          id: "hitl_staging",
          label: "HITL Accept → FHIR stage → sim write",
          status: "failed",
          message: hitlGate.message,
          durationMs: Date.now() - t0
        });
      }
    } else {
      hitlGate = {
        status: "skipped_awaiting_clinician",
        message:
          "HITL gate open — clinical outputs remain DRAFT until a clinician Accepts (or enable demoAccept in loop demo mode).",
        demoActor: null
      };
      stages.push({
        id: "hitl_staging",
        label: "HITL Accept → FHIR stage → sim write",
        status: "blocked",
        message: hitlGate.message,
        durationMs: Date.now() - t0,
        artifacts: { awaitingHitl: true, liveEmis: false }
      });
    }
  }

  // --- 10. Learning event ---
  {
    const t0 = Date.now();
    const decision =
      hitlGate.status === "demo_accepted" || hitlGate.status === "accepted" ? "accept" : "defer";
    const { event } = await recordLearningEvent(
      {
        patientId: input.patientId,
        caseId: runId,
        agentLabel: "WHOLE_LOOP",
        predictionId: artifacts.plan?.id ?? runId,
        predictionSummary: `Whole-loop plan draft for ${patient.name}; route=${safetyRoute}`,
        modelVersion: "whole-loop-synthetic-v0",
        decision,
        decisionActor: actor,
        decisionNotes:
          decision === "accept"
            ? "Demo/clinician Accept recorded — sim staging only; autoRetrain:false"
            : "Deferred pending real clinician HITL",
        outcomeKind: decision === "accept" ? "follow_up_scheduled" : "unknown"
      },
      { scopeKey: options.scopeKey }
    );
    artifacts.learningEventId = event.id;
    stages.push({
      id: "learning",
      label: "Learning recorder (no auto-retrain)",
      status: "pass",
      message: `Learning event ${event.id} decision=${decision}. autoRetrainTriggered:false · modelUpdated:false.`,
      durationMs: Date.now() - t0,
      artifacts: {
        learningEventId: event.id,
        decision,
        autoRetrainTriggered: false
      }
    });
  }

  return finishReport();

  function finishReport(): LoopRunReport {
    const finishedAt = new Date().toISOString();
    return {
      artifactType: "aksh-precision-health-whole-loop",
      runId,
      patientId: input.patientId,
      patientLabel: patient?.name ?? input.patientId,
      startedAt,
      finishedAt,
      elapsedMs: Date.now() - wallStart,
      mode: options.mode,
      demoMode,
      honesty: {
        synthetic: true,
        scaffolding: true,
        physiologicalTwin: false,
        liveEmis: false,
        autoRetrain: false,
        ehrWrite: false,
        hitlRequired: true,
        liveStream: false,
        realPatientData: false,
        demoMode,
        demoAcceptUsed: demoAccept
      },
      stages,
      safetyRoute,
      hitlGate,
      artifacts,
      stakeholderGlimpses: buildStakeholderGlimpses(input.patientId),
      partnerGaps: PARTNER_GAPS
    };
  }
}
