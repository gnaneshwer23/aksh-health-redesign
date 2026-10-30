/**
 * Activation helpers — inactive domains must fail closed with `not_activated`,
 * never return fabricated clinical scores, drafts, or observations.
 */

import {
  DOMAIN_SIGNAL_HONESTY,
  EMPTY_VALIDATION_REQUIREMENTS,
  type DiseaseDomainId,
  type DomainActivationStatus,
  type DomainFailure,
  type DomainNotActivatedReason,
  type DomainSignalHonesty,
  type DomainSuccess,
  type DomainValidationRequirements,
} from "./types";

export function notActivated(
  domainId: DiseaseDomainId,
  activationStatus: DomainActivationStatus,
  feature: string,
  reason: DomainNotActivatedReason = "not_activated"
): DomainFailure {
  const statusPhrase =
    activationStatus === "research"
      ? "research / subject to evidence"
      : activationStatus === "planned"
        ? "planned scaffold only"
        : "active_synthetic";

  const message =
    reason === "validation_required"
      ? `${domainId}: ${feature} blocked — validation requirements incomplete (status: ${statusPhrase}).`
      : `${domainId}: ${feature} is not activated (${statusPhrase}). No clinical intelligence without validation; returning not_activated rather than fabricating outputs.`;

  return {
    ok: false,
    reason,
    message,
    domainId,
    activationStatus,
    clinicalOutput: null,
  };
}

export function activatedSuccess<T>(
  domainId: DiseaseDomainId,
  activationStatus: DomainActivationStatus,
  data: T,
  honesty: DomainSignalHonesty = DOMAIN_SIGNAL_HONESTY
): DomainSuccess<T> {
  return {
    ok: true,
    domainId,
    activationStatus,
    data,
    honesty,
  };
}

/** All five CLINICAL_RELEASE-style gates must be true before activation may be considered. */
export function validationGatesMet(req: DomainValidationRequirements): boolean {
  return (
    req.clinicalSafetyCase &&
    req.evaluationThresholdsRecorded &&
    req.dpiaOrRegulatoryOpinion &&
    req.approvedOrgGoLive &&
    req.clinicalLeadActivationApproval
  );
}

export function defaultValidationForInactive(): DomainValidationRequirements {
  return { ...EMPTY_VALIDATION_REQUIREMENTS };
}
