import type { ModalityId } from "./modalities";

/**
 * Phase 2 modality connectors — consent-gated registry.
 * Synthetic / stub adapters only unless real partner keys are present.
 * Never invents a live Fitbit (or other wearable) stream without credentials.
 */

export const CONNECTOR_IDS = [
  "wearable_synthetic_stream",
  "lifestyle_diary",
  "fitbit_oauth_stub",
  "file_import"
] as const;

export type ConnectorId = (typeof CONNECTOR_IDS)[number];

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
 * Documented env var names for future real connectors (Phase 2+).
 * Names only — do not commit values.
 */
export const PHASE2_CONNECTOR_ENV_VARS = [
  "FITBIT_CLIENT_ID",
  "FITBIT_CLIENT_SECRET",
  "FITBIT_REDIRECT_URI",
  "WEARABLE_IMPORT_BUCKET",
  "LIFESTYLE_DIARY_WEBHOOK_SECRET"
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
