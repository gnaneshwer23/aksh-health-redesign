/**
 * Phase 5 agent intelligence persistence (file store).
 * Optional local-dev PG via migration 048 — never production Neon.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import type {
  AgentIntelDecision,
  AgentIntelDecisionAction,
  AgentIntelDraft,
  AgentIntelHistoryEntry,
  AgentIntelOrchestrationRun,
  StructuredDraftPayload,
} from "./agent-intel-types";
import { validateStructuredDraft } from "./agent-intel-validate";

type Store = {
  drafts: AgentIntelDraft[];
  decisions: AgentIntelDecision[];
  runs: AgentIntelOrchestrationRun[];
  history: AgentIntelHistoryEntry[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "agent-intelligence.json" : `agent-intelligence.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { drafts: [], decisions: [], runs: [], history: [] };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function hist(
  patientId: string,
  subjectKind: AgentIntelHistoryEntry["subjectKind"],
  subjectId: string,
  action: string,
  actor: string,
  reason: string | null,
  metadata?: Record<string, unknown>
): AgentIntelHistoryEntry {
  return {
    id: `aih-${randomUUID()}`,
    patientId,
    subjectKind,
    subjectId,
    action,
    actor,
    reason,
    createdAt: nowIso(),
    ehrWrite: false,
    synthetic: true,
    metadata,
  };
}

export async function replacePatientAgentIntelSeed(
  patientId: string,
  seed: { drafts: AgentIntelDraft[]; run: AgentIntelOrchestrationRun },
  options?: { scopeKey?: string; actor?: string }
): Promise<void> {
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? "synthetic-seed";
  const store = await readStore(scopeKey);
  const prevDraftIds = new Set(
    store.drafts.filter((d) => d.patientId === patientId).map((d) => d.id)
  );
  store.drafts = store.drafts.filter((d) => d.patientId !== patientId);
  store.runs = store.runs.filter((r) => r.patientId !== patientId);
  store.decisions = store.decisions.filter((d) => !prevDraftIds.has(d.draftId));

  store.drafts.push(...seed.drafts);
  store.runs.unshift(seed.run);
  store.history.unshift(
    hist(patientId, "orchestration_run", seed.run.id, "seed_orchestration", actor, null, {
      draftCount: seed.drafts.length,
    })
  );
  for (const d of seed.drafts) {
    store.history.unshift(
      hist(patientId, "draft", d.id, "create_draft", actor, `kind=${d.kind}`, {
        version: d.versionPin,
      })
    );
  }
  await writeStore(store, scopeKey);
}

export async function listDrafts(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AgentIntelDraft[]> {
  const store = await readStore(options?.scopeKey ?? "shared");
  return store.drafts
    .filter((d) => d.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllOpenDrafts(options?: { scopeKey?: string }): Promise<AgentIntelDraft[]> {
  const store = await readStore(options?.scopeKey ?? "shared");
  return store.drafts.filter((d) => d.status === "DRAFT" || d.status === "queued");
}

export async function listRuns(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AgentIntelOrchestrationRun[]> {
  const store = await readStore(options?.scopeKey ?? "shared");
  return store.runs
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function listHistory(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<AgentIntelHistoryEntry[]> {
  const store = await readStore(options?.scopeKey ?? "shared");
  return store.history
    .filter((h) => h.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function decideAgentIntelDraft(
  input: {
    patientId: string;
    draftId: string;
    action: AgentIntelDecisionAction;
    actor: string;
    reason?: string;
    editedPayload?: StructuredDraftPayload;
  },
  options?: { scopeKey?: string }
): Promise<{ draft: AgentIntelDraft; decision: AgentIntelDecision }> {
  const scopeKey = options?.scopeKey ?? "shared";
  const store = await readStore(scopeKey);
  const idx = store.drafts.findIndex(
    (d) => d.id === input.draftId && d.patientId === input.patientId
  );
  if (idx < 0) {
    const err = new Error("Draft not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (input.action === "reject" && !input.reason?.trim()) {
    const err = new Error("reason required for reject") as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  if (input.action === "edit" && !input.editedPayload) {
    const err = new Error("editedPayload required for edit") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const prev = store.drafts[idx];
  if (!["DRAFT", "queued"].includes(prev.status)) {
    const err = new Error("Draft already decided") as Error & { status?: number };
    err.status = 409;
    throw err;
  }

  let nextPayload = prev.payload;
  if (input.action === "edit" && input.editedPayload) {
    const validation = validateStructuredDraft(input.editedPayload);
    if (!validation.valid) {
      const err = new Error(
        `editedPayload validation failed: ${validation.issues.map((i) => i.code).join(", ")}`
      ) as Error & { status?: number };
      err.status = 400;
      throw err;
    }
    nextPayload = input.editedPayload;
  }

  const now = nowIso();
  const statusMap: Record<AgentIntelDecisionAction, AgentIntelDraft["status"]> = {
    accept: "accepted",
    edit: "edited",
    reject: "rejected",
  };
  const nextStatus = statusMap[input.action];
  const verifiedClinical = input.action === "accept" || input.action === "edit";

  const decision: AgentIntelDecision = {
    id: `aidecision-${randomUUID()}`,
    draftId: prev.id,
    action: input.action,
    actor: input.actor,
    reason: input.reason ?? null,
    editedPayload: input.action === "edit" ? nextPayload : null,
    createdAt: now,
    modelVersion: prev.versionPin.modelVersion,
    promptVersion: prev.versionPin.promptVersion,
  };

  const next: AgentIntelDraft = {
    ...prev,
    payload: nextPayload,
    status: nextStatus,
    updatedAt: now,
    decidedBy: input.actor,
    decidedAt: now,
    closedAt: now,
    verifiedClinical,
    provenance: verifiedClinical ? "clinician_verified" : prev.provenance,
    validation: validateStructuredDraft(nextPayload, { now }),
    decisionHistory: [
      {
        id: `aidec-${randomUUID()}`,
        action: input.action,
        actor: input.actor,
        reason: input.reason ?? null,
        at: now,
        editedPayload: input.action === "edit" ? nextPayload : null,
      },
      ...prev.decisionHistory,
    ],
    ehrWrite: false,
    autonomousClinicalAction: false,
    prescribeOrTreat: false,
    hitlRequired: true,
    synthetic: true,
  };

  store.drafts[idx] = next;
  store.decisions.unshift(decision);
  store.history.unshift(
    hist(input.patientId, "draft", next.id, input.action, input.actor, input.reason ?? null, {
      verifiedClinical,
      modelVersion: decision.modelVersion,
      promptVersion: decision.promptVersion,
      ehrWrite: false,
    })
  );
  await writeStore(store, scopeKey);
  return { draft: next, decision };
}
