/**
 * Intervention domain — pending-drafts aggregator (D3,
 * docs/PHASED_BUILD_PLAN_D.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-2's own stated value: "what
 * interventions are pending for this patient" answerable in one place).
 *
 * Pure, synchronous — takes already-produced `InterventionDraftSummary`
 * values (built via ./adapters.ts from each domain's own real drafts) and
 * groups them. This is a mapper over data the caller already has, not a new
 * data source, store, or query.
 */

import type { InterventionDomain, InterventionDraftSummary } from "./types";

export type PendingInterventionSummary = {
  patientId: string;
  pendingCount: number;
  byDomain: Partial<Record<InterventionDomain, number>>;
  items: InterventionDraftSummary[];
};

export function describePendingInterventionDrafts(
  patientId: string,
  drafts: InterventionDraftSummary[]
): PendingInterventionSummary {
  const pending = drafts.filter((draft) => draft.patientId === patientId && draft.status === "draft");
  const byDomain: Partial<Record<InterventionDomain, number>> = {};
  for (const draft of pending) {
    byDomain[draft.domain] = (byDomain[draft.domain] ?? 0) + 1;
  }
  return { patientId, pendingCount: pending.length, byDomain, items: pending };
}
