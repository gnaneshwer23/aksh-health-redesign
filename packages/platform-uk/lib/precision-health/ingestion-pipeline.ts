import { z } from "zod";

import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";
import { ingestModalitySampleStub } from "@/lib/repositories/modality-sample-repository";

import {
  CONNECTOR_IDS,
  buildEnvironmentOpenWeatherSample,
  buildImagingDicomMetaSample,
  buildLifestyleDiarySample,
  buildOmicsPanelSample,
  buildSyntheticWearableSample,
  getConnector,
  type ConnectorId
} from "./connectors";
import { purposeCodeSchema, type PurposeCode } from "./consent";
import { mergeModalitySampleIntoKg, type KgIngestResult } from "./kg-ingest";
import { modalitySampleSchema, type StoredModalitySample } from "./modalities";

/**
 * Consent-gated ingestion pipeline for Phase 2 connectors.
 * check consent → validate Zod → store sample → optional Neo4j MERGE → SHIELD event
 */

export const ingestRequestSchema = z.object({
  connectorId: z.enum(CONNECTOR_IDS),
  purposeCode: purposeCodeSchema.default("care_delivery"),
  patientId: z.string().min(1),
  /** Optional explicit sample; otherwise connector builds a synthetic fixture. */
  sample: modalitySampleSchema.optional(),
  /** When true, attempt Neo4j MERGE if live + consent allows. */
  updateKg: z.boolean().optional().default(true)
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;

export type IngestPipelineResult = {
  accepted: boolean;
  connectorId: ConnectorId;
  liveStream: boolean;
  sample?: StoredModalitySample;
  kg: KgIngestResult;
  shieldLogged: boolean;
  ehrWrite: false;
  message: string;
};

function resolveSample(input: IngestRequest) {
  if (input.sample) {
    if (input.sample.patientId !== input.patientId) {
      throw new Error("sample.patientId must match request patientId");
    }
    return input.sample;
  }

  const connector = getConnector(input.connectorId);
  if (!connector) throw new Error("Unknown connector");

  if (input.connectorId === "lifestyle_diary") {
    return buildLifestyleDiarySample(input.patientId);
  }
  if (input.connectorId === "imaging_dicom_meta_stub") {
    return buildImagingDicomMetaSample(input.patientId);
  }
  if (input.connectorId === "omics_panel_stub") {
    return buildOmicsPanelSample(input.patientId);
  }
  if (input.connectorId === "environment_openweather_stub") {
    return buildEnvironmentOpenWeatherSample(input.patientId);
  }

  // wearable_synthetic_stream, fitbit_oauth_stub (no live pull), file_import → synthetic wearable
  return buildSyntheticWearableSample(input.patientId);
}

export async function runIngestionPipeline(
  raw: unknown,
  options: {
    scopeKey: string;
    actor: string;
  }
): Promise<IngestPipelineResult> {
  const input = ingestRequestSchema.parse(raw);
  const connector = getConnector(input.connectorId);
  if (!connector) {
    throw new Error("Unknown connector");
  }

  const liveStream = connector.resolveLiveStream();
  const sampleInput = resolveSample(input);

  // Fitbit without keys still stores synthetic — never invent live reads
  const honestSample = {
    ...sampleInput,
    provenance: {
      ...sampleInput.provenance,
      liveStream: false as const,
      realPatientData: false as const,
      note:
        sampleInput.provenance.note ??
        `${input.connectorId} ingest — liveStream capability=${liveStream}; stored sample is not live device data`
    }
  };

  const storeResult = await ingestModalitySampleStub(honestSample, {
    scopeKey: options.scopeKey,
    purposeCode: input.purposeCode as PurposeCode
  });

  if (!storeResult.accepted || !storeResult.sample) {
    void persistShieldAuditEvent({
      action: "defer",
      actor: options.actor,
      label: `SHIELD: Phase 2 ingest refused (${input.connectorId})`,
      detail: storeResult.message,
      category: "system",
      agentLabel: "SHIELD",
      resourceRef: `${input.patientId}`,
      payload: {
        connectorId: input.connectorId,
        accepted: false,
        liveStream: false,
        ehrWrite: false
      }
    });

    return {
      accepted: false,
      connectorId: input.connectorId,
      liveStream: false,
      kg: {
        attempted: false,
        applied: false,
        mode: "skipped_no_consent_path",
        nodesTouched: 0,
        note: "Ingest refused — no KG update."
      },
      shieldLogged: true,
      ehrWrite: false,
      message: storeResult.message
    };
  }

  let kg: KgIngestResult = {
    attempted: false,
    applied: false,
    mode: "mock",
    nodesTouched: 0,
    note: "KG update not requested."
  };

  if (input.updateKg !== false) {
    kg = await mergeModalitySampleIntoKg(storeResult.sample, { consentAllowsKg: true });
  }

  void persistShieldAuditEvent({
    action: "defer",
    actor: options.actor,
    label: `SHIELD: Phase 2 ingest accepted (${input.connectorId})`,
    detail: `sample=${storeResult.sample.id}; kg=${kg.mode}/${kg.applied}`,
    category: "system",
    agentLabel: "SHIELD",
    resourceRef: `${input.patientId}`,
    payload: {
      connectorId: input.connectorId,
      sampleId: storeResult.sample.id,
      liveStream: false,
      connectorLiveStreamCapability: liveStream,
      kg,
      ehrWrite: false
    }
  });

  return {
    accepted: true,
    connectorId: input.connectorId,
    liveStream: false,
    sample: storeResult.sample,
    kg,
    shieldLogged: true,
    ehrWrite: false,
    message: liveStream
      ? "Sample stored under consent. Connector has liveStream capability env, but this ingest did not pull live device data."
      : "Sample stored under consent. Not a live device stream."
  };
}
