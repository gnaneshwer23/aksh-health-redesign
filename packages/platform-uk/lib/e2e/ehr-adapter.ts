/**
 * Region-agnostic EHR adapter interface for the simulated clinic.
 * Connectors for a specific region come later — this is NOT NHS/EMIS-locked.
 */

export const EHR_ADAPTER_HONESTY = {
  liveEmis: false as const,
  ehrWrite: false as const,
  liveWrite: false as const,
  note: "Simulated EHR adapter only — organisation-scoped; no live regional EHR write-back.",
} as const;

/** Capability surface every regional connector must eventually implement. */
export type EhrAdapterCapability =
  | "patient_identity"
  | "encounter_read"
  | "encounter_write"
  | "order_lab"
  | "receive_lab"
  | "medication_request"
  | "dispense_status"
  | "referral_draft"
  | "appointment_schedule";

export type EhrAdapterContext = {
  organisationId: string;
  clinicId: string;
  correlationId: string;
  patientId: string;
  actor: string;
};

export type EhrAdapterWriteResult = {
  accepted: false;
  staged: true;
  liveWrite: false;
  liveEmis: false;
  ehrWrite: false;
  adapterId: "simulated_ehr_v1";
  organisationId: string;
  clinicId: string;
  capability: EhrAdapterCapability;
  correlationId: string;
  stagingId: string;
  note: string;
};

export type SimulatedEhrAdapter = {
  id: "simulated_ehr_v1";
  regionAgnostic: true;
  supportedCapabilities: EhrAdapterCapability[];
  liveWrite: false;
  liveEmis: false;
  ehrWrite: false;
};

export const SIMULATED_EHR_ADAPTER: SimulatedEhrAdapter = {
  id: "simulated_ehr_v1",
  regionAgnostic: true,
  supportedCapabilities: [
    "patient_identity",
    "encounter_read",
    "encounter_write",
    "order_lab",
    "receive_lab",
    "medication_request",
    "dispense_status",
    "referral_draft",
    "appointment_schedule",
  ],
  liveWrite: false,
  liveEmis: false,
  ehrWrite: false,
};

/**
 * Stage a synthetic write against the simulated adapter.
 * Always returns staged:true / liveWrite:false — never silent success as live.
 */
export function stageEhrAdapterWrite(
  ctx: EhrAdapterContext,
  capability: EhrAdapterCapability
): EhrAdapterWriteResult {
  if (!SIMULATED_EHR_ADAPTER.supportedCapabilities.includes(capability)) {
    throw new Error(`Simulated EHR adapter does not support ${capability}`);
  }
  return {
    accepted: false,
    staged: true,
    liveWrite: false,
    liveEmis: false,
    ehrWrite: false,
    adapterId: "simulated_ehr_v1",
    organisationId: ctx.organisationId,
    clinicId: ctx.clinicId,
    capability,
    correlationId: ctx.correlationId,
    stagingId: `ehr-stage-${capability}-${ctx.correlationId.slice(-8)}`,
    note: EHR_ADAPTER_HONESTY.note,
  };
}
