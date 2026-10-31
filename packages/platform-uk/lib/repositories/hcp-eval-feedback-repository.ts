/**
 * Milestone B — durable HCP eval feedback store (file-scoped).
 * Append-only. Synthetic evaluation only. No EHR write.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import {
  assertHcpFeedbackDecision,
  assertHcpRubricScores,
  HCP_FEEDBACK_KIND,
  type HcpFeedbackInput,
  type HcpFeedbackRecord,
  summariseHcpFeedbackForAdmin,
  type HcpFeedbackAdminSummary,
} from "../eval/hcp-feedback";
import { getHcpEvalCase } from "../eval/hcp-case-pack";
import { persistShieldAuditEvent } from "./shield-audit-repository";

const dataDir = path.join(process.cwd(), "data");

function resolveFeedbackFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "hcp-eval-feedback.json");
  }
  return path.join(dataDir, `hcp-eval-feedback.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<HcpFeedbackRecord[]> {
  const file = resolveFeedbackFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { records?: HcpFeedbackRecord[] };
    return Array.isArray(parsed.records) ? parsed.records : [];
  } catch {
    return [];
  }
}

async function appendStore(record: HcpFeedbackRecord, scopeKey: string) {
  const file = resolveFeedbackFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  const records = await readStore(scopeKey);
  records.push(record);
  await writeFile(file, JSON.stringify({ records, kind: HCP_FEEDBACK_KIND }, null, 2), "utf8");
}

export async function recordHcpEvalFeedback(
  input: HcpFeedbackInput,
  options: { scopeKey: string; decisionActor: string; practiceId?: string | null }
): Promise<{ record: HcpFeedbackRecord; source: "file"; shieldLogged: boolean }> {
  assertHcpFeedbackDecision(input.decision);
  assertHcpRubricScores(input.rubrics);

  const packCase = getHcpEvalCase(input.casePackCaseId);
  if (!packCase) {
    throw new Error(`Unknown casePackCaseId "${input.casePackCaseId}" — load cases from HCP case pack`);
  }

  const agentLabel = input.agentLabel?.trim();
  if (!agentLabel) throw new Error("agentLabel is required");

  const syntheticPatientId = (input.syntheticPatientId ?? packCase.syntheticPatientId).trim();
  if (!syntheticPatientId || /nhs|real.?patient/i.test(syntheticPatientId)) {
    throw new Error("syntheticPatientId required and must be a synthetic fixture id");
  }

  if (input.trustHonestyLabels != null) {
    if (!Number.isFinite(input.trustHonestyLabels) || input.trustHonestyLabels < 1 || input.trustHonestyLabels > 5) {
      throw new Error("trustHonestyLabels must be 1–5 when provided");
    }
  }

  const record: HcpFeedbackRecord = {
    ...input,
    id: `hcpfb-${randomUUID()}`,
    kind: HCP_FEEDBACK_KIND,
    recordedAt: new Date().toISOString(),
    decisionActor: options.decisionActor,
    scopeKey: options.scopeKey,
    practiceId: options.practiceId ?? null,
    agentLabel,
    syntheticPatientId,
    predictionId: input.predictionId ?? `pred-${input.casePackCaseId}-${agentLabel}`,
    syntheticOnly: true,
    clinicalValidationClaim: false,
    ehrWrite: false,
    hitlRequired: true,
  };

  await appendStore(record, options.scopeKey);

  const shield = await persistShieldAuditEvent({
    action: record.decision,
    actor: record.decisionActor,
    label: `HCP_EVAL: ${record.agentLabel} ${record.decision} · ${record.casePackCaseId}`,
    detail: [
      `rubrics=${record.rubrics.length}`,
      record.safetyMiss ? "safetyMiss=true" : "safetyMiss=false",
      "syntheticOnly=true",
      "clinicalValidationClaim=false",
      "ehrWrite=false",
    ].join(" · "),
    category: "system",
    practiceId: record.practiceId ?? undefined,
    agentLabel: record.agentLabel,
    resourceRef: `hcp-eval:${record.casePackCaseId}`,
    payload: {
      hcpFeedbackId: record.id,
      casePackCaseId: record.casePackCaseId,
      decision: record.decision,
      safetyMiss: Boolean(record.safetyMiss),
      recommendation: record.recommendation ?? null,
      syntheticOnly: true,
      clinicalValidationClaim: false,
    },
  });

  return { record, source: "file", shieldLogged: shield.persisted };
}

export async function listHcpEvalFeedback(options: {
  scopeKey: string;
  limit?: number;
}): Promise<{ source: "file"; records: HcpFeedbackRecord[] }> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const records = await readStore(options.scopeKey);
  return { source: "file", records: records.slice(-limit) };
}

export async function getHcpEvalFeedbackAdminSummary(options: {
  scopeKey: string;
}): Promise<HcpFeedbackAdminSummary> {
  const { records } = await listHcpEvalFeedback({ scopeKey: options.scopeKey, limit: 500 });
  return summariseHcpFeedbackForAdmin(records);
}
