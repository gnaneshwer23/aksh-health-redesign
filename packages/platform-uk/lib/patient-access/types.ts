/**
 * Patient access integration — shared types.
 *
 * Inbound: events from an external patient-access service (phone, SMS, fax,
 * email agents that take referrals, run intake, book and track appointments).
 * Outbound: clinician-approved outreach requests back to that service.
 *
 * This is an INTEGRATION ADAPTER (registered as `patient-access-synthetic`
 * in lib/integration-config.ts), not an agent. It introduces no orchestrator,
 * no second SHIELD, and no entry in AGENT_DIRECTORY.
 *
 * The vendor contract below is the one Aksh EXPECTS. No vendor has been
 * integrated; MockAccessService only records requests.
 */

export const ACCESS_EVENT_TYPES = [
  "referral.received",
  "intake.completed",
  "appointment.booked",
  "appointment.no_show"
] as const;
export type AccessEventType = (typeof ACCESS_EVENT_TYPES)[number];

export const ACCESS_CHANNELS = ["voice", "sms", "fax", "email"] as const;
export type AccessChannel = (typeof ACCESS_CHANNELS)[number];

export type AccessPatient = {
  nhsNumber: string;
  given: string;
  family: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
  phone?: string;
};

export type ReportedHbA1c = { value: number; unit: "mmol/mol" | "%"; date: string };

export type AccessEventPayload = {
  patient: AccessPatient;
  referrer?: string;
  reason?: string;
  letterText?: string;
  medications?: string[];
  conditions?: string[];
  reportedHbA1c?: ReportedHbA1c;
  hypoEpisodes30d?: number;
  start?: string;
  service?: string;
};

export type AccessEvent = {
  eventId: string;
  type: AccessEventType;
  channel: AccessChannel;
  occurredAt: string;
  payload: AccessEventPayload;
};

export type FindingSeverity = "high" | "moderate" | "low";

export const OUTREACH_TYPES = ["rebook_missed", "book_review", "book_test", "book_screening"] as const;
export type OutreachType = (typeof OUTREACH_TYPES)[number];

export type AccessFinding = {
  ruleId: string;
  patientId: string;
  severity: FindingSeverity;
  summary: string;
  evidence: string[];
  action: OutreachType | null;
};

export type ProposalStatus = "pending" | "accepted" | "rejected" | "superseded";

export type AccessProposal = {
  id: string;
  finding: AccessFinding;
  status: ProposalStatus;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
  outcome?: { detectedIssue: string; communicationRequest?: string };
};

export type OutreachRequest = {
  outreachTypes: OutreachType[];
  patientNhsNumber: string;
  phone: string;
  script: string;
  authorisedBy: string[];
  communicationRequests: string[];
};

export type OutreachRecord = OutreachRequest & { outreachId: string; status: "queued" };

export type DispatchResult =
  | OutreachRecord
  | { patientRef: string; status: "not_sent"; reason: "no_phone_on_record" };

export type AuditEntry = {
  at: string;
  action:
    | "ingested"
    | "proposed"
    | "superseded"
    | "accepted"
    | "rejected"
    | "blocked_unauthorised"
    | "dispatched"
    | "dispatch_skipped_no_phone";
  proposalId?: string;
  detail: string;
};

/** Literal honesty fields, same pattern as DIABETES_SIGNAL_HONESTY. */
export type PatientAccessHonesty = {
  hitlRequired: true;
  ehrWrite: false;
  liveTelephony: false;
  vendorIntegrated: false;
  thresholdsClinicallySignedOff: false;
};

export const PATIENT_ACCESS_HONESTY: PatientAccessHonesty = {
  hitlRequired: true,
  ehrWrite: false,
  liveTelephony: false,
  vendorIntegrated: false,
  thresholdsClinicallySignedOff: false
};
