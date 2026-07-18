import { z } from "zod";

/**
 * Multimodal data contracts for Precision Health Phase 1.
 * These are schemas + synthetic fixtures only — not live device/omics streams.
 */

export const MODALITY_IDS = [
  "wearable",
  "lifestyle",
  "clinical",
  "lab",
  "imaging_meta",
  "omics_meta",
  "environment"
] as const;

export type ModalityId = (typeof MODALITY_IDS)[number];

export const modalityIdSchema = z.enum(MODALITY_IDS);

const provenanceSchema = z.object({
  source: z.enum(["synthetic_fixture", "ingestion_stub"]),
  liveStream: z.literal(false),
  realPatientData: z.literal(false),
  note: z.string().optional()
});

export const wearableSampleSchema = z.object({
  modality: z.literal("wearable"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  restingHeartRateBpm: z.number().min(20).max(250).optional(),
  steps: z.number().int().min(0).optional(),
  spo2Percent: z.number().min(50).max(100).optional(),
  systolicBpMmHg: z.number().min(60).max(250).optional(),
  diastolicBpMmHg: z.number().min(30).max(150).optional(),
  summary: z.string().min(1),
  provenance: provenanceSchema
});

export const lifestyleSampleSchema = z.object({
  modality: z.literal("lifestyle"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  smokingStatus: z.enum(["never", "former", "current", "unknown"]).optional(),
  alcoholUnitsPerWeek: z.number().min(0).optional(),
  activityMinutesPerWeek: z.number().min(0).optional(),
  dietNotes: z.string().optional(),
  sleepHoursTypical: z.number().min(0).max(24).optional(),
  summary: z.string().min(1),
  provenance: provenanceSchema
});

export const clinicalSampleSchema = z.object({
  modality: z.literal("clinical"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  encounterType: z.string().optional(),
  conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  summary: z.string().min(1),
  provenance: provenanceSchema
});

export const labSampleSchema = z.object({
  modality: z.literal("lab"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  tests: z
    .array(
      z.object({
        codeText: z.string(),
        valueText: z.string(),
        interpretation: z.enum(["normal", "high", "low", "critical", "unknown"]).optional()
      })
    )
    .min(1),
  summary: z.string().min(1),
  provenance: provenanceSchema
});

/** Metadata only — no DICOM bytes in Phase 1. */
export const imagingMetaSampleSchema = z.object({
  modality: z.literal("imaging_meta"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  studyDescription: z.string(),
  bodySite: z.string().optional(),
  status: z.enum(["reported", "pending", "cancelled"]).default("reported"),
  summary: z.string().min(1),
  provenance: provenanceSchema,
  dicomPresent: z.literal(false)
});

/** Metadata only — no FASTQ/VCF payloads in Phase 1. */
export const omicsMetaSampleSchema = z.object({
  modality: z.literal("omics_meta"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  panelName: z.string(),
  findingsSummary: z.string(),
  summary: z.string().min(1),
  provenance: provenanceSchema,
  rawOmicsPresent: z.literal(false)
});

export const environmentSampleSchema = z.object({
  modality: z.literal("environment"),
  patientId: z.string().min(1),
  recordedAt: z.string().min(1),
  airQualityIndex: z.number().optional(),
  housingStability: z.enum(["stable", "unstable", "unknown"]).optional(),
  postcodeArea: z.string().optional(),
  summary: z.string().min(1),
  provenance: provenanceSchema
});

export const modalitySampleSchema = z.discriminatedUnion("modality", [
  wearableSampleSchema,
  lifestyleSampleSchema,
  clinicalSampleSchema,
  labSampleSchema,
  imagingMetaSampleSchema,
  omicsMetaSampleSchema,
  environmentSampleSchema
]);

export type ModalitySample = z.infer<typeof modalitySampleSchema>;
export type WearableSample = z.infer<typeof wearableSampleSchema>;
export type LifestyleSample = z.infer<typeof lifestyleSampleSchema>;
export type ClinicalSample = z.infer<typeof clinicalSampleSchema>;
export type LabSample = z.infer<typeof labSampleSchema>;
export type ImagingMetaSample = z.infer<typeof imagingMetaSampleSchema>;
export type OmicsMetaSample = z.infer<typeof omicsMetaSampleSchema>;
export type EnvironmentSample = z.infer<typeof environmentSampleSchema>;

export type StoredModalitySample = ModalitySample & {
  id: string;
  consentedPurposeCode: string;
  ingestedAt: string;
};

const SYNTHETIC_PROVENANCE = {
  source: "synthetic_fixture" as const,
  liveStream: false as const,
  realPatientData: false as const,
  note: "Phase 1 fixture — not a live wearable/omics/environment stream"
};

/** Deterministic synthetic fixtures for contract + timeline demos. */
export const SYNTHETIC_MODALITY_FIXTURES: ModalitySample[] = [
  {
    modality: "wearable",
    patientId: "P001",
    recordedAt: "2026-07-10T08:00:00.000Z",
    restingHeartRateBpm: 92,
    steps: 2100,
    spo2Percent: 94,
    systolicBpMmHg: 108,
    diastolicBpMmHg: 68,
    summary: "Synthetic home BP/HR summary for HF monitoring demo.",
    provenance: SYNTHETIC_PROVENANCE
  },
  {
    modality: "lifestyle",
    patientId: "P001",
    recordedAt: "2026-07-09T18:00:00.000Z",
    smokingStatus: "former",
    activityMinutesPerWeek: 40,
    sleepHoursTypical: 5.5,
    dietNotes: "Reports high-salt meals twice weekly (self-report).",
    summary: "Synthetic lifestyle self-report — coaching draft fodder only.",
    provenance: SYNTHETIC_PROVENANCE
  },
  {
    modality: "clinical",
    patientId: "P001",
    recordedAt: "2026-07-07T11:30:00.000Z",
    encounterType: "follow_up",
    conditions: ["Heart failure with reduced ejection fraction", "Deep vein thrombosis"],
    medications: ["Furosemide 40mg OD", "Bisoprolol 2.5mg OD", "Apixaban 5mg BD"],
    allergies: ["Penicillin"],
    summary: "Synthetic clinical summary mirrored from cohort fixture.",
    provenance: SYNTHETIC_PROVENANCE
  },
  {
    modality: "lab",
    patientId: "P001",
    recordedAt: "2026-07-08T09:15:00.000Z",
    tests: [
      { codeText: "eGFR", valueText: "48 mL/min", interpretation: "low" },
      { codeText: "NT-proBNP", valueText: "1850 pg/mL", interpretation: "high" }
    ],
    summary: "Synthetic lab panel for risk-state demo.",
    provenance: SYNTHETIC_PROVENANCE
  },
  {
    modality: "imaging_meta",
    patientId: "P002",
    recordedAt: "2026-07-05T14:00:00.000Z",
    studyDescription: "Lower limb duplex ultrasound (meta only)",
    bodySite: "left_calf",
    status: "reported",
    summary: "Imaging metadata stub — no DICOM archive.",
    provenance: SYNTHETIC_PROVENANCE,
    dicomPresent: false
  },
  {
    modality: "omics_meta",
    patientId: "P018",
    recordedAt: "2026-06-01T10:00:00.000Z",
    panelName: "Familial hypercholesterolaemia panel (meta)",
    findingsSummary: "Synthetic FH-risk family history flag — no raw genomic file.",
    summary: "Omics metadata stub — not a sequencing pipeline.",
    provenance: SYNTHETIC_PROVENANCE,
    rawOmicsPresent: false
  },
  {
    modality: "environment",
    patientId: "P001",
    recordedAt: "2026-07-01T00:00:00.000Z",
    airQualityIndex: 62,
    housingStability: "stable",
    postcodeArea: "SE15",
    summary: "Synthetic environment context for SDOH overlay demos.",
    provenance: SYNTHETIC_PROVENANCE
  }
];

export function parseModalitySample(input: unknown): ModalitySample {
  return modalitySampleSchema.parse(input);
}

export function listModalityContractSummaries() {
  return MODALITY_IDS.map((id) => ({
    id,
    liveStreamSupported: false as const,
    phase: "phase_1_contract" as const,
    note:
      id === "imaging_meta" || id === "omics_meta"
        ? "Metadata schema only — no binary payloads in Phase 1"
        : "Schema + synthetic fixtures / ingestion stubs only"
  }));
}

export type IngestionStubResult = {
  accepted: boolean;
  modality: ModalityId;
  liveStream: false;
  message: string;
  sample?: StoredModalitySample;
};

export function buildIngestionStubResponse(
  modality: ModalityId,
  sample?: StoredModalitySample
): IngestionStubResult {
  return {
    accepted: Boolean(sample),
    modality,
    liveStream: false,
    message: sample
      ? "Sample stored under consent grant. Not a live device stream."
      : "Ingestion stub ready — provide a validated modality sample + active consent grant.",
    sample
  };
}
