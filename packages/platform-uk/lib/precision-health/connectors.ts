import type { ModalityId } from "./modalities";

/**
 * Modality connectors — Phase 2 + Phase 3 advanced modality stubs.
 * Synthetic / stub adapters only unless real partner keys are present.
 * Never invents live Fitbit / OpenWeather / DICOM / omics streams without credentials.
 */

export const CONNECTOR_IDS = [
  "wearable_synthetic_stream",
  "lifestyle_diary",
  "fitbit_oauth_stub",
  "file_import",
  "imaging_dicom_meta_stub",
  "omics_panel_stub",
  "environment_openweather_stub"
] as const;

export type ConnectorId = (typeof CONNECTOR_IDS)[number];

/**
 * Connectors exposed for consent-gated role ingest (patient / GP).
 * Fitbit stays listed in the registry but is not ingestable without keys (and never invents reads).
 */
export const ROLE_INGEST_CONNECTOR_IDS: ConnectorId[] = [
  "wearable_synthetic_stream",
  "lifestyle_diary",
  "file_import"
];

export type ConnectorStatus = {
  id: ConnectorId;
  label: string;
  modality: ModalityId;
  enabled: boolean;
  liveStream: boolean;
  requiresConsentModality: ModalityId;
  envVarsDocumented: string[];
  note: string;
};

export type ConnectorDefinition = {
  id: ConnectorId;
  label: string;
  modality: ModalityId;
  /** Env var names only — never read secrets into logs. */
  requiredEnvForLive: string[];
  description: string;
  resolveEnabled: () => boolean;
  resolveLiveStream: () => boolean;
};

function hasAllEnv(names: string[]): boolean {
  return names.every((name) => Boolean(process.env[name]?.trim()));
}

/**
 * Documented env var names for connectors (Phase 2–3).
 * Names only — do not commit values.
 */
export const PHASE2_CONNECTOR_ENV_VARS = [
  "FITBIT_CLIENT_ID",
  "FITBIT_CLIENT_SECRET",
  "FITBIT_REDIRECT_URI",
  "WEARABLE_IMPORT_BUCKET",
  "LIFESTYLE_DIARY_WEBHOOK_SECRET"
] as const;

export const PHASE3_CONNECTOR_ENV_VARS = [
  "OPENWEATHER_API_KEY",
  "DICOM_META_IMPORT_BUCKET",
  "OMICS_PANEL_IMPORT_BUCKET"
] as const;

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: "wearable_synthetic_stream",
    label: "Wearable synthetic stream",
    modality: "wearable",
    requiredEnvForLive: [],
    description:
      "Continuous-ish synthetic wearable fixtures for rehearsal. Always liveStream:false.",
    resolveEnabled: () => true,
    resolveLiveStream: () => false
  },
  {
    id: "lifestyle_diary",
    label: "Lifestyle diary",
    modality: "lifestyle",
    requiredEnvForLive: [],
    description:
      "Patient / clinician lifestyle self-report diary samples. Not a device stream.",
    resolveEnabled: () => true,
    resolveLiveStream: () => false
  },
  {
    id: "fitbit_oauth_stub",
    label: "Fitbit OAuth stub",
    modality: "wearable",
    requiredEnvForLive: ["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"],
    description:
      "OAuth stub only. liveStream:true only when Fitbit client env vars are set — still no invented API pulls.",
    resolveEnabled: () => true,
    resolveLiveStream: () => hasAllEnv(["FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"])
  },
  {
    id: "file_import",
    label: "File import adapter",
    modality: "wearable",
    requiredEnvForLive: ["WEARABLE_IMPORT_BUCKET"],
    description:
      "Batch file-import adapter for consented CSV/JSON wearable dumps. Not a continuous stream.",
    resolveEnabled: () => true,
    resolveLiveStream: () => false
  },
  {
    id: "imaging_dicom_meta_stub",
    label: "Imaging DICOM metadata stub",
    modality: "imaging_meta",
    requiredEnvForLive: ["DICOM_META_IMPORT_BUCKET"],
    description:
      "DICOM study/series metadata only — no pixel store. Always liveStream:false; dicomPresent:false.",
    resolveEnabled: () => true,
    resolveLiveStream: () => false
  },
  {
    id: "omics_panel_stub",
    label: "Omics panel stub",
    modality: "omics_meta",
    requiredEnvForLive: ["OMICS_PANEL_IMPORT_BUCKET"],
    description:
      "Panel metadata stub — no FASTQ/VCF. Always liveStream:false; rawOmicsPresent:false.",
    resolveEnabled: () => true,
    resolveLiveStream: () => false
  },
  {
    id: "environment_openweather_stub",
    label: "Environment OpenWeather stub",
    modality: "environment",
    requiredEnvForLive: ["OPENWEATHER_API_KEY"],
    description:
      "Environment sample stub. liveStream:true only when OPENWEATHER_API_KEY is set — still does not invent live API pulls in ingest.",
    resolveEnabled: () => true,
    resolveLiveStream: () => hasAllEnv(["OPENWEATHER_API_KEY"])
  }
];

export function getConnector(id: ConnectorId): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY.find((c) => c.id === id);
}

export function listConnectorStatuses(): ConnectorStatus[] {
  return CONNECTOR_REGISTRY.map((def) => {
    const liveStream = def.resolveLiveStream();
    const enabled = def.resolveEnabled();
    return {
      id: def.id,
      label: def.label,
      modality: def.modality,
      enabled,
      liveStream,
      requiresConsentModality: def.modality,
      envVarsDocumented: [...def.requiredEnvForLive],
      note: liveStream
        ? `${def.description} Credentials present — live stream capability flagged; ingest still consent-gated and does not invent device reads.`
        : def.requiredEnvForLive.length > 0
          ? `${def.description} Missing env: ${def.requiredEnvForLive.join(", ")} — synthetic/stub only.`
          : def.description
    };
  });
}

/** Build a synthetic continuous-ish wearable fixture for rehearsal (never live). */
export function buildSyntheticWearableSample(patientId: string, recordedAt?: string) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    modality: "wearable" as const,
    patientId,
    recordedAt: at,
    restingHeartRateBpm: 78 + Math.floor((patientId.charCodeAt(patientId.length - 1) % 7) * 2),
    steps: 4200 + (patientId.length % 5) * 350,
    spo2Percent: 96,
    summary: "Synthetic continuous-ish wearable sample (Phase 2 connector fixture).",
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: "wearable_synthetic_stream — not a live device stream"
    }
  };
}

/** Build a lifestyle diary sample fixture. */
export function buildLifestyleDiarySample(patientId: string, recordedAt?: string) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    modality: "lifestyle" as const,
    patientId,
    recordedAt: at,
    activityMinutesPerWeek: 90,
    sleepHoursTypical: 6.5,
    dietNotes: "Lifestyle diary entry (self-report).",
    summary: "Lifestyle diary sample via Phase 2 lifestyle_diary connector.",
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: "lifestyle_diary — self-report, not a wearable stream"
    }
  };
}

/** DICOM metadata-only sample — never claims pixel store. */
export function buildImagingDicomMetaSample(patientId: string, recordedAt?: string) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    modality: "imaging_meta" as const,
    patientId,
    recordedAt: at,
    studyDescription: "Chest X-ray (DICOM metadata stub)",
    bodySite: "chest",
    status: "reported" as const,
    summary: "imaging_dicom_meta_stub — study/series UIDs only; no pixel archive.",
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: "imaging_dicom_meta_stub — DICOM metadata only; dicomPresent:false"
    },
    dicomPresent: false as const,
    studyInstanceUid: `1.2.826.0.1.3680043.8.498.SYNTHETIC.STUDY.${patientId}`,
    seriesInstanceUid: `1.2.826.0.1.3680043.8.498.SYNTHETIC.SERIES.${patientId}`,
    dicomModalityCode: "CR",
    manufacturerModel: "synthetic-dicom-meta-stub",
    pixelStoreClaim: false as const
  };
}

/** Omics panel metadata — never claims sequencing pipeline. */
export function buildOmicsPanelSample(patientId: string, recordedAt?: string) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    modality: "omics_meta" as const,
    patientId,
    recordedAt: at,
    panelName: "Cardiometabolic panel (meta stub)",
    findingsSummary: "Synthetic panel narrative — no raw genomic file.",
    summary: "omics_panel_stub — panel catalogue fields only; not live omics.",
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: "omics_panel_stub — rawOmicsPresent:false; sequencingPipelineClaim:false"
    },
    rawOmicsPresent: false as const,
    panelVersion: "cardio-meta-v0-scaffold",
    genesReviewedCount: 8,
    laboratoryName: "Synthetic Omics Lab (stub)",
    sequencingPipelineClaim: false as const
  };
}

/** Environment sample — liveStream capability may be true with OpenWeather key; stored sample still not a live pull. */
export function buildEnvironmentOpenWeatherSample(patientId: string, recordedAt?: string) {
  const at = recordedAt ?? new Date().toISOString();
  const hasKey = hasAllEnv(["OPENWEATHER_API_KEY"]);
  return {
    modality: "environment" as const,
    patientId,
    recordedAt: at,
    airQualityIndex: hasKey ? 55 : 62,
    housingStability: "stable" as const,
    postcodeArea: "SE15",
    pm25Ugm3: hasKey ? 14 : 18,
    temperatureC: 16,
    weatherSource: hasKey ? ("openweather_stub" as const) : ("synthetic_fixture" as const),
    summary: hasKey
      ? "environment_openweather_stub — key present (capability); this ingest still stores a stub sample, not a live API pull."
      : "environment_openweather_stub — synthetic fixture; OPENWEATHER_API_KEY absent.",
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: hasKey
        ? "environment_openweather_stub — liveStream capability flagged; stored sample is stub not live weather"
        : "environment_openweather_stub — no OpenWeather key; synthetic only"
    }
  };
}
