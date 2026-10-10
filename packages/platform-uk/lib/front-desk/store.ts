import { patients } from "@/lib/mock-data/patients";
import { getPgPool, isPostgresConfigured } from "@/lib/db/client";

import { generateSlots, seedBookings } from "./calendar";
import type { FrontDeskState } from "./types";

/**
 * Front Desk state persistence.
 *
 * One JSON document per practice in `aksh.front_desk_state` (migration 016) with optimistic
 * versioning, so serverless instances share the same calendar, queues and drafts. When the
 * table is absent (migration not yet applied) it falls back to process memory and says so via
 * `storage`, rather than pretending to be durable.
 */

const PRACTICE_ID = "riverside-medical-centre";

export function londonToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

export function createInitialState(now = new Date()): FrontDeskState {
  const anchorDate = londonToday(now);
  const slots = generateSlots(anchorDate, 14);
  seedBookings(slots, patients.slice(0, 60).map((p) => p.id));
  const diabetic = patients.filter((p) => p.activeConditions.some((c) => /diabetes/i.test(c)));
  const at = now.toISOString();
  return {
    version: 0,
    practiceName: "Riverside Medical Centre (synthetic)",
    anchorDate,
    slots,
    waitlist: diabetic.slice(0, 6).map((p, i) => ({
      id: `wait-${p.id}`,
      patientId: p.id,
      type: i % 2 === 0 ? "diabetes_review" : "blood_test",
      priority: i < 2 ? "soon" : "routine",
      addedAt: new Date(now.getTime() - (i + 1) * 86_400_000).toISOString(),
      status: "waiting",
    })),
    workItems: [],
    drafts: [],
    campaigns: [],
    referrals: [],
    baseline: {
      lockedAt: at,
      label: "Synthetic baseline (illustrative, locked before go-live)",
      callsAnsweredPct: 56,
      avgWaitSeconds: 181,
      slotsFilledPct: 82,
      missedRebookedPct: 18,
      handOffPct: 100,
    },
    counters: { inboundContacts: 0, answeredByFrontDesk: 0 },
  };
}

type Storage = "postgres" | "memory";

const g = globalThis as unknown as { __akshFrontDesk?: FrontDeskState };

async function getPool() {
  return isPostgresConfigured() && process.env.DATABASE_URL?.trim() ? getPgPool() : null;
}

let tableKnown: boolean | null = null;
async function tableExists(p: import("pg").Pool) {
  if (tableKnown !== null) return tableKnown;
  try {
    const r = await p.query("select to_regclass('aksh.front_desk_state') as t");
    tableKnown = Boolean(r.rows[0]?.t);
  } catch {
    tableKnown = false;
  }
  return tableKnown;
}

function rollForward(state: FrontDeskState, now: Date) {
  // A new day regenerates the calendar so demo slots never sit in the past.
  if (state.anchorDate !== londonToday(now)) {
    const fresh = createInitialState(now);
    return { ...fresh, workItems: state.workItems, drafts: state.drafts, campaigns: state.campaigns, referrals: state.referrals, baseline: state.baseline, counters: state.counters, version: state.version };
  }
  return state;
}

export async function loadState(now = new Date()): Promise<{ state: FrontDeskState; storage: Storage }> {
  const p = await getPool();
  if (p && (await tableExists(p))) {
    const r = await p.query("select doc, version from aksh.front_desk_state where practice_id = $1", [PRACTICE_ID]);
    if (r.rows[0]) {
      const state = { ...(r.rows[0].doc as FrontDeskState), version: Number(r.rows[0].version) };
      return { state: rollForward(state, now), storage: "postgres" };
    }
    const fresh = createInitialState(now);
    await p.query(
      "insert into aksh.front_desk_state (practice_id, doc, version) values ($1, $2, 0) on conflict (practice_id) do nothing",
      [PRACTICE_ID, JSON.stringify(fresh)]
    );
    return { state: fresh, storage: "postgres" };
  }
  if (!g.__akshFrontDesk) g.__akshFrontDesk = createInitialState(now);
  g.__akshFrontDesk = rollForward(g.__akshFrontDesk, now);
  return { state: structuredClone(g.__akshFrontDesk), storage: "memory" };
}

export class ConcurrentUpdateError extends Error {}

export async function saveState(state: FrontDeskState): Promise<Storage> {
  const p = await getPool();
  if (p && (await tableExists(p))) {
    const r = await p.query(
      "update aksh.front_desk_state set doc = $2, version = version + 1, updated_at = now() where practice_id = $1 and version = $3",
      [PRACTICE_ID, JSON.stringify({ ...state, version: state.version + 1 }), state.version]
    );
    if (r.rowCount === 0) throw new ConcurrentUpdateError("Front Desk state changed; retry");
    return "postgres";
  }
  g.__akshFrontDesk = { ...state, version: state.version + 1 };
  return "memory";
}

/** Load → mutate → save with a few retries on version conflict. */
export async function mutateState<T>(fn: (s: FrontDeskState) => T, now = new Date()): Promise<{ result: T; state: FrontDeskState; storage: Storage }> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { state } = await loadState(now);
    const result = fn(state);
    try {
      const storage = await saveState(state);
      return { result, state: { ...state, version: state.version + 1 }, storage };
    } catch (e) {
      if (!(e instanceof ConcurrentUpdateError) || attempt === 3) throw e;
    }
  }
  throw new ConcurrentUpdateError("unreachable");
}

export async function resetState(now = new Date()) {
  const fresh = createInitialState(now);
  const p = await getPool();
  if (p && (await tableExists(p))) {
    await p.query(
      "insert into aksh.front_desk_state (practice_id, doc, version) values ($1, $2, 0) on conflict (practice_id) do update set doc = excluded.doc, version = aksh.front_desk_state.version + 1, updated_at = now()",
      [PRACTICE_ID, JSON.stringify(fresh)]
    );
    return "postgres" as const;
  }
  g.__akshFrontDesk = fresh;
  return "memory" as const;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
