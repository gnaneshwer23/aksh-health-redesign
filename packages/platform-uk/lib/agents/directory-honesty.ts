/**
 * Milestone C5 — directory ↔ register ↔ Agent Ops status alignment.
 * Path kinds: live_path (product surface, still in_validation) | scaffold | sim.
 * Never labels anything "production ready".
 */

import { AGENT_DIRECTORY } from "../agents";
import { AGENTS, type AgentId } from "./register";
import { getAtlasCapabilityStatus, getPrismCapabilityStatus } from "./phase2-capability-status";

/** Honest runtime path for evaluators — not a go-live claim. */
export type DirectoryPathKind = "live_path" | "scaffold" | "sim";

export type DirectoryHonestyRow = {
  id: string;
  productName: string;
  directoryStatus: string;
  registerStatus: string;
  directoryLive: boolean;
  pathKind: DirectoryPathKind;
  honestyLabel: string;
  aligned: boolean;
  inDirectory: boolean;
  note: string;
};

const PATH_KIND_LABEL: Record<DirectoryPathKind, string> = {
  live_path: "live-path (in_validation · not production ready)",
  scaffold: "scaffold (synthetic eval · not CONDUCTOR actor)",
  sim: "sim (sandbox / adjacent · not go-live)",
};

function pathKindForDirectoryEntry(name: string, live: boolean, phase: number): DirectoryPathKind {
  if (name === "PRISM" || name === "ATLAS" || phase === 2 || !live) return "scaffold";
  // COMPASS has a product surface but ICS briefs remain sandbox decision-support.
  if (name === "COMPASS") return "sim";
  return "live_path";
}

/**
 * Build aligned honesty rows for the 12-agent directory + register contracts.
 * Sub-capabilities (VOICE, DrASSIST) and VOICE CARE are listed separately for ops panels.
 */
export function buildDirectoryRegisterAlignment(): DirectoryHonestyRow[] {
  const registerById = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  const phase2 = {
    PRISM: getPrismCapabilityStatus(),
    ATLAS: getAtlasCapabilityStatus(),
  } as const;

  const rows: DirectoryHonestyRow[] = AGENT_DIRECTORY.map((d) => {
    const reg = registerById[d.name];
    const pathKind = pathKindForDirectoryEntry(d.name, d.live, d.phase);
    const registerStatus: string = reg?.status ?? "missing";
    const statusMatch = registerStatus === d.status;
    const modelMatch = (reg?.modelFlag ?? null) === d.modelFlag;
    const scaffoldOk =
      pathKind !== "scaffold" ||
      (phase2[d.name as "PRISM" | "ATLAS"]?.live === false && d.live === false);
    const notProduction = registerStatus !== "production";

    return {
      id: d.name,
      productName: reg?.productName ?? d.name,
      directoryStatus: d.status,
      registerStatus,
      directoryLive: d.live,
      pathKind,
      honestyLabel: PATH_KIND_LABEL[pathKind],
      aligned: Boolean(reg) && statusMatch && modelMatch && scaffoldOk && notProduction,
      inDirectory: true,
      note:
        pathKind === "scaffold"
          ? "P4 L2 scaffold · live:false · omitted from Agent Ops live strip"
          : pathKind === "sim"
            ? "On-request sandbox brief · decision-support · not certified ICS routing"
            : "Product surface present · status in_validation · not production ready",
    };
  });

  // Adjacent / sub-capability honesty rows (not directory peers).
  const voice = registerById.VOICE;
  const dr = registerById.DrASSIST;
  rows.push(
    {
      id: "VOICE",
      productName: voice?.productName ?? "Aksh Voice",
      directoryStatus: "not_a_peer",
      registerStatus: voice?.status ?? "missing",
      directoryLive: false,
      pathKind: "live_path",
      honestyLabel: "sub-capability of CANVAS (not directory peer)",
      aligned: Boolean(voice) && voice.status === "in_validation",
      inDirectory: false,
      note: "Dictation intake · ≠ VOICE CARE",
    },
    {
      id: "DrASSIST",
      productName: dr?.productName ?? "DrAssist AI",
      directoryStatus: "not_a_peer",
      registerStatus: dr?.status ?? "missing",
      directoryLive: false,
      pathKind: "live_path",
      honestyLabel: "sub-capability of SYNTHESIS (not directory peer)",
      aligned: Boolean(dr) && dr.status === "in_validation",
      inDirectory: false,
      note: "Coding drafts under SYNTHESIS",
    },
    {
      id: "VOICE_CARE",
      productName: "VOICE CARE",
      directoryStatus: "not_a_peer",
      registerStatus: "adjacent_sim",
      directoryLive: false,
      pathKind: "sim",
      honestyLabel: PATH_KIND_LABEL.sim,
      aligned: true,
      inDirectory: false,
      note: "Synthetic Day-3 outbound · no telephony · ≠ VOICE dictation",
    }
  );

  return rows;
}

function claimsProductionReady(label: string): boolean {
  // Allow explicit negations ("not production ready") while rejecting bare oversell.
  if (/\bnot\s+production\s+ready\b/i.test(label)) return false;
  return /\bproduction\s+ready\b/i.test(label);
}

export function assertDirectoryRegisterAligned(): { ok: true } | { ok: false; failures: string[] } {
  const failures: string[] = [];
  for (const row of buildDirectoryRegisterAlignment()) {
    if (!row.aligned) {
      failures.push(
        `${row.id}: directory=${row.directoryStatus} register=${row.registerStatus} path=${row.pathKind}`
      );
    }
    if (row.registerStatus === "production" || claimsProductionReady(row.honestyLabel)) {
      failures.push(`${row.id}: must not claim production ready`);
    }
  }
  // Directory peers must all exist in register.
  for (const d of AGENT_DIRECTORY) {
    if (!AGENTS.some((a) => a.id === (d.name as AgentId))) {
      failures.push(`${d.name}: missing from register`);
    }
  }
  return failures.length ? { ok: false, failures } : { ok: true };
}

export function directoryPathKindSummary(): Record<DirectoryPathKind, number> {
  const summary: Record<DirectoryPathKind, number> = { live_path: 0, scaffold: 0, sim: 0 };
  for (const row of buildDirectoryRegisterAlignment().filter((r) => r.inDirectory)) {
    summary[row.pathKind] += 1;
  }
  return summary;
}
