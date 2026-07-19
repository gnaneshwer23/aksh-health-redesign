/**
 * Partner / regulatory gate artefacts — pending human records only.
 * Never invents signed DPIA, CSO, DTAC, DCB0129, or MHRA certifications.
 * Recording an external_ref_noted still leaves certified:false.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const dataDir = path.join(process.cwd(), "data");

export type PartnerGateId =
  | "DPIA_EMR"
  | "DPIA_MODALITY"
  | "CSO_GATE2"
  | "NAMED_CSO"
  | "G_ML_1"
  | "G_ML_2"
  | "G_ML_3"
  | "DTAC"
  | "DCB0129"
  | "MHRA_ROUTE"
  | "EMIS_GO_NOGO"
  | "MODALITY_CREDENTIALS";

export type PartnerGateArtifactStatus =
  | "unsigned"
  | "pending_review"
  | "external_ref_noted"
  | "blocked";

export type PartnerGateArtifact = {
  id: string;
  recordedAt: string;
  actor: string;
  gateId: PartnerGateId;
  status: PartnerGateArtifactStatus;
  /** Optional external reference (DPIA ID, email thread, SharePoint link) — not a cert */
  externalRef?: string;
  note: string;
  /** Always false — platform does not certify from this store */
  certified: false;
  /** Always false — does not unlock liveEmis */
  unlocksLiveEmis: false;
};

export type PartnerGateArtifactInput = {
  gateId: PartnerGateId;
  status: PartnerGateArtifactStatus;
  externalRef?: string;
  note: string;
  actor: string;
};

const GATE_IDS: PartnerGateId[] = [
  "DPIA_EMR",
  "DPIA_MODALITY",
  "CSO_GATE2",
  "NAMED_CSO",
  "G_ML_1",
  "G_ML_2",
  "G_ML_3",
  "DTAC",
  "DCB0129",
  "MHRA_ROUTE",
  "EMIS_GO_NOGO",
  "MODALITY_CREDENTIALS"
];

export function isPartnerGateId(value: string): value is PartnerGateId {
  return (GATE_IDS as string[]).includes(value);
}

export function isPartnerGateStatus(value: string): value is PartnerGateArtifactStatus {
  return (
    value === "unsigned" ||
    value === "pending_review" ||
    value === "external_ref_noted" ||
    value === "blocked"
  );
}

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "partner-gate-artifacts.json");
  }
  return path.join(dataDir, `partner-gate-artifacts.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<PartnerGateArtifact[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { records?: PartnerGateArtifact[] };
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

async function appendStore(record: PartnerGateArtifact, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  const records = await readStore(scopeKey);
  records.unshift(record);
  await writeFile(file, JSON.stringify({ records: records.slice(0, 500) }, null, 2), "utf8");
}

/**
 * Record a human gate artefact note. Rejects any attempt to mark certified/approved.
 * Status external_ref_noted still leaves certified:false and unlocksLiveEmis:false.
 */
export async function recordPartnerGateArtifact(
  input: PartnerGateArtifactInput,
  opts?: { scopeKey?: string }
): Promise<PartnerGateArtifact> {
  if (!isPartnerGateId(input.gateId)) {
    throw new Error(`Unknown gateId: ${input.gateId}`);
  }
  if (!isPartnerGateStatus(input.status)) {
    throw new Error(`Invalid status: ${input.status}`);
  }
  if (!input.note?.trim()) {
    throw new Error("note is required for partner gate artefacts.");
  }

  const record: PartnerGateArtifact = {
    id: `pga-${randomUUID()}`,
    recordedAt: new Date().toISOString(),
    actor: input.actor.trim() || "unknown",
    gateId: input.gateId,
    status: input.status,
    externalRef: input.externalRef?.trim() || undefined,
    note: input.note.trim(),
    certified: false,
    unlocksLiveEmis: false
  };

  await appendStore(record, opts?.scopeKey ?? "shared");
  return record;
}

export async function listPartnerGateArtifacts(opts?: {
  scopeKey?: string;
  limit?: number;
  gateId?: PartnerGateId;
}): Promise<{ records: PartnerGateArtifact[] }> {
  const all = await readStore(opts?.scopeKey ?? "shared");
  const filtered = opts?.gateId ? all.filter((r) => r.gateId === opts.gateId) : all;
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  return { records: filtered.slice(0, limit) };
}

export { GATE_IDS as PARTNER_GATE_IDS };
