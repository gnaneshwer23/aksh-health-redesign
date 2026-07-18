import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { isModalityGranted, type ConsentGrant, type PurposeCode } from "../precision-health/consent";
import {
  SYNTHETIC_MODALITY_FIXTURES,
  buildIngestionStubResponse,
  parseModalitySample,
  type IngestionStubResult,
  type ModalitySample,
  type StoredModalitySample
} from "../precision-health/modalities";
import { listConsentGrants } from "./consent-grant-repository";

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") return path.join(dataDir, "modality-samples.json");
  return path.join(dataDir, `modality-samples.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<StoredModalitySample[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { samples?: StoredModalitySample[] };
    return Array.isArray(parsed.samples) ? parsed.samples : [];
  } catch {
    return [];
  }
}

async function writeStore(samples: StoredModalitySample[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ samples }, null, 2), "utf8");
}

function toStored(
  sample: ModalitySample,
  purposeCode: string
): StoredModalitySample {
  return {
    ...sample,
    id: `mod-${randomUUID()}`,
    consentedPurposeCode: purposeCode,
    ingestedAt: new Date().toISOString()
  };
}

/** Seed shared store with synthetic fixtures once (idempotent by summary+patient+modality). */
export async function ensureSyntheticModalityFixtures(scopeKey = "shared") {
  const existing = await readStore(scopeKey);
  if (existing.length > 0) return existing;

  const seeded = SYNTHETIC_MODALITY_FIXTURES.map((fixture) =>
    toStored(fixture, "risk_stratification_demo")
  );
  await writeStore(seeded, scopeKey);
  return seeded;
}

export async function listModalitySamples(options?: {
  scopeKey?: string;
  patientId?: string;
  modality?: string;
}): Promise<StoredModalitySample[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  await ensureSyntheticModalityFixtures(scopeKey);
  let samples = await readStore(scopeKey);
  if (options?.patientId) {
    samples = samples.filter((s) => s.patientId === options.patientId);
  }
  if (options?.modality) {
    samples = samples.filter((s) => s.modality === options.modality);
  }
  return samples.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export async function ingestModalitySampleStub(
  rawSample: unknown,
  options: {
    scopeKey?: string;
    purposeCode: PurposeCode;
    grants?: ConsentGrant[];
  }
): Promise<IngestionStubResult> {
  const scopeKey = options.scopeKey ?? "shared";
  const sample = parseModalitySample(rawSample);
  const grants =
    options.grants ?? (await listConsentGrants({ scopeKey, patientId: sample.patientId }));

  if (!isModalityGranted(grants, sample.patientId, sample.modality, options.purposeCode)) {
    return {
      accepted: false,
      modality: sample.modality,
      liveStream: false,
      message: `No active consent grant for purpose=${options.purposeCode} modality=${sample.modality}`
    };
  }

  const honest = {
    ...sample,
    provenance: {
      source: "ingestion_stub" as const,
      liveStream: false as const,
      realPatientData: false as const,
      note: sample.provenance.note ?? "Ingestion stub — not a live stream"
    }
  };

  const stored = toStored(honest as ModalitySample, options.purposeCode);
  const all = await readStore(scopeKey);
  all.push(stored);
  await writeStore(all, scopeKey);

  return buildIngestionStubResponse(sample.modality, stored);
}
