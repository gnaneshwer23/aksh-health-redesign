import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type { buildEvidenceReadinessPayload } from "./readiness-evidence";
import type { EvidenceReadinessHistoryState, EvidenceReadinessSnapshot } from "./readiness-history-types";

const dataDir = path.join(process.cwd(), "data");

function resolveDataFile(scopeKey = "shared") {
  if (scopeKey === "shared") {
    return path.join(dataDir, "readiness-history.json");
  }

  return path.join(dataDir, `readiness-history.${scopeKey}.json`);
}

function buildDefaultState(userId = "anonymous"): EvidenceReadinessHistoryState {
  return {
    userId,
    archive: []
  };
}

function normalizeSnapshot(snapshot: Partial<EvidenceReadinessSnapshot>, userId: string): EvidenceReadinessSnapshot | null {
  if (!snapshot.gate || !snapshot.dataHealth || !snapshot.benchmarkSummary || !snapshot.actionSummary) {
    return null;
  }

  return {
    ...(snapshot as ReturnType<typeof buildEvidenceReadinessPayload>),
    id: snapshot.id ?? `readiness-${Math.random().toString(36).slice(2, 10)}`,
    userId: snapshot.userId ?? userId,
    savedAt: snapshot.savedAt ?? snapshot.generatedAt ?? new Date().toLocaleString("en-GB")
  };
}

function normalizeState(raw: Partial<EvidenceReadinessHistoryState> | undefined, userId = "anonymous"): EvidenceReadinessHistoryState {
  return {
    userId: raw?.userId ?? userId,
    archive: Array.isArray(raw?.archive)
      ? raw.archive
          .map((snapshot) => normalizeSnapshot(snapshot, userId))
          .filter((snapshot): snapshot is EvidenceReadinessSnapshot => Boolean(snapshot))
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

export async function readEvidenceReadinessHistory(scopeKey = "shared", userId = "anonymous") {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const raw = await readFile(dataFile, "utf8");
  return normalizeState(JSON.parse(raw) as Partial<EvidenceReadinessHistoryState>, userId);
}

export async function writeEvidenceReadinessHistory(
  state: EvidenceReadinessHistoryState,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const dataFile = resolveDataFile(scopeKey);
  await ensureDataFile(scopeKey, userId);
  const normalized = normalizeState(state, userId);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function saveEvidenceReadinessSnapshot(
  payload: ReturnType<typeof buildEvidenceReadinessPayload>,
  scopeKey = "shared",
  userId = "anonymous"
) {
  const current = await readEvidenceReadinessHistory(scopeKey, userId);
  const snapshot: EvidenceReadinessSnapshot = {
    ...payload,
    id: `readiness-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    savedAt: new Date().toLocaleString("en-GB")
  };

  return writeEvidenceReadinessHistory(
    {
      userId,
      archive: [snapshot, ...current.archive].slice(0, 25)
    },
    scopeKey,
    userId
  );
}
