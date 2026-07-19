/**
 * Append-only governed evaluation reviews.
 * Never auto-retrains; never bumps model versions. Documentary + audit only.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const dataDir = path.join(process.cwd(), "data");

export type GovernedGateId = "G-ML-1" | "G-ML-2" | "G-ML-3";

export type GovernedProposedAction =
  | "no_change"
  | "schedule_human_review"
  | "propose_model_update";

export type GovernedEvaluationStatus =
  | "no_change_recorded"
  | "pending_human_review"
  | "approved_for_manual_release";

export type GovernedEvaluationRecord = {
  id: string;
  recordedAt: string;
  actor: string;
  learningEventIdsReviewed: string[];
  gates: Array<{
    gateId: GovernedGateId;
    signed: boolean;
    signer?: string;
    note?: string;
  }>;
  gatesAllSigned: boolean;
  proposedAction: GovernedProposedAction;
  rationale: string;
  status: GovernedEvaluationStatus;
  autoRetrainTriggered: false;
  modelUpdated: false;
  ehrWrite: false;
  governanceNote: string;
};

export type GovernedEvaluationInput = Omit<
  GovernedEvaluationRecord,
  "id" | "recordedAt" | "governanceNote" | "autoRetrainTriggered" | "modelUpdated" | "ehrWrite"
> & {
  autoRetrainTriggered: false;
  modelUpdated: false;
  ehrWrite: false;
};

const GOVERNANCE_NOTE =
  "Evaluation input for manual governed release only. Never auto-retrains. See docs/GOVERNED_MODEL_RELEASE_SOP.md.";

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "governed-evaluations.json");
  }
  return path.join(dataDir, `governed-evaluations.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<GovernedEvaluationRecord[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { records?: GovernedEvaluationRecord[] };
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

async function appendStore(record: GovernedEvaluationRecord, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  const records = await readStore(scopeKey);
  records.push(record);
  await writeFile(file, JSON.stringify({ records }, null, 2), "utf8");
}

export async function recordGovernedEvaluation(
  input: GovernedEvaluationInput,
  options?: { scopeKey?: string }
): Promise<GovernedEvaluationRecord> {
  const record: GovernedEvaluationRecord = {
    ...input,
    id: `geval-${randomUUID()}`,
    recordedAt: new Date().toISOString(),
    autoRetrainTriggered: false,
    modelUpdated: false,
    ehrWrite: false,
    governanceNote: GOVERNANCE_NOTE
  };

  await appendStore(record, options?.scopeKey ?? "shared");
  return record;
}

export async function listGovernedEvaluations(options?: {
  scopeKey?: string;
  limit?: number;
}): Promise<{ records: GovernedEvaluationRecord[] }> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const records = await readStore(options?.scopeKey ?? "shared");
  return {
    records: records.slice(-limit).reverse()
  };
}
