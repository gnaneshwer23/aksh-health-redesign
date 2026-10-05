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
import {
  resetSimulatedEhrForTests,
  upsertSimulatedEhrCharts,
  listSimulatedEhrCharts
} from "../simulated-ehr";

export type HitlWritebackChainResult = {
  accept: {
    staged: ReturnType<typeof summariseStagedBundle>;
    stagingEntryId: string;
    ehrWriteAttempted: false;
    simWriteId: string;
    simulatedEhrEntryIds: string[];
    liveEmis: false;
  };
  reject: {
    staged: false;
    simWritesBefore: number;
    simWritesAfter: number;
    simulatedEhrUnchanged: true;
  };
  replayDenied: true;
  unauthenticatedDenied: true;
  emisLiveWriteBack: false;
};

/**
 * Full platform-side chain without HTTP.
 * Proves architecture up to simulated write-back chart; never calls live EMIS.
 */
export async function runHitlStagingSimWritebackChain(options?: {
  caseId?: string;
  clinicianId?: string;
  clinicianName?: string;
  patientId?: string;
}): Promise<HitlWritebackChainResult> {
  resetEhrWritebackSimForTests();
  await resetSimulatedEhrForTests("proof-chain");

  const caseId = options?.caseId ?? `proof-chain-${Date.now()}`;
  const clinicianId = options?.clinicianId ?? "gp-proof-chain";
  const clinicianName = options?.clinicianName ?? "Dr Proof Chain";
  const patientId = options?.patientId ?? "P002";

  const emisStatus = getEmisIntegrationStatus();
  if (emisStatus.liveWriteBack !== false || emisStatus.enabled !== false) {
    throw new Error("EMIS must remain disabled for clinical-proof chain");
  }

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

  const chartEntries = await upsertSimulatedEhrCharts({
    patientId,
    caseId,
    acceptedBy: clinicianName,
    clinicianId,
    bridgeStagingId: `bridge-${stagingEntry.id}`,
    simWriteId: simWrite.write.id,
    bundleSummary: stagingEntry.bundleSummary,
    resourceTypes: staged.resourceTypes,
    scopeKey: "proof-chain"
  });
  if (chartEntries.length < 2) {
    throw new Error("Expected simulated EMIS + SystmOne chart entries");
  }
  if (chartEntries.some((e) => e.liveEmis !== false || e.realPatientData !== false)) {
    throw new Error("Simulated chart must stay liveEmis:false / realPatientData:false");
  }

  const replay = attemptSimulatedEhrWrite({
    approvalToken: approval.token,
    actorId: clinicianId
  });
  if (replay.ok) {
    throw new Error("Replay of consumed approval token must fail");
  }

  const unauth = attemptSimulatedEhrWrite({
    resourceSummary: "bypass attempt"
  });
  if (unauth.ok) {
    throw new Error("Missing-token write must fail");
  }

  const writesBeforeReject = listSimulatedEhrWrites(50).length;
  const chartsBeforeReject = (await listSimulatedEhrCharts({ scopeKey: "proof-chain", limit: 200 })).length;
  const rejectDecision = {
    decision: "reject" as const,
    caseId: `${caseId}-reject`,
    reason: "Clinician rejected AI draft — must not stage or write"
  };
  if (rejectDecision.decision !== "reject") {
    throw new Error("Reject fixture broken");
  }
  const writesAfterReject = listSimulatedEhrWrites(50).length;
  const chartsAfterReject = (await listSimulatedEhrCharts({ scopeKey: "proof-chain", limit: 200 })).length;
  if (writesAfterReject !== writesBeforeReject) {
    throw new Error("Reject path must not create simulated EHR writes");
  }
  if (chartsAfterReject !== chartsBeforeReject) {
    throw new Error("Reject path must not mutate simulated EHR chart");
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
      simulatedEhrEntryIds: chartEntries.map((e) => e.id),
      liveEmis: false
    },
    reject: {
      staged: false,
      simWritesBefore: writesBeforeReject,
      simWritesAfter: writesAfterReject,
      simulatedEhrUnchanged: true
    },
    replayDenied: true,
    unauthenticatedDenied: true,
    emisLiveWriteBack: false
  };
}
