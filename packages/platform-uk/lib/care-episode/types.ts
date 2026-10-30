/**
 * Canonical Care Episode — durable longitudinal unit linking:
 * Patient → Intake → Appointment → Encounter → Context → Review →
 * Lab → Med → Care plan → Follow-up → Outcome.
 *
 * Phase 1: model + validated transitions + persistence + audit hooks.
 * Links existing ReviewCase / encounters / journeys — does not replace them.
 */

export const CARE_EPISODE_STATUSES = [
  "draft",
  "intake",
  "scheduled",
  "encounter_active",
  "context_assembled",
  "in_review",
  "lab_pending",
  "med_review",
  "care_plan_draft",
  "follow_up",
  "outcome_recorded",
  "closed",
  "cancelled",
] as const;

export type CareEpisodeStatus = (typeof CARE_EPISODE_STATUSES)[number];

export type CareEpisodeLinkKind =
  | "review_case"
  | "patient_encounter"
  | "appointment"
  | "agent_intel_run"
  | "diabetes_journey"
  | "access_request"
  | "lab_result"
  | "medication_review"
  | "care_plan"
  | "follow_up_task"
  | "context_package";

export type CareEpisodeLink = {
  kind: CareEpisodeLinkKind;
  id: string;
  label?: string;
  linkedAt: string;
};

export type CareEpisodeEventKind =
  | "created"
  | "status_transition"
  | "link_attached"
  | "task_created"
  | "notification_queued"
  | "agent_invoked"
  | "hitl_decision"
  | "audit"
  | "outbox_enqueued"
  | "error";

export type CareEpisodeEvent = {
  id: string;
  episodeId: string;
  kind: CareEpisodeEventKind;
  at: string;
  actor: string;
  fromStatus?: CareEpisodeStatus;
  toStatus?: CareEpisodeStatus;
  detail?: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
  processed?: boolean;
};

export type CareEpisodeTask = {
  id: string;
  episodeId: string;
  title: string;
  ownerRole: string;
  status: "open" | "done" | "cancelled";
  createdAt: string;
  dueAt?: string;
  relatedLink?: CareEpisodeLink;
};

export type CareEpisode = {
  id: string;
  publicId: string;
  scopeKey: string;
  organisationId?: string;
  practiceId?: string;
  patientId: string;
  patientLabel?: string;
  status: CareEpisodeStatus;
  pathway?: string;
  links: CareEpisodeLink[];
  tasks: CareEpisodeTask[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  createdBy: string;
  version: number;
  synthetic: true;
  ehrWrite: false;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
};

export type CreateCareEpisodeInput = {
  patientId: string;
  patientLabel?: string;
  organisationId?: string;
  practiceId?: string;
  scopeKey?: string;
  pathway?: string;
  createdBy: string;
  idempotencyKey?: string;
  initialStatus?: Extract<CareEpisodeStatus, "draft" | "intake" | "scheduled">;
  metadata?: Record<string, unknown>;
};

export type TransitionCareEpisodeInput = {
  episodeId: string;
  toStatus: CareEpisodeStatus;
  actor: string;
  reason?: string;
  scopeKey?: string;
  idempotencyKey?: string;
  expectedVersion?: number;
};
