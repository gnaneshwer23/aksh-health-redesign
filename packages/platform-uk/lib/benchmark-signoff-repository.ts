import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  defaultBenchmarkSignoffDraft,
  type BenchmarkSignoffDraft,
  type BenchmarkSignoffEntry,
  type BenchmarkSignoffState
} from "./benchmark-signoff-types";
import type { ReturnTypeOfBenchmarkEvidence } from "./benchmark-evidence";

const dataDir = path.join(process.cwd(), "data");
const scopeLocks = new Map<string, Promise<void>>();

function resolveDataFile(scopeKey = "shared") {
  if (scopeKey === "shared") {
    return path.join(dataDir, "benchmark-signoffs.json");
  }

  return path.join(dataDir, `benchmark-signoffs.${scopeKey}.json`);
}

function buildDefaultState(userId = "anonymous"): BenchmarkSignoffState {
  return {
    userId,
    draft: { ...defaultBenchmarkSignoffDraft },
    archive: []
  };
}

function normalizeDraft(draft: Partial<BenchmarkSignoffDraft> | undefined): BenchmarkSignoffDraft {
  const decision = draft?.decision;

  return {
    reviewerName: draft?.reviewerName ?? defaultBenchmarkSignoffDraft.reviewerName,
    decision:
      decision === "accepted_for_internal_evidence" || decision === "accepted_with_follow_up" || decision === "not_accepted"
        ? decision
        : defaultBenchmarkSignoffDraft.decision,
    followUpOwner: draft?.followUpOwner ?? defaultBenchmarkSignoffDraft.followUpOwner,
    dueDate: draft?.dueDate ?? defaultBenchmarkSignoffDraft.dueDate,
    notes: draft?.notes ?? defaultBenchmarkSignoffDraft.notes,
    signedAt: draft?.signedAt ?? defaultBenchmarkSignoffDraft.signedAt
  };
}

function normalizeEntry(entry: Partial<BenchmarkSignoffEntry>, userId: string): BenchmarkSignoffEntry {
  const draft = normalizeDraft(entry);

  return {
    ...draft,
    id: entry.id ?? `benchmark-signoff-${Math.random().toString(36).slice(2, 10)}`,
    userId: entry.userId ?? userId,
    generatedAt: entry.generatedAt ?? draft.signedAt ?? new Date().toLocaleString("en-GB"),
    benchmarkedCases: entry.benchmarkedCases ?? 0,
    passedCases: entry.passedCases ?? 0,
    failedCases: entry.failedCases ?? 0,
    openBenchmarkActions: entry.openBenchmarkActions ?? 0,
    resolvedBenchmarkActions: entry.resolvedBenchmarkActions ?? 0
  };
}

function normalizeState(raw: Partial<BenchmarkSignoffState> | undefined, userId = "anonymous"): BenchmarkSignoffState {
  return {
    userId: raw?.userId ?? userId,
    draft: normalizeDraft(raw?.draft),
    archive: Array.isArray(raw?.archive) ? raw.archive.map((entry) => normalizeEntry(entry, userId)) : []
  };
}

async function ensureDataFile(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dataFile, "utf8");
    if (raw.trim()) {
      return;
    }
  } catch {
    // Missing store file — initialize below.
  }

  await writeFile(dataFile, JSON.stringify(buildDefaultState(userId), null, 2), "utf8");
}

function parseBenchmarkSignoffState(
  raw: string,
  userId = "anonymous"
): { state: BenchmarkSignoffState; repaired: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { state: buildDefaultState(userId), repaired: true };
  }

  try {
    return {
      state: normalizeState(JSON.parse(trimmed) as Partial<BenchmarkSignoffState>, userId),
      repaired: false
    };
  } catch {
    return { state: buildDefaultState(userId), repaired: true };
  }
}

async function withScopeLock<T>(scopeKey: string, operation: () => Promise<T>) {
  const previous = scopeLocks.get(scopeKey) ?? Promise.resolve();
  const pending = previous.catch(() => undefined).then(operation);
  const settled = pending.then(
    () => undefined,
    () => undefined
  );

  scopeLocks.set(scopeKey, settled);

  try {
    return await pending;
  } finally {
    if (scopeLocks.get(scopeKey) === settled) {
      scopeLocks.delete(scopeKey);
    }
  }
}

async function readBenchmarkSignoffStateUnsafe(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const raw = await readFile(dataFile, "utf8");
  const { state, repaired } = parseBenchmarkSignoffState(raw, userId);

  if (repaired) {
    await writeFile(dataFile, JSON.stringify(state, null, 2), "utf8");
  }

  return state;
}

async function writeBenchmarkSignoffStateUnsafe(state: BenchmarkSignoffState, scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const normalized = normalizeState(state, userId);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function readBenchmarkSignoffState(scopeKey = "shared", userId = "anonymous") {
  await (scopeLocks.get(scopeKey) ?? Promise.resolve());
  return readBenchmarkSignoffStateUnsafe(scopeKey, userId);
}

export async function writeBenchmarkSignoffState(state: BenchmarkSignoffState, scopeKey = "shared", userId = "anonymous") {
  return withScopeLock(scopeKey, () => writeBenchmarkSignoffStateUnsafe(state, scopeKey, userId));
}

export async function updateBenchmarkSignoffDraft(
  draft: Partial<BenchmarkSignoffDraft>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  return withScopeLock(scopeKey, async () => {
    const current = await readBenchmarkSignoffStateUnsafe(scopeKey, userId);
    return writeBenchmarkSignoffStateUnsafe(
      {
        ...current,
        draft: normalizeDraft({
          ...current.draft,
          ...draft
        })
      },
      scopeKey,
      userId
    );
  });
}

export async function saveBenchmarkSignoff(
  draft: Partial<BenchmarkSignoffDraft>,
  evidence: ReturnTypeOfBenchmarkEvidence,
  scopeKey = "shared",
  userId = "anonymous"
) {
  return withScopeLock(scopeKey, async () => {
    const current = await readBenchmarkSignoffStateUnsafe(scopeKey, userId);
    const signedAt = new Date().toLocaleString("en-GB");
    const normalizedDraft = normalizeDraft({
      ...current.draft,
      ...draft,
      signedAt
    });
    const entry: BenchmarkSignoffEntry = {
      id: `benchmark-signoff-${Math.random().toString(36).slice(2, 10)}`,
      userId,
      ...normalizedDraft,
      generatedAt: evidence.generatedAt,
      benchmarkedCases: evidence.summary.benchmarkedCases,
      passedCases: evidence.summary.passedCases,
      failedCases: evidence.summary.failedCases,
      openBenchmarkActions: evidence.summary.openBenchmarkActions,
      resolvedBenchmarkActions: evidence.summary.resolvedBenchmarkActions
    };

    return writeBenchmarkSignoffStateUnsafe(
      {
        userId,
        draft: normalizedDraft,
        archive: [entry, ...current.archive].slice(0, 25)
      },
      scopeKey,
      userId
    );
  });
}
