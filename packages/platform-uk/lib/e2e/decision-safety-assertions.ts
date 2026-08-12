/**
 * Decision + Safety assertions for E2E golden scenarios (Stage 7).
 * Maps golden decision/safety expectations to SafetyRoute, coaching gates, and data honesty.
 */

import type { OrchestrationResult } from "../clinical-proof/agent-orchestration";
import {
  coachingAllowedForRoute,
  resolveSafetyRouteFromSignals,
  type SafetyRoute,
} from "../clinical-spine/safety-route";
import { resolveDecision, type Decision } from "../decision";
import type { OracleDraft } from "../agents/llm-oracle";
import { getPatientById } from "../mock-data/patients";
import type { PatientStateSnapshot } from "../patient-state/types";
import { safetyRoutesForGoldenDecision } from "./agent-orchestration-assertions";
import type {
  GoldenDecisionExpectation,
  GoldenSafetyExpectation,
  GoldenScenario,
} from "./golden-scenarios";
import type { E2ELabEvent, E2EPatientProfile } from "./types";

export type DecisionSafetyAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

/** Detect invented numeric renal lab claims in agent text (hallucination guard). */
const FABRICATED_RENAL_PATTERN =
  /\b(?:creatinine|egfr|e-gfr|gfr)\s*(?:[:=]|is|of|at|~)?\s*\d{2,3}(?:\.\d+)?\s*(?:µ?mol\/l|mmol\/l|ml\/min|mL\/min)?/i;

export function textClaimsFabricatedRenalValue(text: string): boolean {
  return FABRICATED_RENAL_PATTERN.test(text);
}

export function assertDecisionHonestyInvariants(decision: Decision): string[] {
  const errors: string[] = [];
  if (!decision.route) errors.push("decision.route required");
  if (!decision.explanation) errors.push("decision.explanation required");
  if (!Array.isArray(decision.contributingIntelligenceRefs)) {
    errors.push("contributingIntelligenceRefs must be an array");
  }
  return errors;
}

export function assertDecisionMatchesGoldenExpectation(input: {
  decision: Decision;
  expectedDecision: GoldenDecisionExpectation;
  expectedSafety?: GoldenSafetyExpectation;
}): string[] {
  const errors = [...assertDecisionHonestyInvariants(input.decision)];
  const allowedRoutes = safetyRoutesForGoldenDecision(input.expectedDecision);
  if (!allowedRoutes.includes(input.decision.route)) {
    errors.push(
      `decision route ${input.decision.route} incompatible with golden ${input.expectedDecision} (allowed: ${allowedRoutes.join(", ")})`
    );
  }

  if (input.expectedSafety === "SAFE" && input.decision.route === "urgent_flag") {
    errors.push("SAFE golden scenario must not resolve to urgent_flag");
  }
  if (input.expectedSafety === "ESCALATE" || input.expectedSafety === "BLOCKED") {
    if (input.decision.route === "low_risk_coaching") {
      errors.push(`${input.expectedSafety} golden scenario must not route to low_risk_coaching only`);
    }
  }

  return errors;
}

export function assertCoachingGateForRoute(route: SafetyRoute, expectedDecision: GoldenDecisionExpectation): string[] {
  const errors: string[] = [];
  const coachingAllowed = coachingAllowedForRoute(route);
  if (expectedDecision === "OBSERVE" && !coachingAllowed) {
    errors.push("OBSERVE scenarios should allow patient companion coaching (low_risk_coaching)");
  }
  if (expectedDecision === "ESCALATE" && coachingAllowed) {
    errors.push("ESCALATE scenarios must block autonomous coaching branch");
  }
  if (expectedDecision === "ACQUIRE_DATA" && coachingAllowed) {
    errors.push("ACQUIRE_DATA scenarios must not expose coaching until data gaps closed");
  }
  return errors;
}

export function assertPatientStateHasNoRenalFact(snapshot: PatientStateSnapshot): string[] {
  const errors: string[] = [];
  if (snapshot.current.egfr) {
    errors.push("patient state must not contain egfr fact when renal function is unknown");
  }
  if (snapshot.current.creatinine) {
    errors.push("patient state must not contain creatinine fact when renal function is unknown");
  }
  return errors;
}

export function assertOracleDoesNotFabricateRenal(oracle: OracleDraft): string[] {
  const errors: string[] = [];
  const blob = [
    oracle.summary,
    ...oracle.contributingFactors,
    ...oracle.clinicianActions,
    ...oracle.safetyNotes,
  ].join(" ");

  if (textClaimsFabricatedRenalValue(blob)) {
    errors.push("ORACLE output must not invent numeric creatinine/eGFR when renal data absent");
  }
  return errors;
}

export function findCriticalLabEvents(
  labEvents: E2ELabEvent[],
  patientId: string
): E2ELabEvent[] {
  return labEvents.filter(
    (e) => e.patientId === patientId && e.resultFlag === "critical" && e.status === "completed"
  );
}

export function assertGoldenScenario0001(input: {
  orchestration: OrchestrationResult;
  safetyRoute: SafetyRoute;
  generatorPatient: E2EPatientProfile;
}): DecisionSafetyAssertionResult {
  const decision = resolveDecision({ orchestration: input.orchestration });
  const errors = [
    ...assertDecisionMatchesGoldenExpectation({
      decision,
      expectedDecision: "OBSERVE",
      expectedSafety: "SAFE",
    }),
    ...assertCoachingGateForRoute(input.safetyRoute, "OBSERVE"),
    ...(input.generatorPatient.cohortId !== "A"
      ? [`generator patient must be cohort A (got ${input.generatorPatient.cohortId})`]
      : []),
  ];

  const patient = getPatientById(input.orchestration.sharedContext.patientId);
  if (patient && !["Low", "Medium"].includes(patient.oracleRisk)) {
    errors.push(`stable cohort proxy expects Low/Medium oracle risk (got ${patient.oracleRisk})`);
  }
  if (input.orchestration.queuePriority !== "Normal") {
    errors.push(`stable observe path expects Normal queue priority (got ${input.orchestration.queuePriority})`);
  }
  if (input.orchestration.outputs.GUARDIAN.overallStatus === "red") {
    errors.push("stable observe path must not have GUARDIAN red status");
  }

  return { scenarioId: "AKSH-E2E-0001", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0009(input: {
  orchestration: OrchestrationResult;
  safetyRoute: SafetyRoute;
  generatorPatient: E2EPatientProfile;
  labEvents: E2ELabEvent[];
}): DecisionSafetyAssertionResult {
  const decision = resolveDecision({ orchestration: input.orchestration });
  const errors = [
    ...assertDecisionMatchesGoldenExpectation({
      decision,
      expectedDecision: "ESCALATE",
      expectedSafety: "ESCALATE",
    }),
    ...assertCoachingGateForRoute(input.safetyRoute, "ESCALATE"),
    ...(input.generatorPatient.cohortId !== "C"
      ? [`generator patient must be cohort C (got ${input.generatorPatient.cohortId})`]
      : []),
  ];

  const criticalLabs = findCriticalLabEvents(input.labEvents, input.generatorPatient.id);
  if (criticalLabs.length === 0) {
    errors.push("cohort C generator patient must include at least one critical lab event");
  } else if (!criticalLabs.some((l) => l.testName === "HbA1c")) {
    errors.push("critical lab escalation expects critical HbA1c flag for cohort C");
  }

  if (input.safetyRoute !== "urgent_flag" && input.safetyRoute !== "clinical_review_queue") {
    errors.push(`critical lab escalation must route to clinician review (got ${input.safetyRoute})`);
  }
  if (input.orchestration.queuePriority === "Normal") {
    errors.push("critical lab / high-risk escalation must not queue as Normal");
  }

  return { scenarioId: "AKSH-E2E-0009", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0012(input: {
  generatorPatient: E2EPatientProfile;
  snapshot: PatientStateSnapshot;
  oracle: OracleDraft;
  acquireDataDecision: Decision;
}): DecisionSafetyAssertionResult {
  const errors = [
    ...assertDecisionMatchesGoldenExpectation({
      decision: input.acquireDataDecision,
      expectedDecision: "ACQUIRE_DATA",
      expectedSafety: "SAFE",
    }),
    ...assertCoachingGateForRoute(input.acquireDataDecision.route, "ACQUIRE_DATA"),
    ...assertPatientStateHasNoRenalFact(input.snapshot),
    ...assertOracleDoesNotFabricateRenal(input.oracle),
  ];

  if (input.generatorPatient.cohortId !== "F") {
    errors.push(`generator patient must be cohort F (got ${input.generatorPatient.cohortId})`);
  }
  if (input.generatorPatient.egfrSeries.length > 0) {
    errors.push("cohort F must not seed eGFR series (absent creatinine guard)");
  }
  if (!input.generatorPatient.missingDataFlags.some((f) => f.includes("renal"))) {
    errors.push("cohort F must flag missing renal function");
  }

  return { scenarioId: "AKSH-E2E-0012", ok: errors.length === 0, errors };
}

export function assertSafetyRouteFromPatientSignals(input: {
  patientId: string;
  guardianStatus: "green" | "amber" | "red" | null;
  oracleRisk: string;
  flags: string[];
  expectedSafety: GoldenSafetyExpectation;
}): string[] {
  const route = resolveSafetyRouteFromSignals({
    guardianStatus: input.guardianStatus,
    oracleRisk: input.oracleRisk,
    flags: input.flags,
    hasMinimalContext: true,
  });

  const errors: string[] = [];
  if (input.expectedSafety === "SAFE" && route === "urgent_flag") {
    errors.push("SAFE signal path must not resolve to urgent_flag");
  }
  if (
    (input.expectedSafety === "ESCALATE" || input.expectedSafety === "BLOCKED") &&
    route === "low_risk_coaching"
  ) {
    errors.push(`${input.expectedSafety} signal path must not resolve to low_risk_coaching`);
  }
  return errors;
}

export function assertGoldenDecisionScenario(
  scenario: GoldenScenario,
  context: {
    orchestration?: OrchestrationResult;
    safetyRoute?: SafetyRoute;
    generatorPatient?: E2EPatientProfile;
    labEvents?: E2ELabEvent[];
    snapshot?: PatientStateSnapshot;
    oracle?: OracleDraft;
    acquireDataDecision?: Decision;
  }
): DecisionSafetyAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0001":
      return assertGoldenScenario0001({
        orchestration: context.orchestration!,
        safetyRoute: context.safetyRoute!,
        generatorPatient: context.generatorPatient!,
      });
    case "AKSH-E2E-0009":
      return assertGoldenScenario0009({
        orchestration: context.orchestration!,
        safetyRoute: context.safetyRoute!,
        generatorPatient: context.generatorPatient!,
        labEvents: context.labEvents ?? [],
      });
    case "AKSH-E2E-0012":
      return assertGoldenScenario0012({
        generatorPatient: context.generatorPatient!,
        snapshot: context.snapshot!,
        oracle: context.oracle!,
        acquireDataDecision: context.acquireDataDecision!,
      });
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported decision/safety golden scenario ${scenario.testId}`],
      };
  }
}
