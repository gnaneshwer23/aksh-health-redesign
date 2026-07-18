import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  buildPersonalisedHealthPlanDraft,
  type HealthPlanDraft,
  type HealthPlanInput
} from "../precision-health/health-plan";
import { persistShieldAuditEvent } from "./shield-audit-repository";

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") return path.join(dataDir, "health-plans.json");
  return path.join(dataDir, `health-plans.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<HealthPlanDraft[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { plans?: HealthPlanDraft[] };
    return Array.isArray(parsed.plans) ? parsed.plans : [];
  } catch {
    return [];
  }
}

async function writeStore(plans: HealthPlanDraft[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ plans }, null, 2), "utf8");
}

export async function listHealthPlans(options?: {
  scopeKey?: string;
  patientId?: string;
}): Promise<HealthPlanDraft[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  let plans = await readStore(scopeKey);
  if (options?.patientId) {
    plans = plans.filter((p) => p.patientId === options.patientId);
  }
  return plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createHealthPlanDraft(
  input: HealthPlanInput,
  options?: { scopeKey?: string }
): Promise<HealthPlanDraft> {
  const scopeKey = options?.scopeKey ?? "shared";
  const draft = buildPersonalisedHealthPlanDraft(input);
  const plans = await readStore(scopeKey);
  plans.push(draft);
  await writeStore(plans, scopeKey);

  void persistShieldAuditEvent({
    action: "defer",
    actor: input.createdBy,
    label: "SHIELD: personalised health plan drafted",
    detail: `${draft.patientLabel} · status=DRAFT · ehrWrite=false`,
    category: "system",
    caseId: input.caseId ?? null,
    agentLabel: "SYNTHESIS",
    resourceRef: `${draft.patientLabel} (${draft.patientId})`,
    payload: {
      planId: draft.id,
      trigger: draft.trigger,
      hitlRequired: true,
      ehrWrite: false,
      physiologicalTwin: false
    }
  });

  return draft;
}
