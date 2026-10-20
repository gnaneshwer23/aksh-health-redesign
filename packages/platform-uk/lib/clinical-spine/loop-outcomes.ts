/**
 * What the agent loop produced and what clinicians did with it, for one organisation, as aggregates only (COMPASS,
 * FR-AGT-028: never a named or identifiable patient). Counts below SMALL_CELL are suppressed. These are also the
 * measures an agent's release criteria need: how often clinicians accept, edit or reject each agent's drafts.
 * Pure: the caller loads the organisation's agent-run review cases.
 */
import type { ReviewCase } from "../types";

export const SMALL_CELL = 5;

/** A count, or "fewer than 5" when small enough to risk identifying someone. */
export type Count = number | "<5";
export const suppress = (n: number): Count => (n > 0 && n < SMALL_CELL ? "<5" : n);

export type LoopOutcomes = {
  runs: Count;
  casesAccepted: Count;
  /** Per agent: drafts and clinician decisions. editRate is shown only when at least SMALL_CELL drafts were decided. */
  agents: { agent: string; drafts: Count; accepted: Count; edited: Count; rejected: Count; pending: Count; acceptedUneditedRate: number | null; rejectionRate: number | null }[];
  referrals: { domain: string; held: Count; drafted: Count; confirmed: Count }[];
  missingLabs: { lab: string; runs: Count }[];
  priority: { Urgent: Count; High: Count; Normal: Count };
  suppression: string;
};

/** Exact counts (internal: synthetic validation and release readiness). Population display uses summariseLoopOutcomes. */
export type LoopTally = {
  runs: number;
  casesAccepted: number;
  agents: Map<string, { drafts: number; accepted: number; edited: number; rejected: number; pending: number }>;
  referrals: Map<string, { held: number; drafted: number; confirmed: number }>;
  missing: Map<string, number>;
  priority: { Urgent: number; High: number; Normal: number };
};

export function tallyLoop(cases: ReviewCase[]): LoopTally {
  const seen = new Set<string>();
  const runs = cases.filter((c) => c.agentRun && !seen.has(c.id) && (seen.add(c.id), true));
  const agents: LoopTally["agents"] = new Map();
  const referrals: LoopTally["referrals"] = new Map();
  const missing = new Map<string, number>();
  const priority = { Urgent: 0, High: 0, Normal: 0 };
  for (const c of runs) {
    priority[c.agentRun!.queuePriority] += 1;
    for (const r of c.agentRun!.pendingReferrals) {
      const e = referrals.get(r.domain) ?? { held: 0, drafted: 0, confirmed: 0 };
      e.held += 1;
      referrals.set(r.domain, e);
    }
    for (const m of c.agentRun!.missingLabs) {
      const lab = m.replace(/ (not on record|out of date.*)$/, "");
      missing.set(lab, (missing.get(lab) ?? 0) + 1);
    }
    for (const i of c.reviewQueueItems ?? []) {
      const agent = String(i.metadata?.agent ?? i.agentId);
      const a = agents.get(agent) ?? { drafts: 0, accepted: 0, edited: 0, rejected: 0, pending: 0 };
      a.drafts += 1;
      if (i.status === "ACCEPTED") a.accepted += 1;
      else if (i.status === "REJECTED") a.rejected += 1;
      else a.pending += 1;
      if (i.originalContent !== undefined) a.edited += 1;
      agents.set(agent, a);
      if (i.itemType === "referral_package") {
        const domain = String(i.metadata?.domain ?? "other");
        const e = referrals.get(domain) ?? { held: 0, drafted: 0, confirmed: 0 };
        e.drafted += 1;
        if (i.status === "ACCEPTED") e.confirmed += 1;
        referrals.set(domain, e);
      }
    }
  }
  return { runs: runs.length, casesAccepted: runs.filter((c) => c.status === "accepted").length, agents, referrals, missing, priority };
}

export function summariseLoopOutcomes(cases: ReviewCase[]): LoopOutcomes {
  const t = tallyLoop(cases);
  const rate = (n: number, d: number) => (d >= SMALL_CELL ? Math.round((n / d) * 100) / 100 : null);
  return {
    runs: suppress(t.runs),
    casesAccepted: suppress(t.casesAccepted),
    agents: [...t.agents.entries()]
      .sort((x, y) => y[1].drafts - x[1].drafts)
      .map(([agent, a]) => {
        const decided = a.accepted + a.rejected;
        return {
          agent,
          drafts: suppress(a.drafts),
          accepted: suppress(a.accepted),
          edited: suppress(a.edited),
          rejected: suppress(a.rejected),
          pending: suppress(a.pending),
          acceptedUneditedRate: rate(a.accepted - Math.min(a.edited, a.accepted), decided),
          rejectionRate: rate(a.rejected, decided),
        };
      }),
    referrals: [...t.referrals.entries()].map(([domain, r]) => ({ domain, held: suppress(r.held), drafted: suppress(r.drafted), confirmed: suppress(r.confirmed) })),
    missingLabs: [...t.missing.entries()].sort((x, y) => y[1] - x[1]).map(([lab, n]) => ({ lab, runs: suppress(n) })),
    priority: { Urgent: suppress(t.priority.Urgent), High: suppress(t.priority.High), Normal: suppress(t.priority.Normal) },
    suppression: `Counts from 1 to ${SMALL_CELL - 1} are shown as "<5"; rates need at least ${SMALL_CELL} decided drafts. No patient is named.`,
  };
}
