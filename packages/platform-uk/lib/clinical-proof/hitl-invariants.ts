/**
 * HITL / zero-autonomous-write invariants used by clinical-proof tests.
 */

import { getEmisIntegrationStatus, queueEmisFhirStaging } from "../emis-staging";
import {
  attemptSimulatedEhrWrite,
  getEhrWritebackSimStatus,
  issueClinicianApprovalToken
} from "./ehr-writeback-sim";

export const HITL_INVARIANTS = {
  draftIsNotRecord: "AI draft ≠ clinical record until named clinician Accept",
  rejectNeverStages: "Rejected outputs must not enter staging or EHR",
  editPreservesClinicianVersion: "Edited content must be the staged version",
  zeroAutonomousEhrWrite: "No AI/agent/background path may write to EHR without approval",
  emisStagingIsNoWrite: "/api/integrations/emis-staging must never perform live write-back"
} as const;

export function assertEmisStagingNeverWrites() {
  const status = getEmisIntegrationStatus();
  if (status.liveWriteBack !== false) {
    throw new Error("EMIS staging reported liveWriteBack=true — invariant broken");
  }
  if (status.enabled !== false) {
    throw new Error("EMIS live write-back must stay disabled");
  }

  const entry = queueEmisFhirStaging({
    approvedBy: "clinical-proof-harness",
    caseId: "proof-case",
    bundleSummary: "Synthetic FHIR R4 bundle for invariant check"
  });

  if (entry.ehrWriteAttempted !== false) {
    throw new Error("EMIS staging attempted an EHR write");
  }

  return { status, entry };
}

export function assertAgentDraftResponseIsHitlOnly(body: {
  hitlRequired?: boolean;
  ehrWrite?: boolean;
  draft?: unknown;
}) {
  if (body.ehrWrite === true) {
    throw new Error("Agent response claimed ehrWrite=true — autonomous write forbidden");
  }
  if (body.hitlRequired === false) {
    throw new Error("Agent response claimed hitlRequired=false — HITL is mandatory");
  }
  return true;
}

export function assertSimulatedWriteRequiresApproval() {
  const denied = attemptSimulatedEhrWrite({
    resourceSummary: "Unauthorized agent dump"
  });
  if (denied.ok) {
    throw new Error("Simulated EHR write succeeded without approval token");
  }

  // Staging before token (Accept path fragment)
  const staged = queueEmisFhirStaging({
    approvedBy: "Dr Proof",
    caseId: "proof-accept-1",
    bundleSummary: "Accepted SOAP DocumentReference"
  });
  if (staged.ehrWriteAttempted !== false) {
    throw new Error("Staging attempted EHR write");
  }

  const token = issueClinicianApprovalToken({
    clinicianId: "gp-proof-1",
    clinicianName: "Dr Proof",
    resourceSummary: "Accepted SOAP DocumentReference",
    caseId: "proof-accept-1",
    queueItemId: staged.id
  });

  const allowed = attemptSimulatedEhrWrite({
    approvalToken: token.token,
    actorId: "gp-proof-1",
    resourceSummary: "Accepted SOAP DocumentReference"
  });
  if (!allowed.ok) {
    throw new Error(`Expected approved write to succeed: ${allowed.error}`);
  }
  if (allowed.write.liveEmis !== false) {
    throw new Error("Simulated write claimed live EMIS");
  }

  const replay = attemptSimulatedEhrWrite({
    approvalToken: token.token,
    actorId: "gp-proof-1"
  });
  if (replay.ok) {
    throw new Error("Replay of consumed approval token must fail");
  }

  return { denied, allowed, replay, staged, simStatus: getEhrWritebackSimStatus() };
}
