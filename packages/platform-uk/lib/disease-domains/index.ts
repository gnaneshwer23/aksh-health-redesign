/**
 * Chronic disease domain framework (Phase 6) — public barrel.
 *
 * Prefer importing from here rather than deep domain paths so callers stay
 * against the registry/interface layer.
 */

export {
  DISEASE_DOMAIN_IDS,
  DOMAIN_SIGNAL_HONESTY,
  EMPTY_VALIDATION_REQUIREMENTS,
  type DiseaseDomainId,
  type DomainActivationStatus,
  type DomainFeedTarget,
  type DomainSignalHonesty,
  type DomainValidationRequirements,
  type DomainGuidelinesContract,
  type DomainObservationsContract,
  type DomainRiskModelsContract,
  type DomainCarePathwaysContract,
  type DomainNotActivatedReason,
  type DomainFailure,
  type DomainSuccess,
  type DomainResult,
  type DomainRiskEvaluationInput,
  type DomainRiskEvaluationData,
  type DiseaseDomainPlugin,
} from "./types";

export {
  notActivated,
  activatedSuccess,
  validationGatesMet,
  defaultValidationForInactive,
} from "./activation";

export {
  listDiseaseDomains,
  getDiseaseDomain,
  requireDiseaseDomain,
  listActiveSyntheticDomains,
  listInactiveDomains,
  evaluateDomainRisk,
  listDomainObservationKinds,
  listDomainCarePathways,
  registerDiseaseDomain,
  resetDiseaseDomainRegistryForTests,
  listOtherChronicCandidates,
  type DomainRegistrySummary,
} from "./registry";

export { diabetesMetabolicDomain } from "./domains/diabetes";
export { cardiovascularDomain } from "./domains/cardiovascular";
export { chronicKidneyDiseaseDomain } from "./domains/ckd";
export { obesityMetabolicDomain } from "./domains/obesity";
export {
  otherChronicDomain,
  OTHER_CHRONIC_CANDIDATES,
  type OtherChronicCandidate,
} from "./domains/other";
