/**
 * BRIDGE Accept → FHIR staging orchestration (no Medplum OAuth).
 * HITL Accept required. liveEmis:false hard. Sim write-back only.
 */

import {
  attemptSimulatedEhrWrite,
  issueClinicianApprovalToken
} from "@/lib/clinical-proof/ehr-writeback-sim";
import {
  buildAcceptedFhirR4StagingBundle,
  summariseStagedBundle,
  type HitlAcceptStagedBundle
} from "@/lib/clinical-proof/staged-fhir";
import { queueEmisFhirStaging } from "@/lib/emis-staging";
import {
  getBridgeStagingHonesty,
  listBridgeStagingBundles,
  persistBridgeStagingBundle,
  type BridgeStagingRecord
} from "@/lib/repositories/bridge-staging-repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import type { FhirExportBundle, ReviewCase } from "@/lib/types";

export type BridgeAcceptStageResult = {
  bridgeRecord: BridgeStagingRecord;
  emisStagingEntryId: string;
  simWriteId: string | null;
  fhirResourceCount: number;
  liveEmis: false;
  ehrWriteAttempted: false;
  medplumRequired: false;
  status: "preliminary";
  note: string;
};

function asBundleRecord(
  bundle: HitlAcceptStagedBundle | FhirExportBundle | Record<string, unknown>
): Record<string, unknown> {
  return bundle as unknown as Record<string, unknown>;
}

function resourceCountFromBundle(bundle: Record<string, unknown>): number {
  const entry = bundle.entry;
  if (Array.isArray(entry)) return entry.length;
  const summary = bundle.summary as { resourceCount?: number } | undefined;
  return typeof summary?.resourceCount === "number" ? summary.resourceCount : 0;
}

/**
 * Prefer frozen Accept export bundle; fall back to clinical-proof staging Bundle.
 */
export function resolveAcceptStagingBundle(input: {
  caseId: string;
  acceptedBy: string;
  reviewCase?: ReviewCase | null;
}): {
  bundle: Record<string, unknown>;
  summary: string;
  resourceCount: number;
  source: "frozen_export" | "clinical_proof_fixtures";
} {
  const frozen = input.reviewCase?.frozenArtifact?.exportedResources;
  if (frozen?.resourceType === "Bundle" && frozen.summary?.resourceCount) {
    const tagged = {
      ...frozen,
      meta: {
        ...(frozen.meta ?? {}),
        tag: [
          ...(frozen.meta?.tag ?? []),
          {
            system: "https://akshhealth.app/tags/bridge-status",
            code: "preliminary",
            display: "BRIDGE preliminary staging"
          },
          {
            system: "https://akshhealth.app/tags/live-emis",
            code: "false",
            display: "liveEmis:false"
          }
        ]
      },
      bridgeStatus: "preliminary",
      liveEmis: false,
      medplumRequired: false
    };
    return {
      bundle: asBundleRecord(tagged),
      summary: `BRIDGE Accept · frozen FHIR export · ${frozen.summary.resourceCount} resources · preliminary · liveEmis:false`,
      resourceCount: frozen.summary.resourceCount,
      source: "frozen_export"
    };
  }

  const staged = buildAcceptedFhirR4StagingBundle({
    caseId: input.caseId,
    acceptedBy: input.acceptedBy
  });
  const summary = summariseStagedBundle(staged);
  return {
    bundle: asBundleRecord({
      ...staged,
      bridgeStatus: "preliminary",
      liveEmis: false,
      medplumRequired: false
    }),
    summary: `BRIDGE Accept · FHIR R4 staging · ${summary.resourceTypes.join(", ")} · ${summary.resourceCount} resources · preliminary · liveEmis:false`,
    resourceCount: summary.resourceCount,
    source: "clinical_proof_fixtures"
  };
}

/**
 * After clinician Accept: persist BRIDGE staging, queue emis-staging, optional sim write.
 * Never calls Partner / Medplum / live EMIS.
 */
export async function stageAcceptedCaseToBridge(input: {
  caseId: string;
  acceptedBy: string;
  clinicianId: string;
  practiceId?: string | null;
  scopeKey?: string;
  reviewCase?: ReviewCase | null;
  runSimWriteback?: boolean;
}): Promise<BridgeAcceptStageResult> {
  const resolved = resolveAcceptStagingBundle({
    caseId: input.caseId,
    acceptedBy: input.acceptedBy,
    reviewCase: input.reviewCase
  });

  const bridgeRecord = await persistBridgeStagingBundle({
    caseId: input.caseId,
    practiceId: input.practiceId,
    scopeKey: input.scopeKey,
    acceptedBy: input.acceptedBy,
    status: "preliminary",
    bundleSummary: resolved.summary,
    bundle: resolved.bundle,
    note: `BRIDGE Accept staging (${resolved.source}) · not Medplum · not live EMIS · liveEmis:false`
  });

  const emisEntry = queueEmisFhirStaging({
    approvedBy: input.acceptedBy,
    caseId: input.caseId,
    practiceOds: input.practiceId ?? undefined,
    bundleSummary: `${resolved.summary} · bridgeId=${bridgeRecord.id}`
  });

  let simWriteId: string | null = null;
  if (input.runSimWriteback !== false) {
    const approval = issueClinicianApprovalToken({
      clinicianId: input.clinicianId,
      clinicianName: input.acceptedBy,
      resourceSummary: resolved.summary,
      caseId: input.caseId,
      queueItemId: bridgeRecord.id
    });
    const sim = attemptSimulatedEhrWrite({
      approvalToken: approval.token,
      actorId: input.clinicianId,
      resourceSummary: resolved.summary
    });
    if (sim.ok) {
      simWriteId = sim.write.id;
    }
  }

  void persistShieldAuditEvent({
    action: "accept",
    actor: input.acceptedBy,
    label: "SHIELD: BRIDGE FHIR staging (sim only)",
    detail: `bridge=${bridgeRecord.id}; emis=${emisEntry.id}; sim=${simWriteId ?? "skipped"}; liveEmis=false`,
    category: "clinical",
    practiceId: input.practiceId,
    caseId: input.caseId,
    agentLabel: "BRIDGE",
    resourceRef: bridgeRecord.id,
    payload: {
      bridgeStagingId: bridgeRecord.id,
      emisStagingEntryId: emisEntry.id,
      simWriteId,
      liveEmis: false,
      ehrWriteAttempted: false,
      medplumRequired: false,
      status: "preliminary",
      storage: bridgeRecord.storage,
      resourceCount: resolved.resourceCount
    }
  });

  return {
    bridgeRecord,
    emisStagingEntryId: emisEntry.id,
    simWriteId,
    fhirResourceCount: resolved.resourceCount || resourceCountFromBundle(resolved.bundle),
    liveEmis: false,
    ehrWriteAttempted: false,
    medplumRequired: false,
    status: "preliminary",
    note: getBridgeStagingHonesty().note
  };
}

export async function getBridgeStagingStatus(options?: {
  scopeKey?: string;
  limit?: number;
}) {
  const honesty = getBridgeStagingHonesty();
  const recent = await listBridgeStagingBundles({
    scopeKey: options?.scopeKey,
    limit: options?.limit ?? 10
  });
  return {
    ...honesty,
    queueDepth: recent.length,
    recent: recent.map((r) => ({
      id: r.id,
      stagedAt: r.stagedAt,
      caseId: r.caseId,
      status: r.status,
      acceptedBy: r.acceptedBy,
      bundleSummary: r.bundleSummary,
      storage: r.storage,
      liveEmis: false as const,
      syntheticOnly: true as const
    })),
    paths: {
      api: "/api/integrations/bridge-staging",
      fhirExport: "/api/review-cases/{id}/export/fhir",
      emisStaging: "/api/integrations/emis-staging",
      ehrWritebackSim: "/api/integrations/ehr-writeback-sim"
    }
  };
}
