/**
 * Clinical safety route — branches after agent orchestration.
 * low_risk_coaching → patient companion coaching drafts
 * clinical_review_queue → clinician HITL
 * urgent_flag → GUARDIAN / urgent review first
 * request_more_data → incomplete context
 */

import type { OrchestrationResult } from "@/lib/clinical-proof/agent-orchestration";
import type { GuardianDraft } from "@/lib/agents/llm-guardian";
import type { OracleDraft } from "@/lib/agents/llm-oracle";
import type { OracleRisk } from "@/lib/mock-data/types";

export type SafetyRoute =
  | "low_risk_coaching"
  | "clinical_review_queue"
  | "urgent_flag"
  | "request_more_data";

export type SafetyRouteLabels = Record<
  SafetyRoute,
  { title: string; patientMessage: string; clinicianMessage: string }
>;

export const SAFETY_ROUTE_LABELS: SafetyRouteLabels = {
  low_risk_coaching: {
    title: "Low-risk coaching",
    patientMessage:
      "Your care team has not flagged an urgent clinical review. Wellness coaching drafts are available — not clinical advice.",
    clinicianMessage: "Route: low-risk coaching branch · patient companion may surface coaching drafts."
  },
  clinical_review_queue: {
    title: "Clinician review",
    patientMessage:
      "Your case is with the clinical review queue. Coaching drafts stay hidden until a clinician clears the safety route.",
    clinicianMessage: "Route: clinical review queue · HITL Accept/Edit/Reject required · no EHR write."
  },
  urgent_flag: {
    title: "Urgent — GUARDIAN first",
    patientMessage:
      "An urgent safety flag is active. Please contact your care team. Coaching is paused until clinicians clear the alert.",
    clinicianMessage: "Route: urgent_flag · review GUARDIAN first · HITL mandatory · no EHR write."
  },
  request_more_data: {
    title: "More data needed",
    patientMessage:
      "We need a bit more health context before coaching or clinical drafts. Use Health → ingest (with consent) or wait for your clinician.",
    clinicianMessage: "Route: request_more_data · incomplete multimodal context for coaching branch."
  }
};

export function resolveSafetyRouteFromOrchestration(
  orchestration: OrchestrationResult | null,
  options?: { ingestedCount?: number; expectedModalities?: number }
): SafetyRoute {
  const ingestedCount = options?.ingestedCount ?? Number.POSITIVE_INFINITY;
  const expectedModalities = options?.expectedModalities ?? 4;
  if (ingestedCount < Math.max(3, Math.floor(expectedModalities * 0.5))) {
    return "request_more_data";
  }
  if (!orchestration) return "clinical_review_queue";
  if (
    orchestration.queuePriority === "Urgent" ||
    orchestration.outputs.GUARDIAN.overallStatus === "red"
  ) {
    return "urgent_flag";
  }
  if (
    orchestration.queuePriority === "High" ||
    orchestration.outputs.GUARDIAN.overallStatus === "amber" ||
    orchestration.outputs.ORACLE.oracleRisk === "High" ||
    orchestration.outputs.ORACLE.oracleRisk === "VeryHigh"
  ) {
    return "clinical_review_queue";
  }
  return "low_risk_coaching";
}

/** Lightweight estimate without full orchestration (patient companion gate). */
export function resolveSafetyRouteFromSignals(input: {
  guardianStatus?: GuardianDraft["overallStatus"] | null;
  oracleRisk?: OracleRisk | string | null;
  flags?: string[];
  hasMinimalContext?: boolean;
}): SafetyRoute {
  if (input.hasMinimalContext === false) return "request_more_data";
  const urgentFlag = (input.flags ?? []).some((f) => f.toUpperCase() === "URGENT");
  if (input.guardianStatus === "red" || urgentFlag) return "urgent_flag";
  if (
    input.guardianStatus === "amber" ||
    input.oracleRisk === "High" ||
    input.oracleRisk === "VeryHigh"
  ) {
    return "clinical_review_queue";
  }
  return "low_risk_coaching";
}

export function coachingAllowedForRoute(route: SafetyRoute): boolean {
  return route === "low_risk_coaching";
}
