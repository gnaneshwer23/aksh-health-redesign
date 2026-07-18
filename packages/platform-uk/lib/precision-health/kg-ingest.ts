import { checkNeo4jHealth, isNeo4jConfigured, runQuery } from "@/lib/neo4j";

import type { StoredModalitySample } from "./modalities";

/**
 * Living KG updates from consented wearable / lifestyle samples.
 * Honest, limited schema: Observation-like properties + MEASURED edges.
 * Skips when Neo4j is mock / not connected — never invents a live graph write.
 */

export type KgIngestResult = {
  attempted: boolean;
  applied: boolean;
  mode: "live" | "mock" | "skipped_no_consent_path" | "skipped_unsupported_modality";
  nodesTouched: number;
  note: string;
};

function observationProps(sample: StoredModalitySample): Record<string, unknown> {
  const base = {
    id: sample.id,
    patientId: sample.patientId,
    modality: sample.modality,
    recordedAt: sample.recordedAt,
    summary: sample.summary,
    consentedPurposeCode: sample.consentedPurposeCode,
    liveStream: false,
    realPatientData: false,
    source: "phase2_ingest"
  };

  if (sample.modality === "wearable") {
    return {
      ...base,
      restingHeartRateBpm: sample.restingHeartRateBpm ?? null,
      steps: sample.steps ?? null,
      spo2Percent: sample.spo2Percent ?? null,
      systolicBpMmHg: sample.systolicBpMmHg ?? null,
      diastolicBpMmHg: sample.diastolicBpMmHg ?? null
    };
  }

  if (sample.modality === "lifestyle") {
    return {
      ...base,
      smokingStatus: sample.smokingStatus ?? null,
      alcoholUnitsPerWeek: sample.alcoholUnitsPerWeek ?? null,
      activityMinutesPerWeek: sample.activityMinutesPerWeek ?? null,
      sleepHoursTypical: sample.sleepHoursTypical ?? null
    };
  }

  return base;
}

/**
 * MERGE an Observation node and MEASURED relationship when Neo4j is live.
 * Only wearable + lifestyle are mapped in Phase 2 scaffolding.
 */
export async function mergeModalitySampleIntoKg(
  sample: StoredModalitySample,
  options?: { consentAllowsKg?: boolean }
): Promise<KgIngestResult> {
  if (sample.modality !== "wearable" && sample.modality !== "lifestyle") {
    return {
      attempted: false,
      applied: false,
      mode: "skipped_unsupported_modality",
      nodesTouched: 0,
      note: `Modality ${sample.modality} not mapped to living KG in Phase 2 scaffolding.`
    };
  }

  if (options?.consentAllowsKg === false) {
    return {
      attempted: false,
      applied: false,
      mode: "skipped_no_consent_path",
      nodesTouched: 0,
      note: "Consent does not allow KG update for this ingest."
    };
  }

  if (!isNeo4jConfigured()) {
    return {
      attempted: false,
      applied: false,
      mode: "mock",
      nodesTouched: 0,
      note: "Neo4j not configured — KG MERGE skipped (honest mock)."
    };
  }

  const health = await checkNeo4jHealth();
  if (!health.connected || health.mode !== "live") {
    return {
      attempted: false,
      applied: false,
      mode: "mock",
      nodesTouched: 0,
      note: "Neo4j not live — KG MERGE skipped."
    };
  }

  const props = observationProps(sample);

  try {
    await runQuery(
      `MERGE (p:Patient {id: $patientId})
       MERGE (o:Observation {id: $obsId})
       SET o += $props
       MERGE (p)-[r:MEASURED]->(o)
       SET r.recordedAt = $recordedAt,
           r.modality = $modality,
           r.liveStream = false,
           r.source = 'phase2_ingest'`,
      {
        patientId: sample.patientId,
        obsId: sample.id,
        props,
        recordedAt: sample.recordedAt,
        modality: sample.modality
      }
    );

    return {
      attempted: true,
      applied: true,
      mode: "live",
      nodesTouched: 2,
      note: "Merged Observation + MEASURED edge for consented sample (not EMR write-back)."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      attempted: true,
      applied: false,
      mode: "live",
      nodesTouched: 0,
      note: `Neo4j MERGE failed: ${message.slice(0, 200)}`
    };
  }
}
