/**
 * Milestone E P1.3 — thin PATHWAY / BRIDGE run lineage.
 *
 * PATHWAY and BRIDGE stay outside CONDUCTOR auto fan-out. These fields let ops
 * join: orchestrate durable run → HITL Accept → ServiceRequest stub → BRIDGE staging.
 * liveEmis stays false; no live EMIS / EPS / PACS.
 */

import type { ReviewCase } from "@/lib/types";

export type OrchestrationRunLineage = {
  durableRunId: string | null;
  correlationId: string | null;
  careEpisodeId: string | null;
  caseId: string | null;
  liveEmis: false;
  ehrWrite: false;
};

export const RUN_LINEAGE_LIVE_EMIS = false as const;

/** Extract opaque correlation ids from a review case / agent-run summary. */
export function extractOrchestrationRunLineage(
  reviewCase: Pick<ReviewCase, "id" | "careEpisodeId" | "agentRun"> | null | undefined,
  extras?: {
    durableRunId?: string | null;
    correlationId?: string | null;
    careEpisodeId?: string | null;
  }
): OrchestrationRunLineage {
  const agentRun = reviewCase?.agentRun;
  return {
    durableRunId:
      extras?.durableRunId?.trim() ||
      agentRun?.durableRunId?.trim() ||
      null,
    correlationId:
      extras?.correlationId?.trim() ||
      agentRun?.correlationId?.trim() ||
      null,
    careEpisodeId:
      extras?.careEpisodeId?.trim() ||
      reviewCase?.careEpisodeId?.trim() ||
      agentRun?.careEpisodeId?.trim() ||
      null,
    caseId: reviewCase?.id ?? null,
    liveEmis: false,
    ehrWrite: false,
  };
}

/** Compact PHI-free lineage for queue metadata / SHIELD payloads. */
export function lineageMetadata(
  lineage: OrchestrationRunLineage
): Record<string, string | number | string[]> {
  const out: Record<string, string | number | string[]> = {
    liveEmis: "false",
    ehrWrite: "false",
  };
  if (lineage.durableRunId) out.durableRunId = lineage.durableRunId;
  if (lineage.correlationId) out.correlationId = lineage.correlationId;
  if (lineage.careEpisodeId) out.careEpisodeId = lineage.careEpisodeId;
  if (lineage.caseId) out.caseId = lineage.caseId;
  return out;
}

/** Embed lineage on a FHIR-ish staging bundle without claiming live write-back. */
export function attachLineageToBundle(
  bundle: Record<string, unknown>,
  lineage: OrchestrationRunLineage
): Record<string, unknown> {
  const existingMeta =
    bundle.meta && typeof bundle.meta === "object" ? (bundle.meta as Record<string, unknown>) : {};
  const existingTags = Array.isArray(existingMeta.tag) ? existingMeta.tag : [];
  return {
    ...bundle,
    akshRunLineage: {
      durableRunId: lineage.durableRunId,
      correlationId: lineage.correlationId,
      careEpisodeId: lineage.careEpisodeId,
      caseId: lineage.caseId,
      liveEmis: false,
      ehrWrite: false,
    },
    meta: {
      ...existingMeta,
      tag: [
        ...existingTags,
        {
          system: "https://akshhealth.app/tags/orchestration-run-id",
          code: lineage.durableRunId ?? "none",
          display: "durableRunId (PATHWAY/BRIDGE correlation)",
        },
        {
          system: "https://akshhealth.app/tags/live-emis",
          code: "false",
          display: "liveEmis:false",
        },
      ],
    },
  };
}

export function readLineageFromBundle(
  bundle: Record<string, unknown> | null | undefined
): Partial<OrchestrationRunLineage> | null {
  if (!bundle || typeof bundle !== "object") return null;
  const raw = bundle.akshRunLineage;
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    durableRunId: typeof row.durableRunId === "string" ? row.durableRunId : null,
    correlationId: typeof row.correlationId === "string" ? row.correlationId : null,
    careEpisodeId: typeof row.careEpisodeId === "string" ? row.careEpisodeId : null,
    caseId: typeof row.caseId === "string" ? row.caseId : null,
    liveEmis: false,
    ehrWrite: false,
  };
}
