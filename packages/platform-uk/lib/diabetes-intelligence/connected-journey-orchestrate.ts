/**
 * INT-01 — cross-phase connected diabetes journey orchestrator.
 *
 * Single sequential path: Patient 360 → glucose → meds → journey care-plan HITL
 * → continuous care → agent intelligence → unified timeline signals.
 * Does not auto-Accept clinical drafts (HITL gates remain). ehrWrite always false.
 */

import { listConditions } from "../patient-intelligence/repository";
import { seedAndBuildPatient360, buildPatient360 } from "../patient-intelligence";
import { getPatientById } from "../mock-data";
import {
  CONNECTED_DEMO_PATIENT_ID,
  CONNECTED_JOURNEY_DISCLOSURE,
  CONNECTED_JOURNEY_STEPS,
  type ConnectedJourneyStepId,
} from "./connected-journey-steps";
import {
  buildDiabetesGlucoseIntelligence,
  seedAndBuildDiabetesGlucoseIntelligence,
} from "./glucose-assemble";
import { listGlucoseSeries } from "./glucose-repository";
import {
  buildMedicationPersonalisedCare,
  seedAndBuildMedicationPersonalisedCare,
} from "./medcare-assemble";
import {
  buildDiabetesJourney,
  draftJourneyCarePlan,
  seedSyntheticJourney,
} from "./journey";
import {
  buildContinuousCare,
  seedAndBuildContinuousCare,
} from "./continuous-care-assemble";
import {
  buildAgentIntelligence,
  runAgentOrchestration,
} from "./agent-intel-assemble";
import { listUnifiedCarePlans } from "./care-plan-facade";
import { buildSharedPatientContextAsync } from "./agent-intel-context";
import type { SharedPatientContext } from "./agent-intel-types";
import type { UnifiedCarePlan } from "./care-plan-facade";

export type ConnectedPipelineStepStatus = "ready" | "seeded" | "pending_hitl" | "empty" | "error";

export type ConnectedPipelineStepResult = {
  stepId: ConnectedJourneyStepId;
  phase: string;
  label: string;
  status: ConnectedPipelineStepStatus;
  summary: string;
  href: string;
  ehrWrite: false;
};

export type ConnectedDiabetesOrchestrationSnapshot = {
  patientId: string;
  patientLabel: string;
  synthetic: true;
  ehrWrite: false;
  hitlRequired: true;
  autonomousPrescribe: false;
  capabilityStatus: "synthetic_demo";
  liveOrganisations: 0;
  disclosure: string;
  sharedContext: SharedPatientContext;
  unifiedCarePlans: UnifiedCarePlan[];
  steps: ConnectedPipelineStepResult[];
  pipelineRunAt: string | null;
  note: string;
};

export type ConnectedPipelineRunResult = ConnectedDiabetesOrchestrationSnapshot & {
  action: "run_pipeline" | "seed_all";
  phasesExecuted: Array<{
    stepId: ConnectedJourneyStepId;
    action: string;
    ok: boolean;
    detail: string;
  }>;
};

function labelFor(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

async function assessSteps(
  patientId: string,
  scopeKey: string
): Promise<ConnectedPipelineStepResult[]> {
  const href = (id: ConnectedJourneyStepId) =>
    CONNECTED_JOURNEY_STEPS.find((s) => s.id === id)!.href(patientId);

  const [
    conditions,
    glucoseSeries,
    glucoseSnap,
    medSnap,
    journeySnap,
    unifiedPlans,
    ccSnap,
    agentSnap,
  ] = await Promise.all([
    listConditions(patientId, { scopeKey }).catch(() => []),
    listGlucoseSeries(patientId, { scopeKey }).catch(() => []),
    buildDiabetesGlucoseIntelligence(patientId, { scopeKey }).catch(() => null),
    buildMedicationPersonalisedCare(patientId, { scopeKey }).catch(() => null),
    buildDiabetesJourney(patientId, { scopeKey }).catch(() => null),
    listUnifiedCarePlans(patientId, { scopeKey }).catch(() => []),
    buildContinuousCare(patientId, { scopeKey }).catch(() => null),
    buildAgentIntelligence(patientId, { scopeKey }).catch(() => null),
  ]);

  const journeyDrafts = unifiedPlans.filter(
    (p) => p.sourceStore === "journey_care_plan" && p.status === "DRAFT"
  );
  const journeyApproved = unifiedPlans.filter(
    (p) => p.sourceStore === "journey_care_plan" && p.status === "APPROVED"
  );
  const medDrafts = (medSnap?.carePlans ?? []).filter((p) => p.status === "DRAFT");
  const glucosePending = (glucoseSnap?.reviews ?? []).filter((r) => r.status === "DRAFT");
  const agentPending = (agentSnap?.drafts ?? []).filter(
    (d) => d.status === "DRAFT" || d.status === "queued"
  );
  const ccEscalations = (ccSnap?.escalationQueue ?? []).filter((e) =>
    /draft|pending|open/i.test(e.status)
  );

  const steps: ConnectedPipelineStepResult[] = [
    {
      stepId: "patient-360",
      phase: "1",
      label: "Patient 360",
      status: conditions.length > 0 ? "ready" : "empty",
      summary:
        conditions.length > 0
          ? `${conditions.length} structured condition(s) on spine`
          : "Not seeded — run pipeline or seed Patient 360",
      href: href("patient-360"),
      ehrWrite: false,
    },
    {
      stepId: "glucose",
      phase: "2",
      label: "Glucose intelligence",
      status:
        glucosePending.length > 0
          ? "pending_hitl"
          : glucoseSeries.length > 0
            ? "ready"
            : "empty",
      summary:
        glucosePending.length > 0
          ? `${glucosePending.length} review(s) awaiting Accept/Edit/Reject`
          : glucoseSeries.length > 0
            ? `${glucoseSeries.length} canonical series reading(s)`
            : "No glucose series — seed glucose intelligence",
      href: href("glucose"),
      ehrWrite: false,
    },
    {
      stepId: "medication",
      phase: "3",
      label: "Medication & care",
      status:
        medDrafts.length > 0
          ? "pending_hitl"
          : (medSnap?.carePlans?.length ?? 0) > 0 || (medSnap?.goals?.length ?? 0) > 0
            ? "ready"
            : "empty",
      summary:
        medDrafts.length > 0
          ? `${medDrafts.length} medcare plan draft(s) awaiting HITL`
          : (medSnap?.goals?.length ?? 0) > 0
            ? `${medSnap!.goals.length} goal(s); ${medSnap!.carePlans.length} plan(s)`
            : "Not seeded — seed medication care",
      href: href("medication"),
      ehrWrite: false,
    },
    {
      stepId: "journey",
      phase: "0",
      label: "Care journey HITL",
      status:
        journeyDrafts.length > 0
          ? "pending_hitl"
          : journeyApproved.length > 0 || (journeySnap?.carePlans.length ?? 0) > 0
            ? "ready"
            : journeySnap && journeySnap.glucose.observations.length > 0
              ? "seeded"
              : "empty",
      summary:
        journeyDrafts.length > 0
          ? `${journeyDrafts.length} journey care-plan draft(s) awaiting HITL`
          : journeyApproved.length > 0
            ? `${journeyApproved.length} approved journey plan(s)`
            : `${unifiedPlans.length} unified plan(s) across journey + medcare stores`,
      href: href("journey"),
      ehrWrite: false,
    },
    {
      stepId: "continuous",
      phase: "4",
      label: "Continuous care",
      status:
        ccEscalations.length > 0
          ? "pending_hitl"
          : (ccSnap?.followUpWorklist?.length ?? 0) > 0
            ? "ready"
            : "empty",
      summary:
        ccEscalations.length > 0
          ? `${ccEscalations.length} escalation(s) awaiting HITL`
          : (ccSnap?.followUpWorklist?.length ?? 0) > 0
            ? `${ccSnap!.followUpWorklist.length} follow-up item(s)`
            : "Not seeded — seed continuous care",
      href: href("continuous"),
      ehrWrite: false,
    },
    {
      stepId: "agent",
      phase: "5",
      label: "Agent intelligence",
      status:
        agentPending.length > 0
          ? "pending_hitl"
          : (agentSnap?.drafts?.length ?? 0) > 0
            ? "ready"
            : "empty",
      summary:
        agentPending.length > 0
          ? `${agentPending.length} AI draft(s) awaiting clinician review`
          : (agentSnap?.drafts?.length ?? 0) > 0
            ? `${agentSnap!.drafts.length} draft(s) on shared context`
            : "No agent drafts — run orchestration",
      href: href("agent"),
      ehrWrite: false,
    },
    {
      stepId: "timeline",
      phase: "—",
      label: "Longitudinal timeline",
      status: "ready",
      summary: "Merged journey + continuous + glucose/medcare/agent events (synthetic)",
      href: href("timeline"),
      ehrWrite: false,
    },
  ];

  return steps;
}

export async function buildConnectedDiabetesOrchestration(
  patientId: string,
  options?: { scopeKey?: string; pipelineRunAt?: string | null }
): Promise<ConnectedDiabetesOrchestrationSnapshot> {
  const scopeKey = options?.scopeKey ?? "shared";
  const sharedContext = await buildSharedPatientContextAsync(patientId, { scopeKey });
  const unifiedCarePlans = await listUnifiedCarePlans(patientId, { scopeKey });
  const steps = await assessSteps(patientId, scopeKey);

  return {
    patientId,
    patientLabel: labelFor(patientId),
    synthetic: true,
    ehrWrite: false,
    hitlRequired: true,
    autonomousPrescribe: false,
    capabilityStatus: "synthetic_demo",
    liveOrganisations: 0,
    disclosure: CONNECTED_JOURNEY_DISCLOSURE,
    sharedContext,
    unifiedCarePlans,
    steps,
    pipelineRunAt: options?.pipelineRunAt ?? null,
    note:
      "Connected diabetes orchestration — sequential synthetic pipeline with shared patient/scope context; HITL gates retained; ehrWrite=false; not clinically validated; LIVE_ORGANISATIONS=0.",
  };
}

/**
 * Walk the connected journey in order. Seeds empty phases only; never auto-accepts HITL.
 */
export async function runConnectedDiabetesPipeline(
  patientId: string,
  options?: { scopeKey?: string; actor?: string; mode?: "seed_all" | "run_pipeline" }
): Promise<ConnectedPipelineRunResult> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "connected-orchestrator";
  const mode = options?.mode ?? "run_pipeline";
  const phasesExecuted: ConnectedPipelineRunResult["phasesExecuted"] = [];

  // 1 Patient 360
  try {
    const conditions = await listConditions(patientId, { scopeKey });
    if (conditions.length === 0 || mode === "seed_all") {
      await seedAndBuildPatient360(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "patient-360",
        action: "seed_synthetic",
        ok: true,
        detail: "Patient 360 spine seeded",
      });
    } else {
      await buildPatient360(patientId, { scopeKey });
      phasesExecuted.push({
        stepId: "patient-360",
        action: "reuse",
        ok: true,
        detail: "Patient 360 already present",
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "patient-360",
      action: "seed_synthetic",
      ok: false,
      detail: err instanceof Error ? err.message : "Patient 360 failed",
    });
  }

  // 2 Glucose (canonical series)
  try {
    const series = await listGlucoseSeries(patientId, { scopeKey });
    if (series.length === 0 || mode === "seed_all") {
      await seedAndBuildDiabetesGlucoseIntelligence(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "glucose",
        action: "seed_synthetic",
        ok: true,
        detail: "Canonical glucose series seeded",
      });
    } else {
      phasesExecuted.push({
        stepId: "glucose",
        action: "reuse",
        ok: true,
        detail: `${series.length} series reading(s) retained`,
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "glucose",
      action: "seed_synthetic",
      ok: false,
      detail: err instanceof Error ? err.message : "Glucose seed failed",
    });
  }

  // 3 Medication & personalised care
  try {
    const med = await buildMedicationPersonalisedCare(patientId, { scopeKey });
    if ((med.goals.length === 0 && med.carePlans.length === 0) || mode === "seed_all") {
      await seedAndBuildMedicationPersonalisedCare(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "medication",
        action: "seed_synthetic",
        ok: true,
        detail: "Medication & care seeded",
      });
    } else {
      phasesExecuted.push({
        stepId: "medication",
        action: "reuse",
        ok: true,
        detail: "Medication & care already present",
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "medication",
      action: "seed_synthetic",
      ok: false,
      detail: err instanceof Error ? err.message : "Medication care failed",
    });
  }

  // 4 Journey seed + care-plan draft (HITL — do not auto-accept)
  try {
    let journey = await buildDiabetesJourney(patientId, { scopeKey });
    if (journey.glucose.observations.length === 0 || mode === "seed_all") {
      journey = await seedSyntheticJourney(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "journey",
        action: "seed_synthetic",
        ok: true,
        detail: "Journey glucose observations bridged to canonical series",
      });
    }
    const hasDraftOrApproved = journey.carePlans.some(
      (p) => p.status === "DRAFT" || p.status === "APPROVED"
    );
    if (!hasDraftOrApproved || mode === "seed_all") {
      journey = await draftJourneyCarePlan(patientId, { scopeKey, createdBy: actor });
      phasesExecuted.push({
        stepId: "journey",
        action: "draft_care_plan",
        ok: true,
        detail: "Journey care-plan DRAFT created — clinician Accept/Edit/Reject required",
      });
    } else {
      phasesExecuted.push({
        stepId: "journey",
        action: "reuse",
        ok: true,
        detail: "Journey care plan already present (HITL untouched)",
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "journey",
      action: "draft_care_plan",
      ok: false,
      detail: err instanceof Error ? err.message : "Journey care plan failed",
    });
  }

  // 5 Continuous care
  try {
    const cc = await buildContinuousCare(patientId, { scopeKey });
    if (cc.followUpWorklist.length === 0 || mode === "seed_all") {
      await seedAndBuildContinuousCare(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "continuous",
        action: "seed_synthetic",
        ok: true,
        detail: "Continuous care seeded",
      });
    } else {
      phasesExecuted.push({
        stepId: "continuous",
        action: "reuse",
        ok: true,
        detail: "Continuous care already present",
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "continuous",
      action: "seed_synthetic",
      ok: false,
      detail: err instanceof Error ? err.message : "Continuous care failed",
    });
  }

  // 6 Agent intelligence (deterministic drafts — HITL required)
  try {
    const agent = await buildAgentIntelligence(patientId, { scopeKey });
    if (agent.drafts.length === 0 || mode === "seed_all") {
      await runAgentOrchestration(patientId, { scopeKey, actor });
      phasesExecuted.push({
        stepId: "agent",
        action: "run_orchestration",
        ok: true,
        detail: "Agent drafts generated over live shared context — HITL required",
      });
    } else {
      phasesExecuted.push({
        stepId: "agent",
        action: "reuse",
        ok: true,
        detail: `${agent.drafts.length} draft(s) retained`,
      });
    }
  } catch (err) {
    phasesExecuted.push({
      stepId: "agent",
      action: "run_orchestration",
      ok: false,
      detail: err instanceof Error ? err.message : "Agent orchestration failed",
    });
  }

  // 7 Timeline is a read merge — mark ready
  phasesExecuted.push({
    stepId: "timeline",
    action: "merge_ready",
    ok: true,
    detail: "Timeline projector includes journey + continuous + glucose/medcare/agent",
  });

  const pipelineRunAt = new Date().toISOString();
  const snapshot = await buildConnectedDiabetesOrchestration(patientId, {
    scopeKey,
    pipelineRunAt,
  });

  return {
    ...snapshot,
    action: mode,
    phasesExecuted,
  };
}

export { CONNECTED_DEMO_PATIENT_ID };
