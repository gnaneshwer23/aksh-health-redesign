/**
 * Front Desk — patient access module (docs/PATIENT_ACCESS_AND_ASHA.md).
 *
 * A module like Aksh Diabetes, not new peer agents: AGENT_DIRECTORY stays at 12 (N4 lock).
 * Asha is a patient-facing channel of CANVAS (capture). Clinical content is drafted only;
 * a named clinician decides; SHIELD audits decisions; BRIDGE stages after Accept.
 * Track A: synthetic patients, simulated telephony, no live EHR write.
 */

export type AccessChannel = "voice" | "sms" | "web_chat" | "staff_phone";
export type AccessDirection = "inbound" | "outbound";

export type AccessIntent =
  | "book"
  | "move"
  | "cancel"
  | "health_update"
  | "question"
  | "repeat_prescription"
  | "speak_to_someone"
  | "unknown";

export type SafetyLevel = "none" | "clinician_review" | "urgent_same_day" | "emergency" | "crisis";

export type SafetyResult = {
  level: SafetyLevel;
  reason: string | null;
  matched: string | null;
  /** Fixed, pre-approved wording. Never generated. */
  patientMessage: string | null;
  /** True when the conversation must stop and a human must take over now. */
  handOffNow: boolean;
};

export type AppointmentType = "gp_routine" | "diabetes_review" | "blood_test" | "nurse_review" | "foot_check";

export type Slot = {
  id: string;
  clinicianId: string;
  clinicianName: string;
  clinicianRole: "GP" | "Practice nurse" | "Diabetes nurse" | "HCA";
  start: string; // ISO, Europe/London wall time stored as UTC ISO
  durationMin: number;
  type: AppointmentType;
  patientId: string | null;
  bookedVia: AccessChannel | "staff" | null;
  bookingKey: string | null;
};

export type WaitlistEntry = {
  id: string;
  patientId: string;
  type: AppointmentType;
  priority: "routine" | "soon";
  addedAt: string;
  status: "waiting" | "offered" | "booked" | "expired";
  offeredSlotId?: string;
};

export type ObservationKind =
  | "capillary_glucose"
  | "hba1c"
  | "blood_pressure"
  | "weight"
  | "medication_adherence"
  | "symptom";

export type PatientReportedObservation = {
  kind: ObservationKind;
  /** LOINC where one exists. */
  code: string | null;
  display: string;
  value: string;
  unit: string | null;
  numeric?: number;
  numeric2?: number;
  raw: string;
  verified: false;
  source: "patient_reported";
};

export type ClinicalDraftStatus = "pending" | "accepted" | "rejected";

/** Patient-reported data waiting for a clinician. Never part of the record until Accept. */
export type ClinicalDraft = {
  id: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  channel: AccessChannel;
  direction: AccessDirection;
  summary: string;
  observations: PatientReportedObservation[];
  safety: SafetyLevel;
  status: ClinicalDraftStatus;
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
  /** Staged FHIR resource ids after Accept (BRIDGE rehearsal, liveEmis:false). */
  stagedResourceIds?: string[];
};

export type WorkItemKind =
  | "booking"
  | "move"
  | "cancellation"
  | "slot_fill"
  | "health_update"
  | "question"
  | "referral"
  | "prescription_request"
  | "hand_off"
  | "safety_escalation"
  | "campaign_call";

export type WorkItemStatus = "resolved" | "handed_off" | "awaiting_clinician" | "open";

export type WorkItem = {
  id: string;
  at: string;
  kind: WorkItemKind;
  status: WorkItemStatus;
  channel: AccessChannel | "staff";
  direction: AccessDirection;
  patientId: string | null;
  summary: string;
  priority: "routine" | "urgent" | "emergency";
  handOffReason?: string;
  conversationId?: string;
  campaignId?: string;
};

export type CampaignKind = "missed_appointment" | "lapsed_review" | "recall" | "health_check_in";
export type CampaignStatus = "draft" | "approved" | "complete";

export type CallOutcome =
  | "booked"
  | "check_in_completed"
  | "declined"
  | "voicemail"
  | "no_answer"
  | "not_called_no_consent"
  | "escalated";

export type CampaignTarget = {
  patientId: string;
  reason: string;
  outcome?: CallOutcome;
  detail?: string;
};

export type Campaign = {
  id: string;
  kind: CampaignKind;
  name: string;
  createdAt: string;
  createdBy: string;
  status: CampaignStatus;
  approvedBy?: string;
  approvedAt?: string;
  targets: CampaignTarget[];
  /** Fixed script shown to the approver. No results, medicines or diagnoses are read out. */
  script: string;
};

export type ReferralIntake = {
  id: string;
  receivedAt: string;
  patientId: string | null;
  patientMatch: "matched" | "not_found" | "ambiguous";
  referrer: string | null;
  reason: string;
  urgency: "routine" | "urgent";
  suggestedType: AppointmentType;
  proposedSlotId: string | null;
  status: "proposed" | "booked" | "handed_off";
};

export type BaselineMetrics = {
  lockedAt: string;
  label: string;
  callsAnsweredPct: number;
  avgWaitSeconds: number;
  slotsFilledPct: number;
  missedRebookedPct: number;
  handOffPct: number;
};

export type FrontDeskState = {
  version: number;
  practiceName: string;
  anchorDate: string; // YYYY-MM-DD the calendar was generated from
  slots: Slot[];
  waitlist: WaitlistEntry[];
  workItems: WorkItem[];
  drafts: ClinicalDraft[];
  campaigns: Campaign[];
  referrals: ReferralIntake[];
  baseline: BaselineMetrics;
  counters: { inboundContacts: number; answeredByFrontDesk: number };
};

export type ConversationStage =
  | "greeting"
  | "identify"
  | "intent"
  | "offer_slots"
  | "confirm_cancel"
  | "collect_health"
  | "check_in"
  | "closed"
  | "handed_off";

export type ConversationTurn = { from: "patient" | "asha"; text: string; at: string };

/** Carried by the client between turns so any server instance can continue it. */
export type ConversationSession = {
  id: string;
  channel: AccessChannel;
  direction: AccessDirection;
  stage: ConversationStage;
  patientId: string | null;
  identifyAttempts: number;
  /** Identity details can arrive across turns ("I'm Jane Smith" … "born 3/4/1960"). */
  identifyBuffer: string;
  /** For outbound calls: the patient this call is meant for. */
  expectedPatientId: string | null;
  unknownCount: number;
  /** Why a hand-off is pending once identity is confirmed (e.g. a clinical question). */
  pendingHandOffReason: string | null;
  highestSafety: SafetyLevel;
  intent: AccessIntent | null;
  offeredSlotIds: string[];
  pendingAppointmentType: AppointmentType | null;
  moveFromSlotId: string | null;
  captured: PatientReportedObservation[];
  /** What was last sent to the care team, for the patient-facing summary. */
  lastRecorded?: PatientReportedObservation[];
  checkInStep: number;
  campaignId: string | null;
  transcript: ConversationTurn[];
};

export const FRONT_DESK_HONESTY = {
  syntheticOnly: true,
  liveTelephony: false,
  ehrWrite: false,
  hitlRequiredForClinicalContent: true,
  thresholdsClinicallySignedOff: false,
  givesClinicalAdvice: false,
} as const;
