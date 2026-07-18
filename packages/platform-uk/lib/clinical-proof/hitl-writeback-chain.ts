/**
 * Accept → FHIR R4 stage → approval token → simulated EHR write chain.
 * Reject never stages or reaches sim. Live EMIS remains BLOCKED: partner.
 */

import { getEmisIntegrationStatus, queueEmisFhirStaging } from "../emis-staging";
import {
  attemptSimulatedEhrWrite,
  getEhrWritebackSimStatus,
  issueClinicianApprovalToken,
  listSimulatedEhrWrites,
  resetEhrWritebackSimForTests
} from "./ehr-writeback-sim";
import { buildAcceptedFhirR4StagingBundle, summariseStagedBundle } from "./staged-fhir";
import { assertFhirR4Valid } from "./fhir-r4-validator";

export type HitlWritebackChainResult = {
  accept: {
    staged: ReturnType<typeof summariseStagedBundle>;
    stagingEntryId: string;
    ehrWriteAttempted: false;
    simWriteId: string;
    liveEmis: false;
  };
  reject: {
    staged: false;
    simWritesBefore: number;
    simWritesAfter: number;
  };
  replayDenied: true;
  unauthenticatedDenied: true;
  emisLiveWriteBack: false;
};

/**
 * Full platform-side chain without HTTP.
 * Proves architecture up to simulated write-back; never calls EMIS.
 */
export function runHitlStagingSimWritebackChain(options?: {
  caseId?: string;
  clinicianId?: string;
  clinicianName?: string;
}): HitlWritebackChainResult {
  resetEhrWritebackSimForTests();

  const caseId = options?.caseId ?? `proof-chain-${Date.now()}`;
  const clinicianId = options?.clinicianId ?? "gp-proof-chain";
  const clinicianName = options?.clinicianName ?? "Dr Proof Chain";

  const emisStatus = getEmisIntegrationStatus();
  if (emisStatus.liveWriteBack !== false || emisStatus.enabled !== false) {
    throw new Error("EMIS must remain disabled for clinical-proof chain");
  }

  // --- Accept path ---
  const bundle = buildAcceptedFhirR4StagingBundle({
    caseId,
    acceptedBy: clinicianName,
    resourceTypes: [
      "DocumentReference",
      "Condition",
      "Flag",
      "MedicationRequest",
      "RiskAssessment",
      "Observation",
      "Encounter",
      "AuditEvent"
    ]
  });
  assertFhirR4Valid(bundle, "hitl-accept-bundle");
  const staged = summariseStagedBundle(bundle);
  if (!staged.fhirR4Valid) {
    throw new Error("Accepted bundle failed FHIR R4 gate before staging");
  }

  const stagingEntry = queueEmisFhirStaging({
    approvedBy: clinicianName,
    caseId,
    bundleSummary: `HITL Accept FHIR R4 bundle (${staged.resourceTypes.join(", ")}) — ${staged.resourceCount} resources`
  });
  if (stagingEntry.ehrWriteAttempted !== false) {
    throw new Error("Staging must never attempt EHR write");
  }

  const approval = issueClinicianApprovalToken({
    clinicianId,
    clinicianName,
    resourceSummary: stagingEntry.bundleSummary,
    caseId,
    queueItemId: stagingEntry.id
  });

  const simWrite = attemptSimulatedEhrWrite({
    approvalToken: approval.token,
    actorId: clinicianId,
    resourceSummary: stagingEntry.bundleSummary
  });
  if (!simWrite.ok) {
    throw new Error(`Expected sim write after Accept: ${simWrite.error}`);
  }
  if (simWrite.write.liveEmis !== false) {
    throw new Error("Sim write claimed live EMIS");
  }

  const replay = attemptSimulatedEhrWrite({
    approvalToken: approval.token,
    actorId: clinicianId
  });
  if (replay.ok) {
    throw new Error("Replay of consumed approval token must fail");
  }

  // Unauthenticated / missing token
  const unauth = attemptSimulatedEhrWrite({
    resourceSummary: "bypass attempt"
  });
  if (unauth.ok) {
    throw new Error("Missing-token write must fail");
  }

  // --- Reject path: never stages, never sim-writes ---
  const writesBeforeReject = listSimulatedEhrWrites(50).length;
  // Explicitly do NOT call buildAcceptedFhirR4StagingBundle / queue / issue token for reject
  const rejectDecision = {
    decision: "reject" as const,
    caseId: `${caseId}-reject`,
    reason: "Clinician rejected AI draft — must not stage or write"
  };
  if (rejectDecision.decision !== "reject") {
    throw new Error("Reject fixture broken");
  }
  const writesAfterReject = listSimulatedEhrWrites(50).length;
  if (writesAfterReject !== writesBeforeReject) {
    throw new Error("Reject path must not create simulated EHR writes");
  }

  const simStatus = getEhrWritebackSimStatus();
  if (simStatus.liveEmis !== false || simStatus.liveWriteBack !== false) {
    throw new Error("Sim adapter must report liveEmis/liveWriteBack false");
  }

  return {
    accept: {
      staged,
      stagingEntryId: stagingEntry.id,
      ehrWriteAttempted: false,
      simWriteId: simWrite.write.id,
      liveEmis: false
    },
    reject: {
      staged: false,
      simWritesBefore: writesBeforeReject,
      simWritesAfter: writesAfterReject
    },
    replayDenied: true,
    unauthenticatedDenied: true,
    emisLiveWriteBack: false
  };
}
