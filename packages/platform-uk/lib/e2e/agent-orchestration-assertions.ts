/**
 * Agent orchestration assertions for E2E golden scenarios (Stage 6).
 * Validates structured multi-agent outputs against frozen-architecture invariants.
 */

import type { OrchestrationResult } from "../clinical-proof/agent-orchestration";
import { resolveDecision } from "../decision";
import { getPatientById } from "../mock-data/patients";
import type { SafetyRoute } from "../clinical-spine/safety-route";
import { deriveSafetyFlags } from "../workflow/safety";
import type { GoldenScenario, GoldenDecisionExpectation, GoldenSafetyExpectation } from "./golden-scenarios";
import type { E2EPatientProfile } from "./types";

export type AgentOrchestrationAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/** Penicillin ↔ beta-lactam conflict — mirrors lib/workflow/safety.ts. */
export function detectAllergyConflict(allergies: string[], proposedDrug: string): boolean {
  const medication = normalize(proposedDrug);
  return allergies.some(
    (allergy) =>
      medication.includes(normalize(allergy)) ||
      (normalize(allergy).includes("penicillin") && medication.includes("amoxicillin"))
  );
}

export function safetyRoutesForGoldenDecision(
  decision: GoldenDecisionExpectation | GoldenSafetyExpectation
): SafetyRoute[] {
  switch (decision) {
    case "OBSERVE":
      return ["low_risk_coaching"];
    case "ACQUIRE_DATA":
      return ["request_more_data"];
    case "ESCALATE":
    case "REQUEST_APPROVAL":
      return ["clinical_review_queue", "urgent_flag"];
    case "BLOCKED":
      return ["urgent_flag", "clinical_review_queue"];
    default:
      return ["clinical_review_queue", "urgent_flag"];
  }
}

export function assertOrchestrationInvariants(
  result: OrchestrationResult
): string[] {
  const errors: string[] = [];

  if (result.ehrWrite !== false) errors.push("ehrWrite must be false");
  if (result.hitlRequired !== true) errors.push("hitlRequired must be true");
  if (result.timedOut) errors.push("orchestration must not time out");
  if (!result.sharedContext.patientId) errors.push("sharedContext.patientId missing");

  const slots = new Set(result.outputSlots);
  for (const required of ["SYNTHESIS", "GUARDIAN", "ORACLE", "NEXUS"] as const) {
    if (!slots.has(required)) errors.push(`missing output slot ${required}`);
  }

  if (!result.evidence.every((e) => e.evidenced)) {
    errors.push(
      `independent evidence missing: ${result.evidence
        .filter((e) => !e.evidenced)
        .map((e) => e.agent)
        .join(", ")}`
    );
  }

  if (result.queuePriority === "Urgent" && result.reviewOrder[0] !== "GUARDIAN") {
    errors.push("Urgent orchestration must prioritise GUARDIAN first");
  }

  if (result.outputs.NEXUS && result.outputs.NEXUS.status !== "draft") {
    errors.push("NEXUS must remain draft-only");
  }

  const refs = [
    result.outputs.SYNTHESIS,
    result.outputs.GUARDIAN,
    result.outputs.ORACLE,
    result.outputs.NEXUS,
    result.outputs.DrASSIST,
  ].filter(Boolean);
  if (new Set(refs).size !== refs.length) {
    errors.push("agent outputs must not share object references");
  }

  return errors;
}

export function assertAllAgentsDeterministic(result: OrchestrationResult): string[] {
  const errors: string[] = [];
  const modes: Array<{ agent: string; mode?: string }> = [
    { agent: "SYNTHESIS", mode: result.outputs.SYNTHESIS.mode },
    { agent: "GUARDIAN", mode: result.outputs.GUARDIAN.mode },
    { agent: "ORACLE", mode: result.outputs.ORACLE.mode },
    { agent: "NEXUS", mode: result.outputs.NEXUS?.mode },
    { agent: "DrASSIST", mode: result.outputs.DrASSIST?.mode },
  ];

  for (const { agent, mode } of modes) {
    if (mode && mode !== "deterministic") {
      errors.push(`${agent} mode must be deterministic when LLM disabled (got ${mode})`);
    }
  }

  return errors;
}

export function assertGoldenScenario0007(
  result: OrchestrationResult,
  generatorPatient: E2EPatientProfile
): AgentOrchestrationAssertionResult {
  const errors = [
    ...assertOrchestrationInvariants(result),
    ...(generatorPatient.cohortId !== "G"
      ? [`generator patient must be cohort G (got ${generatorPatient.cohortId})`]
      : []),
  ];

  const patient = getPatientById(result.sharedContext.patientId);
  if (!patient) {
    errors.push(`unknown demo patient ${result.sharedContext.patientId}`);
  } else {
    if (patient.activeMedications.length < 5) {
      errors.push("multimorbidity fixture expects polypharmacy (≥5 active medicines)");
    }
    if (!["High", "VeryHigh"].includes(patient.oracleRisk)) {
      errors.push(`oracle risk expected High/VeryHigh for complex case (got ${patient.oracleRisk})`);
    }
  }

  if (!["High", "VeryHigh"].includes(result.outputs.ORACLE.oracleRisk)) {
    errors.push(`ORACLE risk expected High/VeryHigh (got ${result.outputs.ORACLE.oracleRisk})`);
  }

  const guardian = result.outputs.GUARDIAN;
  const medCount = patient?.activeMedications.length ?? 0;
  const hasSafetySignal =
    guardian.overallStatus !== "green" ||
    guardian.interactions.length > 0 ||
    result.outputs.ORACLE.oracleRisk === "VeryHigh" ||
    medCount >= 5;
  if (!hasSafetySignal) {
    errors.push(
      "multimorbidity case must surface GUARDIAN severity, DDI, VeryHigh ORACLE, or polypharmacy (≥5 meds)"
    );
  }

  const nexusCorrelations = result.outputs.NEXUS?.correlations.length ?? 0;
  if (nexusCorrelations < 1) {
    errors.push("NEXUS must emit at least one correlation for multimorbidity reasoning");
  }

  if (result.queuePriority === "Normal") {
    errors.push("complex multimorbidity must not queue as Normal priority");
  }

  const decision = resolveDecision({ orchestration: result });
  if (!safetyRoutesForGoldenDecision("REQUEST_APPROVAL").includes(decision.route)) {
    errors.push(`decision route ${decision.route} incompatible with REQUEST_APPROVAL`);
  }

  return { scenarioId: "AKSH-E2E-0007", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0011(input: {
  patientId: string;
  proposedDrug: string;
  orchestration: OrchestrationResult;
}): AgentOrchestrationAssertionResult {
  const errors = [...assertOrchestrationInvariants(input.orchestration)];
  const patient = getPatientById(input.patientId);

  if (!patient) {
    errors.push(`unknown patient ${input.patientId}`);
  } else if (!detectAllergyConflict(patient.allergies, input.proposedDrug)) {
    errors.push(
      `fixture must document allergy conflict for ${input.proposedDrug} (allergies: ${patient.allergies.join(", ")})`
    );
  }

  const allergyFlags = deriveSafetyFlags({
    id: "e2e-allergy-proof",
    userId: "e2e-test",
    patientId: input.patientId,
    patientLabel: patient?.name ?? input.patientId,
    status: "pending_review",
    updatedAt: new Date().toISOString(),
    summary: "E2E allergy safety proof",
    input: {
      sourceType: "note",
      capturedAt: new Date().toISOString(),
      summary: `Proposed ${input.proposedDrug}`,
      transcriptConfidence: 0.95,
    },
    safetyContext: {
      allergies: patient?.allergies ?? [],
      currentMedications: patient?.activeMedications ?? [],
    },
    draft: {
      encounter: {
        resourceType: "Encounter",
        id: "enc-e2e-allergy",
        className: "consultation",
        reason: "Medication review",
        clinicianSummary: "Allergy block rehearsal",
      },
      condition: {
        resourceType: "Condition",
        id: "cond-e2e-allergy",
        codeText: "Chest infection",
        clinicalStatus: "provisional",
        evidence: "Synthetic E2E",
      },
      medicationRequest: {
        resourceType: "MedicationRequest",
        id: "med-e2e-allergy",
        medicationText: input.proposedDrug,
        dosageInstruction: "500mg TDS",
        reason: "Infection",
        confidence: 0.9,
      },
      observations: [],
    },
    auditEvents: [],
  }).filter((f) => f.id.endsWith("-allergy"));

  if (allergyFlags.length === 0) {
    errors.push("workflow safety layer must flag beta-lactam vs penicillin allergy");
  }

  const decision = resolveDecision({ orchestration: input.orchestration });
  if (!safetyRoutesForGoldenDecision("BLOCKED").includes(decision.route)) {
    errors.push(`decision route ${decision.route} incompatible with BLOCKED safety path`);
  }

  if (input.orchestration.queuePriority === "Normal" && decision.route === "low_risk_coaching") {
    errors.push("allergy block scenario must not route to low-risk coaching only");
  }

  return { scenarioId: "AKSH-E2E-0011", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0019(
  result: OrchestrationResult,
  options?: { priorFactCount?: number; afterFactCount?: number }
): AgentOrchestrationAssertionResult {
  const errors = [
    ...assertOrchestrationInvariants(result),
    ...assertAllAgentsDeterministic(result),
  ];

  if (
    options?.priorFactCount !== undefined &&
    options?.afterFactCount !== undefined &&
    options.afterFactCount < options.priorFactCount
  ) {
    errors.push("patient state fact count must not decrease after LLM-failure orchestration");
  }

  const decision = resolveDecision({ orchestration: result });
  if (!safetyRoutesForGoldenDecision("REQUEST_APPROVAL").includes(decision.route)) {
    errors.push(`decision route ${decision.route} incompatible with REQUEST_APPROVAL on LLM failure`);
  }

  const synthesis = result.outputs.SYNTHESIS;
  if (!synthesis.plan || synthesis.plan.length < 10) {
    errors.push("deterministic fallback must still return structured SOAP plan (no empty fake output)");
  }

  return { scenarioId: "AKSH-E2E-0019", ok: errors.length === 0, errors };
}

export function assertGoldenAgentScenario(
  scenario: GoldenScenario,
  result: OrchestrationResult,
  context?: {
    proposedDrug?: string;
    generatorPatient?: E2EPatientProfile;
    priorFactCount?: number;
    afterFactCount?: number;
  }
): AgentOrchestrationAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0007":
      return assertGoldenScenario0007(result, context?.generatorPatient!);
    case "AKSH-E2E-0011":
      return assertGoldenScenario0011({
        patientId: result.sharedContext.patientId,
        proposedDrug: context?.proposedDrug ?? "Amoxicillin",
        orchestration: result,
      });
    case "AKSH-E2E-0019":
      return assertGoldenScenario0019(result, {
        priorFactCount: context?.priorFactCount,
        afterFactCount: context?.afterFactCount,
      });
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported agent golden scenario ${scenario.testId}`],
      };
  }
}
