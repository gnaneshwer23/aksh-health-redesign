import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { defaultFeedbackDraft, type FeedbackDraft, type FeedbackEntry, type FeedbackState } from "./feedback-types";

const dataDir = path.join(process.cwd(), "data");

function resolveDataFile(scopeKey = "shared") {
  if (scopeKey === "shared") {
    return path.join(dataDir, "feedback-state.json");
  }

  return path.join(dataDir, `feedback-state.${scopeKey}.json`);
}

function buildDefaultState(userId = "anonymous"): FeedbackState {
  return {
    userId,
    draft: {
      ...defaultFeedbackDraft
    },
    archive: []
  };
}

function normalizeDraft(draft: Partial<FeedbackDraft> | undefined): FeedbackDraft {
  return {
    audience: draft?.audience ?? defaultFeedbackDraft.audience,
    sessionType: draft?.sessionType ?? defaultFeedbackDraft.sessionType,
    relatedCaseId: draft?.relatedCaseId ?? defaultFeedbackDraft.relatedCaseId,
    followUpOwner: draft?.followUpOwner ?? defaultFeedbackDraft.followUpOwner,
    dueDate: draft?.dueDate ?? defaultFeedbackDraft.dueDate,
    nextCheckpoint: draft?.nextCheckpoint ?? defaultFeedbackDraft.nextCheckpoint,
    overdueNote: draft?.overdueNote ?? defaultFeedbackDraft.overdueNote,
    readinessScore: draft?.readinessScore ?? defaultFeedbackDraft.readinessScore,
    strongestMoment: draft?.strongestMoment ?? defaultFeedbackDraft.strongestMoment,
    confusionPoint: draft?.confusionPoint ?? defaultFeedbackDraft.confusionPoint,
    objections: draft?.objections ?? defaultFeedbackDraft.objections,
    nextActions: draft?.nextActions ?? defaultFeedbackDraft.nextActions,
    savedAt: draft?.savedAt ?? defaultFeedbackDraft.savedAt
  };
}

function normalizeState(raw: Partial<FeedbackState> | undefined, userId = "anonymous"): FeedbackState {
  return {
    userId: raw?.userId ?? userId,
    draft: normalizeDraft(raw?.draft),
    archive: Array.isArray(raw?.archive)
      ? raw.archive.map((entry) => ({
          ...entry,
          userId: entry.userId ?? userId,
          resolutionStatus: entry.resolutionStatus === "resolved" ? "resolved" : "open",
          resolvedAt: entry.resolvedAt ?? null,
          resolutionNote: entry.resolutionNote ?? "",
          followUpOwner: entry.followUpOwner ?? defaultFeedbackDraft.followUpOwner,
          dueDate: entry.dueDate ?? defaultFeedbackDraft.dueDate,
          nextCheckpoint: entry.nextCheckpoint ?? defaultFeedbackDraft.nextCheckpoint,
          overdueNote: entry.overdueNote ?? defaultFeedbackDraft.overdueNote
        }))
      : []
  };
}

async function ensureDataFile(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(buildDefaultState(userId), null, 2), "utf8");
  }
}

export async function readFeedbackState(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const raw = await readFile(dataFile, "utf8");
  return normalizeState(JSON.parse(raw) as Partial<FeedbackState>, userId);
}

export async function readFeedbackEntriesForCase(caseId: string, scopeKey = "shared", userId?: string) {
  const state = await readFeedbackState(scopeKey, userId);
  
  // Ownership validation: only return entries that belong to the user
  if (userId && state.userId !== userId) {
    throw new Error(`Unauthorized: User ${userId} does not own feedback state`);
  }
  
  return state.archive.filter((entry) => entry.relatedCaseId === caseId);
}

export async function writeFeedbackState(state: FeedbackState, scopeKey = "shared", userId?: string) {
  // Ownership validation
  if (userId && state.userId && state.userId !== userId && state.userId !== "anonymous") {
    throw new Error(`Unauthorized: User ${userId} cannot modify feedback owned by ${state.userId}`);
  }

  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId || state.userId);
  const normalized = normalizeState(state, userId || state.userId);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function updateFeedbackDraft(draft: Partial<FeedbackDraft>, scopeKey = "shared", userId = "anonymous") {
  const current = await readFeedbackState(scopeKey, userId);
  return writeFeedbackState({
    ...current,
    draft: normalizeDraft({
      ...current.draft,
      ...draft
    })
  }, scopeKey, userId);
}

export async function saveFeedbackSession(draft: Partial<FeedbackDraft>, scopeKey = "shared", userId = "anonymous") {
  const current = await readFeedbackState(scopeKey, userId);
  const normalizedDraft = normalizeDraft({
    ...current.draft,
    ...draft,
    savedAt: new Date().toLocaleString("en-GB")
  });
  const entry: FeedbackEntry = {
    id: `feedback-${Math.random().toString(36).slice(2, 10)}`,
    userId: userId || "anonymous",
    ...normalizedDraft,
    resolutionStatus: "open",
    resolvedAt: null,
    resolutionNote: ""
  };

  return writeFeedbackState({
    userId: userId || "anonymous",
    draft: normalizedDraft,
    archive: [entry, ...current.archive].slice(0, 50)
  }, scopeKey, userId);
}

export async function clearFeedbackArchive(scopeKey = "shared", userId = "anonymous") {
  const current = await readFeedbackState(scopeKey, userId);
  return writeFeedbackState({
    ...current,
    archive: []
  }, scopeKey, userId);
}

export async function resetFeedbackDraft(scopeKey = "shared", userId = "anonymous") {
  const current = await readFeedbackState(scopeKey, userId);
  return writeFeedbackState({
    ...current,
    draft: {
      ...current.draft,
      strongestMoment: "",
      confusionPoint: "",
      objections: "",
      nextActions: "",
      savedAt: new Date().toLocaleString("en-GB")
    }
  }, scopeKey, userId);
}

export async function updateFeedbackResolution(
  id: string,
  resolutionStatus: FeedbackEntry["resolutionStatus"],
  resolutionNote?: string,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readFeedbackState(scopeKey, userId);

  return writeFeedbackState({
    ...current,
    archive: current.archive.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            resolutionStatus,
            resolvedAt: resolutionStatus === "resolved" ? new Date().toLocaleString("en-GB") : null,
            resolutionNote: resolutionNote ?? entry.resolutionNote ?? ""
          }
        : entry
    )
  }, scopeKey, userId);
}

export async function updateFeedbackFollowUp(
  id: string,
  updates: Partial<Pick<FeedbackEntry, "followUpOwner" | "dueDate" | "nextCheckpoint" | "overdueNote">>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readFeedbackState(scopeKey, userId);

  return writeFeedbackState({
    ...current,
    archive: current.archive.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            followUpOwner: updates.followUpOwner ?? entry.followUpOwner,
            dueDate: updates.dueDate ?? entry.dueDate,
            nextCheckpoint: updates.nextCheckpoint ?? entry.nextCheckpoint,
            overdueNote: updates.overdueNote ?? entry.overdueNote
          }
        : entry
    )
  }, scopeKey, userId);
}
