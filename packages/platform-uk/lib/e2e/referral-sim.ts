/**
 * PATHWAY / referral draft simulation — coordination package only.
 * Not a live specialist EHR or e-Referral write.
 */

import { stageEhrAdapterWrite } from "./ehr-adapter";

export const REFERRAL_SIM_HONESTY = {
  liveReferralNetwork: false as const,
  eReferralWrite: false as const,
  liveEmis: false as const,
  ehrWrite: false as const,
  note: "Simulated PATHWAY referral draft — not live e-Referral / specialist EHR write.",
} as const;

export type ReferralSpecialty =
  | "endocrinology"
  | "nephrology"
  | "ophthalmology"
  | "podiatry"
  | "diabetes_education";

export type SimulatedReferralDraft = {
  id: string;
  patientId: string;
  organisationId: string;
  clinicId: string;
  specialty: ReferralSpecialty;
  reason: string;
  status: "draft" | "accepted_for_send" | "rejected";
  hitlRequired: true;
  eReferralWrite: false;
  liveReferralNetwork: false;
  ehrWrite: false;
  liveEmis: false;
  correlationId: string;
  stagingId: string;
  createdAt: string;
  updatedAt: string;
  note: string;
};

export function createReferralDraft(input: {
  patientId: string;
  organisationId: string;
  clinicId: string;
  specialty: ReferralSpecialty;
  reason: string;
  correlationId: string;
  actor: string;
  at?: string;
}): SimulatedReferralDraft {
  const at = input.at ?? new Date().toISOString();
  const staged = stageEhrAdapterWrite(
    {
      organisationId: input.organisationId,
      clinicId: input.clinicId,
      correlationId: input.correlationId,
      patientId: input.patientId,
      actor: input.actor,
    },
    "referral_draft"
  );

  return {
    id: `e2e-referral-${input.specialty}-${input.correlationId.slice(-8)}`,
    patientId: input.patientId,
    organisationId: input.organisationId,
    clinicId: input.clinicId,
    specialty: input.specialty,
    reason: input.reason,
    status: "draft",
    hitlRequired: true,
    eReferralWrite: false,
    liveReferralNetwork: false,
    ehrWrite: false,
    liveEmis: false,
    correlationId: input.correlationId,
    stagingId: staged.stagingId,
    createdAt: at,
    updatedAt: at,
    note: REFERRAL_SIM_HONESTY.note,
  };
}

/**
 * HITL Accept marks draft ready to send — still does not perform live e-Referral write.
 */
export function acceptReferralDraftForSend(
  draft: SimulatedReferralDraft,
  actor: string,
  at?: string
): SimulatedReferralDraft {
  if (draft.status !== "draft") {
    throw new Error(`Cannot accept referral in status ${draft.status}`);
  }
  return {
    ...draft,
    status: "accepted_for_send",
    updatedAt: at ?? new Date().toISOString(),
    note: `${draft.note} · HITL Accept by ${actor} — still eReferralWrite:false`,
  };
}

export function rejectReferralDraft(
  draft: SimulatedReferralDraft,
  actor: string,
  reason: string,
  at?: string
): SimulatedReferralDraft {
  return {
    ...draft,
    status: "rejected",
    updatedAt: at ?? new Date().toISOString(),
    note: `${draft.note} · rejected by ${actor}: ${reason}`,
  };
}
