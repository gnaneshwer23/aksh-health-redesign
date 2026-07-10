import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  defaultM1ChecklistItems,
  defaultRoadmapTrackerItems,
  type M1ActionResolution,
  type M1ActionResolutionStatus,
  type M1ChecklistItem,
  type RoadmapBuildStatus,
  type RoadmapHistoryEntry,
  type RoadmapRisk,
  type RoadmapTrackerItem,
  type RoadmapTrackerState
} from "./roadmap";

const dataDir = path.join(process.cwd(), "data");

function resolveDataFile(scopeKey = "shared") {
  if (scopeKey === "shared") {
    return path.join(dataDir, "roadmap-state.json");
  }

  return path.join(dataDir, `roadmap-state.${scopeKey}.json`);
}

function nowStamp() {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoStamp() {
  return new Date().toISOString();
}

function isBuildStatus(value: unknown): value is RoadmapBuildStatus {
  return value === "built" || value === "partial" || value === "planned" || value === "not_started" || value === "blocked";
}

function isRisk(value: unknown): value is RoadmapRisk {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function isM1ActionResolutionStatus(value: unknown): value is M1ActionResolutionStatus {
  return value === "accepted" || value === "done" || value === "deferred" || value === "not_needed";
}

function buildDefaultState(userId = "anonymous"): RoadmapTrackerState {
  return {
    userId,
    updatedAt: nowStamp(),
    items: defaultRoadmapTrackerItems.map((item) => ({ ...item })),
    m1Checklist: defaultM1ChecklistItems.map((item) => ({ ...item })),
    m1ActionResolutions: [],
    history: []
  };
}

function normalizeItem(raw: Partial<RoadmapTrackerItem> | undefined, fallback: RoadmapTrackerItem): RoadmapTrackerItem {
  return {
    id: fallback.id,
    owner: raw?.owner ?? fallback.owner,
    dueDate: raw?.dueDate ?? fallback.dueDate,
    buildStatus: isBuildStatus(raw?.buildStatus) ? raw.buildStatus : fallback.buildStatus,
    risk: isRisk(raw?.risk) ? raw.risk : fallback.risk,
    evidenceLink: raw?.evidenceLink ?? fallback.evidenceLink,
    notes: raw?.notes ?? fallback.notes,
    lastUpdated: raw?.lastUpdated ?? fallback.lastUpdated
  };
}

function normalizeM1ChecklistItem(raw: Partial<M1ChecklistItem> | undefined, fallback: M1ChecklistItem): M1ChecklistItem {
  return {
    id: fallback.id,
    week: raw?.week ?? fallback.week,
    title: raw?.title ?? fallback.title,
    owner: raw?.owner ?? fallback.owner,
    dueDate: raw?.dueDate ?? fallback.dueDate,
    doneWhen: raw?.doneWhen ?? fallback.doneWhen,
    buildStatus: isBuildStatus(raw?.buildStatus) ? raw.buildStatus : fallback.buildStatus,
    risk: isRisk(raw?.risk) ? raw.risk : fallback.risk,
    evidenceLink: raw?.evidenceLink ?? fallback.evidenceLink,
    notes: raw?.notes ?? fallback.notes,
    lastUpdated: raw?.lastUpdated ?? fallback.lastUpdated
  };
}

function normalizeState(raw: Partial<RoadmapTrackerState> | undefined, userId = "anonymous"): RoadmapTrackerState {
  const rawById = new Map((raw?.items ?? []).map((item) => [item.id, item]));
  const rawM1ById = new Map((raw?.m1Checklist ?? []).map((item) => [item.id, item]));

  return {
    userId: raw?.userId ?? userId,
    updatedAt: raw?.updatedAt ?? nowStamp(),
    items: defaultRoadmapTrackerItems.map((fallback) => normalizeItem(rawById.get(fallback.id), fallback)),
    m1Checklist: defaultM1ChecklistItems.map((fallback) => normalizeM1ChecklistItem(rawM1ById.get(fallback.id), fallback)),
    m1ActionResolutions: Array.isArray(raw?.m1ActionResolutions)
      ? raw.m1ActionResolutions.map(normalizeM1ActionResolution).filter(Boolean).slice(0, 100) as M1ActionResolution[]
      : [],
    history: Array.isArray(raw?.history) ? raw.history.map(normalizeHistoryEntry).filter(Boolean).slice(0, 100) as RoadmapHistoryEntry[] : []
  };
}

function normalizeM1ActionResolution(raw: Partial<M1ActionResolution> | undefined) {
  if (!raw?.actionId || !raw.itemId || !raw.owner || !isM1ActionResolutionStatus(raw.status)) {
    return null;
  }

  return {
    actionId: raw.actionId,
    itemId: raw.itemId,
    owner: raw.owner,
    status: raw.status,
    note: raw.note ?? "",
    nextStep: raw.nextStep ?? "",
    targetDate: raw.targetDate ?? "",
    blockedReason: raw.blockedReason ?? "",
    followThroughEvidenceLink: raw.followThroughEvidenceLink ?? "",
    resolvedAt: raw.resolvedAt ?? nowIsoStamp(),
    resolvedBy: raw.resolvedBy ?? "anonymous"
  } satisfies M1ActionResolution;
}

function normalizeHistoryEntry(raw: Partial<RoadmapHistoryEntry> | undefined) {
  if (!raw?.id || !raw.itemId || !Array.isArray(raw.changes)) {
    return null;
  }

  return {
    id: raw.id,
    itemId: raw.itemId,
    changedAt: raw.changedAt ?? nowIsoStamp(),
    changedBy: raw.changedBy ?? "anonymous",
    summary: raw.summary ?? "Roadmap item updated",
    changes: raw.changes
      .filter((change) => change?.field && typeof change.before === "string" && typeof change.after === "string")
      .map((change) => ({
        field: change.field,
        before: change.before,
        after: change.after
      }))
  } satisfies RoadmapHistoryEntry;
}

function buildChangeSet(previous: RoadmapTrackerItem, next: RoadmapTrackerItem): RoadmapHistoryEntry["changes"] {
  const fields: Array<keyof Omit<RoadmapTrackerItem, "id" | "lastUpdated">> = [
    "owner",
    "dueDate",
    "buildStatus",
    "risk",
    "evidenceLink",
    "notes"
  ];

  return fields
    .filter((field) => previous[field] !== next[field])
    .map((field) => ({
      field,
      before: String(previous[field] ?? ""),
      after: String(next[field] ?? "")
    }));
}

function buildM1ChangeSet(previous: M1ChecklistItem, next: M1ChecklistItem): RoadmapHistoryEntry["changes"] {
  const fields: Array<keyof Omit<RoadmapTrackerItem, "id" | "lastUpdated">> = [
    "owner",
    "dueDate",
    "buildStatus",
    "risk",
    "evidenceLink",
    "notes"
  ];

  return fields
    .filter((field) => previous[field] !== next[field])
    .map((field) => ({
      field,
      before: String(previous[field] ?? ""),
      after: String(next[field] ?? "")
    }));
}

function summarizeChangeSet(changes: RoadmapHistoryEntry["changes"]) {
  if (changes.length === 1) {
    return `${changes[0].field} changed`;
  }

  return `${changes.length} fields changed`;
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

export async function readRoadmapState(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const raw = await readFile(dataFile, "utf8");
  return normalizeState(JSON.parse(raw) as Partial<RoadmapTrackerState>, userId);
}

export async function writeRoadmapState(state: RoadmapTrackerState, scopeKey = "shared", userId?: string) {
  if (userId && state.userId && state.userId !== userId && state.userId !== "anonymous") {
    throw new Error(`Unauthorized: User ${userId} cannot modify roadmap owned by ${state.userId}`);
  }

  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId || state.userId);
  const normalized = normalizeState(
    {
      ...state,
      userId: userId || state.userId,
      updatedAt: nowStamp()
    },
    userId || state.userId
  );
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function updateRoadmapItem(
  id: string,
  updates: Partial<Omit<RoadmapTrackerItem, "id">>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readRoadmapState(scopeKey, userId);
  let historyEntry: RoadmapHistoryEntry | null = null;
  const nextItems = current.items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const nextItem = {
      ...item,
      owner: updates.owner ?? item.owner,
      dueDate: updates.dueDate ?? item.dueDate,
      buildStatus: updates.buildStatus ?? item.buildStatus,
      risk: updates.risk ?? item.risk,
      evidenceLink: updates.evidenceLink ?? item.evidenceLink,
      notes: updates.notes ?? item.notes,
      lastUpdated: nowStamp()
    };
    const changes = buildChangeSet(item, nextItem);

    if (changes.length) {
      historyEntry = {
        id: `roadmap-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemId: id,
        changedAt: nowIsoStamp(),
        changedBy: userId,
        summary: summarizeChangeSet(changes),
        changes
      };
    }

    return changes.length ? nextItem : item;
  });

  return writeRoadmapState(
    {
      ...current,
      items: nextItems,
      history: historyEntry ? [historyEntry, ...current.history].slice(0, 100) : current.history
    },
    scopeKey,
    userId
  );
}

export async function updateM1ChecklistItem(
  id: string,
  updates: Partial<Omit<M1ChecklistItem, "id" | "week" | "title" | "doneWhen">>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readRoadmapState(scopeKey, userId);
  let historyEntry: RoadmapHistoryEntry | null = null;
  const nextChecklist = current.m1Checklist.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const nextItem = {
      ...item,
      owner: updates.owner ?? item.owner,
      dueDate: updates.dueDate ?? item.dueDate,
      buildStatus: updates.buildStatus ?? item.buildStatus,
      risk: updates.risk ?? item.risk,
      evidenceLink: updates.evidenceLink ?? item.evidenceLink,
      notes: updates.notes ?? item.notes,
      lastUpdated: nowStamp()
    };
    const changes = buildM1ChangeSet(item, nextItem);

    if (changes.length) {
      historyEntry = {
        id: `roadmap-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        itemId: id,
        changedAt: nowIsoStamp(),
        changedBy: userId,
        summary: `M1 checklist ${summarizeChangeSet(changes)}`,
        changes
      };
    }

    return changes.length ? nextItem : item;
  });

  return writeRoadmapState(
    {
      ...current,
      m1Checklist: nextChecklist,
      history: historyEntry ? [historyEntry, ...current.history].slice(0, 100) : current.history
    },
    scopeKey,
    userId
  );
}

export async function resolveM1GeneratedAction(
  resolution: Pick<M1ActionResolution, "actionId" | "itemId" | "owner" | "status" | "note"> &
    Partial<Pick<M1ActionResolution, "nextStep" | "targetDate" | "blockedReason" | "followThroughEvidenceLink">>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readRoadmapState(scopeKey, userId);
  const previousResolution = current.m1ActionResolutions.find((item) => item.actionId === resolution.actionId);
  const nextResolution: M1ActionResolution = {
    actionId: resolution.actionId,
    itemId: resolution.itemId,
    owner: resolution.owner,
    status: resolution.status,
    note: resolution.note.trim(),
    nextStep: resolution.nextStep?.trim() ?? previousResolution?.nextStep ?? "",
    targetDate: resolution.targetDate ?? previousResolution?.targetDate ?? "",
    blockedReason: resolution.blockedReason?.trim() ?? previousResolution?.blockedReason ?? "",
    followThroughEvidenceLink: resolution.followThroughEvidenceLink?.trim() ?? previousResolution?.followThroughEvidenceLink ?? "",
    resolvedAt: nowIsoStamp(),
    resolvedBy: userId
  };
  const nextResolutions = [
    nextResolution,
    ...current.m1ActionResolutions.filter((item) => item.actionId !== resolution.actionId)
  ].slice(0, 100);
  const historyEntry: RoadmapHistoryEntry = {
    id: `roadmap-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: resolution.itemId,
    changedAt: nextResolution.resolvedAt,
    changedBy: userId,
    summary: `M1 action ${previousResolution ? "resolution updated" : "resolved"}`,
    changes: [
      {
        field: "notes",
        before: previousResolution ? `${previousResolution.status}: ${previousResolution.note}` : "",
        after: `${nextResolution.status}: ${nextResolution.note}`
      }
    ]
  };

  return writeRoadmapState(
    {
      ...current,
      m1ActionResolutions: nextResolutions,
      history: [historyEntry, ...current.history].slice(0, 100)
    },
    scopeKey,
    userId
  );
}

export async function resetM1GeneratedAction(actionId: string, scopeKey = "shared", userId = "anonymous") {
  const current = await readRoadmapState(scopeKey, userId);
  const previousResolution = current.m1ActionResolutions.find((item) => item.actionId === actionId);

  if (!previousResolution) {
    return current;
  }

  const historyEntry: RoadmapHistoryEntry = {
    id: `roadmap-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: previousResolution.itemId,
    changedAt: nowIsoStamp(),
    changedBy: userId,
    summary: "M1 action resolution cleared",
    changes: [
      {
        field: "notes",
        before: `${previousResolution.status}: ${previousResolution.note}`,
        after: ""
      }
    ]
  };

  return writeRoadmapState(
    {
      ...current,
      m1ActionResolutions: current.m1ActionResolutions.filter((item) => item.actionId !== actionId),
      history: [historyEntry, ...current.history].slice(0, 100)
    },
    scopeKey,
    userId
  );
}

export async function resetRoadmapState(scopeKey = "shared", userId = "anonymous") {
  return writeRoadmapState(buildDefaultState(userId), scopeKey, userId);
}
