/**
 * Milestone A5 store mode — hermetic file-store by default; optional Neon when gated.
 *
 * Honesty:
 * - Default / local: clear DATABASE_URL + USE_POSTGRES so suites stay hermetic (json/file).
 * - Neon gate: set MILESTONE_A5_USE_NEON=1 with a real DATABASE_URL (CI throwaway branch or
 *   local Neon). Do **not** clear DATABASE_URL in that mode.
 *
 * Never points at production patient data. Controlled/synthetic test data only.
 */

export type MilestoneA5StoreMode = "file_store" | "neon";

export type MilestoneA5StoreSnapshot = {
  mode: MilestoneA5StoreMode;
  prevDb: string | undefined;
  prevUse: string | undefined;
  databaseUrlPresent: boolean;
};

/**
 * Apply A5 store env before dynamic imports that call isPostgresConfigured().
 * Call once at the top of the suite `main()` (or before first import).
 */
export function applyMilestoneA5StoreMode(): MilestoneA5StoreSnapshot {
  const prevDb = process.env.DATABASE_URL;
  const prevUse = process.env.USE_POSTGRES;
  const databaseUrlPresent = Boolean(prevDb?.trim());
  const wantNeon = process.env.MILESTONE_A5_USE_NEON === "1";

  if (wantNeon && databaseUrlPresent) {
    if (!process.env.USE_POSTGRES?.trim()) {
      process.env.USE_POSTGRES = "true";
    }
    return { mode: "neon", prevDb, prevUse, databaseUrlPresent };
  }

  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  return { mode: "file_store", prevDb, prevUse, databaseUrlPresent };
}

export function restoreMilestoneA5StoreMode(snap: MilestoneA5StoreSnapshot): void {
  if (snap.prevDb === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = snap.prevDb;
  if (snap.prevUse === undefined) delete process.env.USE_POSTGRES;
  else process.env.USE_POSTGRES = snap.prevUse;
}

export function milestoneA5NeonGateSkippedReason(): string | null {
  if (process.env.MILESTONE_A5_USE_NEON !== "1") {
    return "MILESTONE_A5_USE_NEON is not 1 — hermetic file-store path";
  }
  if (!process.env.DATABASE_URL?.trim()) {
    return "MILESTONE_A5_USE_NEON=1 but DATABASE_URL is empty — refusing Neon claim";
  }
  return null;
}
