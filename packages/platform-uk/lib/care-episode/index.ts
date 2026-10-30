export type {
  CareEpisode,
  CareEpisodeEvent,
  CareEpisodeEventKind,
  CareEpisodeLink,
  CareEpisodeLinkKind,
  CareEpisodeStatus,
  CareEpisodeTask,
  CreateCareEpisodeInput,
  TransitionCareEpisodeInput,
} from "./types";
export { CARE_EPISODE_STATUSES } from "./types";

export {
  allowedTransitionsFrom,
  assertCanonicalPathValid,
  CANONICAL_CARE_EPISODE_PATH,
  isCareEpisodeStatus,
  validateCareEpisodeTransition,
} from "./transitions";

export {
  addCareEpisodeTask,
  attachCareEpisodeLink,
  CareEpisodeTransitionError,
  createCareEpisode,
  ensureCareEpisodesSchema,
  getCareEpisode,
  listCareEpisodeEvents,
  listCareEpisodesForPatient,
  listCareEpisodesForScope,
  resetCareEpisodeStoreForTests,
  transitionCareEpisode,
} from "./repository";

export {
  correlateCareEpisodeStage,
  readCareEpisodeId,
  type CorrelateJourneyInput,
  type CorrelateJourneyResult,
  type JourneyStage,
} from "./journey";

export {
  integrateBookingWithCareEpisode,
  integrateNurseObservationsStage,
  integrateOrchestrateStage,
  integrateClinicalReviewStage,
  runStakeholderEpisodeJourney,
  type StakeholderStageResult,
} from "./stakeholder-integration";

export {
  handoffNurseToGp,
  handoffGpToPharmacist,
  filterPatientVisibleCarePlans,
  toPatientVisibleCarePlans,
  assignFollowUpOwnership,
  trackLabReferralDraftStatuses,
  applyDraftStatusTransition,
  type HandoffResult,
  type PatientVisibleCarePlan,
  type DraftStatusSnapshot,
  type DraftTrackKind,
} from "./stakeholder-handoffs";

export {
  drainCareEpisodeOutbox,
  describeOutboxConsumerDesign,
  type OutboxDrainResult,
} from "./outbox-consumer";
