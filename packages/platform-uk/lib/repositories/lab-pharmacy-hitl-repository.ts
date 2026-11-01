/**
 * Milestone C3 — durable lab/pharmacy HITL draft store.
 * File-scoped by tenant scopeKey (same pattern as HCP eval feedback).
 * SHIELD audit dual-write when Neon/Postgres is configured.
 * care_episode_id / organisationId preserved for isolation.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  applyLabPharmacyReview,
  canReviewDraft,
  canStageDraft,
  filterQueue,
  stageLabPharmacyDraft,
  type LabPharmacyDraft,
  type LabPharmacyKind,
  type ReviewLabPharmacyDraftInput,
  type StageLabPharmacyDraftInput,
} from "@/lib/lab-pharmacy-hitl";
import type { AppRole } from "@/lib/permission-matrix";
import type { ClinicalPersona } from "@/lib/user-scope";
import { persistShieldAuditEvent } from "./shield-audit-repository";

const STORE_KIND = "lab_pharmacy_hitl_v1" as const;
const dataDir = path.join(process.cwd(), "data");

function resolveStoreFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") {
    return path.join(dataDir, "lab-pharmacy-hitl.json");
  }
  return path.join(dataDir, `lab-pharmacy-hitl.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<LabPharmacyDraft[]> {
  const file = resolveStoreFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { drafts?: LabPharmacyDraft[] };
    return Array.isArray(parsed.drafts) ? parsed.drafts : [];
  } catch {
    return [];
  }
}

async function writeStore(scopeKey: string, drafts: LabPharmacyDraft[]) {
  const file = resolveStoreFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ kind: STORE_KIND, drafts }, null, 2), "utf8");
}

export async function listLabPharmacyDrafts(options: {
  scopeKey: string;
  kind?: LabPharmacyKind;
  status?: LabPharmacyDraft["status"] | "open";
  organisationId?: string | null;
  limit?: number;
}): Promise<{ source: "file"; drafts: LabPharmacyDraft[] }> {
  const all = await readStore(options.scopeKey);
  const filtered = filterQueue(all, {
    kind: options.kind,
    status: options.status,
    organisationId: options.organisationId,
  });
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  return { source: "file", drafts: filtered.slice(-limit).reverse() };
}

export async function stageAndPersistLabPharmacyDraft(
  input: StageLabPharmacyDraftInput,
  auth: { role: AppRole; persona: ClinicalPersona | null; practiceId?: string | null }
): Promise<{ draft: LabPharmacyDraft; source: "file"; shieldLogged: boolean }> {
  if (!canStageDraft(auth.role, auth.persona)) {
    throw new Error("Forbidden: role may not stage lab/pharmacy HITL drafts");
  }

  const draft = stageLabPharmacyDraft({
    ...input,
    organisationId: input.organisationId ?? auth.practiceId ?? null,
    roleHint: input.roleHint ?? auth.persona ?? auth.role,
  });

  const existing = await readStore(input.scopeKey);
  existing.push(draft);
  await writeStore(input.scopeKey, existing);

  const shield = await persistShieldAuditEvent({
    action: "stage",
    actor: draft.stagedBy,
    label: `LAB_PHARMACY_HITL: stage ${draft.kind} · ${draft.id}`,
    detail: [
      `kind=${draft.kind}`,
      `items=${draft.items.length}`,
      draft.careEpisodeId ? `careEpisodeId=${draft.careEpisodeId}` : null,
      "live:false",
      "ehrWrite:false",
      "syntheticOnly=true",
    ]
      .filter(Boolean)
      .join(" · "),
    category: "system",
    practiceId: draft.organisationId ?? undefined,
    caseId: draft.caseId ?? undefined,
    agentLabel: draft.kind === "lab" ? "PATHWAY" : "GUARDIAN",
    resourceRef: `lab-pharmacy-hitl:${draft.id}`,
    payload: {
      draftId: draft.id,
      kind: draft.kind,
      careEpisodeId: draft.careEpisodeId,
      syntheticPatientId: draft.syntheticPatientId,
      live: false,
      ehrWrite: false,
      clinicalValidationClaim: false,
    },
  });

  return { draft, source: "file", shieldLogged: shield.persisted };
}

export async function reviewAndPersistLabPharmacyDraft(
  input: ReviewLabPharmacyDraftInput & { scopeKey: string },
  auth: { role: AppRole; persona: ClinicalPersona | null; practiceId?: string | null }
): Promise<{ draft: LabPharmacyDraft; source: "file"; shieldLogged: boolean }> {
  const existing = await readStore(input.scopeKey);
  const idx = existing.findIndex((d) => d.id === input.draftId);
  if (idx < 0) throw new Error(`Unknown draftId "${input.draftId}"`);

  const current = existing[idx]!;
  if (auth.practiceId && current.organisationId && current.organisationId !== auth.practiceId) {
    throw new Error("Forbidden: organisation boundary");
  }
  if (!canReviewDraft(current.kind, auth.role, auth.persona)) {
    throw new Error(`Forbidden: role may not review ${current.kind} drafts`);
  }

  const next = applyLabPharmacyReview(current, {
    decision: input.decision,
    actor: input.actor,
    roleHint: input.roleHint ?? auth.persona ?? auth.role,
    note: input.note,
    editedContent: input.editedContent,
  });

  existing[idx] = next;
  await writeStore(input.scopeKey, existing);

  const shield = await persistShieldAuditEvent({
    action: input.decision,
    actor: input.actor,
    label: `LAB_PHARMACY_HITL: ${input.decision} ${next.kind} · ${next.id}`,
    detail: [
      `status=${next.status}`,
      next.careEpisodeId ? `careEpisodeId=${next.careEpisodeId}` : null,
      next.reviewNote ? `note=${next.reviewNote}` : null,
      "live:false",
      "ehrWrite:false",
    ]
      .filter(Boolean)
      .join(" · "),
    category: "reviewer_decision",
    practiceId: next.organisationId ?? undefined,
    caseId: next.caseId ?? undefined,
    agentLabel: next.kind === "lab" ? "PATHWAY" : "GUARDIAN",
    resourceRef: `lab-pharmacy-hitl:${next.id}`,
    payload: {
      draftId: next.id,
      kind: next.kind,
      decision: input.decision,
      careEpisodeId: next.careEpisodeId,
      live: false,
      ehrWrite: false,
      clinicalValidationClaim: false,
    },
  });

  return { draft: next, source: "file", shieldLogged: shield.persisted };
}
