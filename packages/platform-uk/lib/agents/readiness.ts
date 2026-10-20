/**
 * Release readiness: each agent's criteria (lib/agents/register.ts) measured against the agent loop's results
 * (lib/clinical-spine/loop-outcomes.ts tallyLoop). An agent is ready only when every numeric target is met on enough
 * decided drafts, its targets have been confirmed by the clinical safety officer, and every sign-off is recorded.
 * Measured on synthetic validation; nothing here enables an agent — release is a governed, human decision.
 */
import type { LoopTally } from "../clinical-spine/loop-outcomes";

import { AGENTS, type AgentId } from "./register";

export type Criterion = { name: string; target: string; actual: string; met: boolean };
export type AgentReadiness = { id: AgentId; productName: string; status: string; ready: boolean; criteria: Criterion[]; outstanding: string[] };

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function evaluateReadiness(tally: LoopTally, recordedSignOffs: Partial<Record<AgentId, string[]>> = {}): AgentReadiness[] {
  return AGENTS.filter((a) => a.release).map((a) => {
    const r = a.release!;
    const criteria: Criterion[] = [];
    const t = r.tallyName ? tally.agents.get(r.tallyName) ?? { drafts: 0, accepted: 0, edited: 0, rejected: 0, pending: 0 } : null;
    const decided = t ? t.accepted + t.rejected : 0;
    if (r.minDecided !== undefined) criteria.push({ name: "Decided drafts", target: `≥ ${r.minDecided}`, actual: String(decided), met: decided >= r.minDecided });
    const enough = r.minDecided === undefined || decided >= r.minDecided;
    if (r.maxRejectionRate !== undefined && t) {
      const v = decided ? t.rejected / decided : NaN;
      criteria.push({ name: "Rejection rate", target: `≤ ${pct(r.maxRejectionRate)}`, actual: decided ? pct(v) : "no decisions", met: enough && decided > 0 && v <= r.maxRejectionRate });
    }
    if (r.minAcceptedUneditedRate !== undefined && t) {
      const v = decided ? (t.accepted - Math.min(t.edited, t.accepted)) / decided : NaN;
      criteria.push({ name: "Accepted without edits", target: `≥ ${pct(r.minAcceptedUneditedRate)}`, actual: decided ? pct(v) : "no decisions", met: enough && decided > 0 && v >= r.minAcceptedUneditedRate });
    }
    if (r.minConfirmationRate !== undefined) {
      const drafted = [...tally.referrals.values()].reduce((n, x) => n + x.drafted, 0);
      const confirmed = [...tally.referrals.values()].reduce((n, x) => n + x.confirmed, 0);
      criteria.push({ name: "Referral drafts confirmed", target: `≥ ${pct(r.minConfirmationRate)}`, actual: drafted ? pct(confirmed / drafted) : "none drafted", met: enough && drafted > 0 && confirmed / drafted >= r.minConfirmationRate });
    }
    criteria.push({ name: "Targets confirmed by the clinical safety officer", target: "recorded", actual: r.targetsConfirmedBy ? `${r.targetsConfirmedBy.name}, ${r.targetsConfirmedBy.date}` : "proposed only", met: Boolean(r.targetsConfirmedBy) });
    const done = new Set(recordedSignOffs[a.id] ?? []);
    for (const s of r.signOffs) criteria.push({ name: s, target: "signed", actual: done.has(s) ? "signed" : "not recorded", met: done.has(s) });
    const outstanding = criteria.filter((c) => !c.met).map((c) => `${c.name}: ${c.actual} (needs ${c.target})`);
    return { id: a.id, productName: a.productName, status: a.status, ready: outstanding.length === 0, criteria, outstanding };
  });
}
