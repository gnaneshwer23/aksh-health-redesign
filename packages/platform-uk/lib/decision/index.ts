/**
 * Decision module (C2 — docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-2).
 *
 * Separates Domain 3 (Decision) from Domain 2 (Intelligence)/orchestration
 * at the module boundary — a pure extraction/re-export, zero behaviour
 * change. `resolveDecision` delegates to the existing
 * `resolveSafetyRouteFromOrchestration` (lib/clinical-spine/safety-route.ts)
 * for `route` — the underlying resolver, its inputs, and its output values
 * are untouched by this module; this only gives the Decision domain one
 * named, independently-callable entry point.
 */

import type { OrchestrationResult, QueuePriority } from "@/lib/clinical-proof/agent-orchestration";
import { resolveSafetyRouteFromOrchestration, type SafetyRoute } from "@/lib/clinical-spine/safety-route";

export type Decision = {
  route: SafetyRoute;
  priority: QueuePriority | null;
  /**
   * Placeholder slot for C5/P1-3's diabetes-specific escalation value.
   * Hard-set to "none" in C2 — no escalation logic is implemented or
   * half-implemented by this phase.
   */
  escalation: "none";
  explanation: string;
  contributingIntelligenceRefs: string[];
};

export function resolveDecision(input: {
  orchestration: OrchestrationResult | null;
  ingestedCount?: number;
  expectedModalities?: number;
}): Decision {
  const route = resolveSafetyRouteFromOrchestration(input.orchestration, {
    ingestedCount: input.ingestedCount,
    expectedModalities: input.expectedModalities
  });

  return {
    route,
    priority: input.orchestration?.queuePriority ?? null,
    escalation: "none",
    explanation: input.orchestration
      ? `resolveSafetyRouteFromOrchestration → ${route} (queuePriority=${input.orchestration.queuePriority})`
      : `resolveSafetyRouteFromOrchestration → ${route} (no orchestration result)`,
    contributingIntelligenceRefs: input.orchestration?.reviewOrder ?? []
  };
}
