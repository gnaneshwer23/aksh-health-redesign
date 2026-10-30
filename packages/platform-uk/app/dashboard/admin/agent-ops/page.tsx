"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AdminHeroDemoPath } from "@/components/dashboard/admin/AdminHeroDemoPath";
import { CompassBriefPanel } from "@/components/dashboard/admin/CompassBriefPanel";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

type ReadinessAgent = {
  id: string;
  productName: string;
  status: string;
  ready: boolean;
  outstanding: string[];
  criteria: { name: string; target: string; actual: string; met: boolean }[];
};

type LoopSummary = {
  runs: number | "<5";
  casesAccepted: number | "<5";
  agents: {
    agent: string;
    drafts: number | "<5";
    accepted: number | "<5";
    edited: number | "<5";
    rejected: number | "<5";
    pending: number | "<5";
    acceptedUneditedRate: number | null;
    rejectionRate: number | null;
  }[];
  missingLabs: { lab: string; runs: number | "<5" }[];
  suppression: string;
};

type OpsRunRow = {
  runId: string;
  status: string;
  patientRef: string;
  shieldBlockedEnqueue: boolean;
  draftEnqueueAllowed: boolean;
  guardianOutcome: string | null;
  correlationId: string;
  startedAt: string;
};

type OpsRunsSummary = {
  total: number;
  shieldBlockedCount: number;
  runningCount: number;
  failedOrTimedOutCount: number;
  byStatus: Record<string, number>;
  rows: OpsRunRow[];
  note?: string;
};

type OpsPayload = {
  readiness: {
    source: string;
    measuredOn: string;
    agentReviews: number;
    agents: ReadinessAgent[];
    note: string;
  } | null;
  loop: LoopSummary | null;
  durableRuns: OpsRunsSummary | null;
  honesty: {
    simulationOnly: true;
    acceptanceNotAccuracy: true;
    ehrWrite: false;
    phiLeakage: false;
  };
  error?: string;
};

function formatCount(c: number | "<5" | null | undefined) {
  if (c == null) return "—";
  return String(c);
}

function formatRate(r: number | null | undefined) {
  if (r == null) return "n/a (need ≥5 decided)";
  return `${Math.round(r * 100)}%`;
}

export default function AdminAgentOpsPage() {
  const [data, setData] = useState<OpsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [readyRes, equityRes, runsRes] = await Promise.all([
          fetch("/api/agents/readiness", { credentials: "include" }),
          fetch("/api/agents/equity", { credentials: "include" }),
          fetch("/api/agents/ops-runs?limit=20", { credentials: "include" }),
        ]);
        if (!readyRes.ok) {
          throw new Error(`readiness ${readyRes.status}`);
        }
        const readiness = await readyRes.json();
        let loop: LoopSummary | null = null;
        if (equityRes.ok) {
          const equity = await equityRes.json();
          loop = equity.loopOutcomes ?? equity.loop ?? null;
        }
        let durableRuns: OpsRunsSummary | null = null;
        if (runsRes.ok) {
          durableRuns = (await runsRes.json()) as OpsRunsSummary;
        }
        if (!cancelled) {
          setData({
            readiness,
            loop,
            durableRuns,
            honesty: {
              simulationOnly: true,
              acceptanceNotAccuracy: true,
              ehrWrite: false,
              phiLeakage: false,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setData({
            readiness: null,
            loop: null,
            durableRuns: null,
            honesty: {
              simulationOnly: true,
              acceptanceNotAccuracy: true,
              ehrWrite: false,
              phiLeakage: false,
            },
            error: error instanceof Error ? error.message : "Failed to load agent ops",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const agents = data?.readiness?.agents ?? [];
  const liveish = agents.filter((a) => a.status !== "planned");

  return (
    <DashboardShell role="admin" title="Agent Ops">
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />
        <AdminHeroDemoPath />

        <section
          className="rounded-lg border border-border bg-surface-raised/40 p-4 space-y-2"
          data-testid="agent-ops-honesty"
        >
          <h2 className="text-sm font-semibold tracking-tight">Evaluation honesty</h2>
          <ul className="text-xs text-muted space-y-1 list-disc pl-4">
            <li>Simulation / synthetic validation — not a clinical device certification.</li>
            <li>Acceptance rate is a workflow metric, not a clinical accuracy score.</li>
            <li>LLM calls are gated; deterministic fallbacks may be in use. ehrWrite: false.</li>
          </ul>
          <p className="text-[11px] text-muted">
            See docs/agents/HCP_AGENT_EVALUATION_PLAN.md. PRISM/ATLAS are P4 L2 scaffolds (synthetic eval only) — never shown as live.
          </p>
        </section>

        <CompassBriefPanel />

        {loading && <p className="text-sm text-muted">Loading readiness and loop outcomes…</p>}
        {data?.error && (
          <p className="text-sm text-amber-700" role="alert">
            {data.error}
          </p>
        )}

        <section className="space-y-3" data-testid="agent-ops-registry">
          <h2 className="text-sm font-semibold">Agent registry (readiness)</h2>
          <p className="text-xs text-muted">
            {data?.readiness?.measuredOn ?? "Synthetic validation"} · source{" "}
            {data?.readiness?.source ?? "—"}. {data?.readiness?.note}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {liveish.map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-border px-3 py-2 text-xs space-y-1"
                data-agent-id={a.id}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{a.productName}</span>
                  <span className="text-muted">{a.id}</span>
                </div>
                <div className="text-muted">
                  status: {a.status} · {a.ready ? "criteria met (still human release)" : "not ready"}
                </div>
                {!a.ready && a.outstanding[0] && (
                  <div className="text-amber-800/90 truncate" title={a.outstanding.join("; ")}>
                    Outstanding: {a.outstanding[0]}
                    {a.outstanding.length > 1 ? ` (+${a.outstanding.length - 1})` : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            PRISM/ATLAS omitted from live strip (scaffold ≠ live). Meeting numeric targets does not release an agent.
          </p>
        </section>

        <section className="space-y-3" data-testid="agent-ops-durable-runs">
          <h2 className="text-sm font-semibold">Durable CONDUCTOR runs (A3)</h2>
          <p className="text-xs text-muted">
            Total: {data?.durableRuns?.total ?? "—"} · Running: {data?.durableRuns?.runningCount ?? "—"} ·
            SHIELD-blocked enqueue: {data?.durableRuns?.shieldBlockedCount ?? "—"} · Failed/timeout:{" "}
            {data?.durableRuns?.failedOrTimedOutCount ?? "—"}. Patient refs are hashed — no names or NHS
            numbers.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-1 pr-2">Status</th>
                  <th className="py-1 pr-2">Patient ref</th>
                  <th className="py-1 pr-2">SHIELD block</th>
                  <th className="py-1 pr-2">Guardian</th>
                  <th className="py-1 pr-2">Correlation</th>
                  <th className="py-1">Started</th>
                </tr>
              </thead>
              <tbody>
                {(data?.durableRuns?.rows ?? []).slice(0, 12).map((row) => (
                  <tr key={row.runId} className="border-b border-border/60">
                    <td className="py-1 pr-2 font-medium">{row.status}</td>
                    <td className="py-1 pr-2 font-mono">{row.patientRef}</td>
                    <td className="py-1 pr-2">
                      {row.shieldBlockedEnqueue ? "blocked" : row.draftEnqueueAllowed ? "ok" : "no"}
                    </td>
                    <td className="py-1 pr-2">{row.guardianOutcome ?? "—"}</td>
                    <td className="py-1 pr-2 font-mono truncate max-w-[10rem]" title={row.correlationId}>
                      {row.correlationId.slice(0, 12)}
                    </td>
                    <td className="py-1">{row.startedAt?.slice(0, 19) ?? "—"}</td>
                  </tr>
                ))}
                {!data?.durableRuns?.rows?.length && !loading && (
                  <tr>
                    <td colSpan={6} className="py-3 text-muted">
                      No durable CONDUCTOR runs in this tenant scope yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3" data-testid="agent-ops-funnel">
          <h2 className="text-sm font-semibold">Decision funnel (aggregates only)</h2>
          <p className="text-xs text-muted">
            Runs: {formatCount(data?.loop?.runs)} · Cases accepted: {formatCount(data?.loop?.casesAccepted)}.{" "}
            {data?.loop?.suppression ?? "Small cells suppressed; no patient names."}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-1 pr-2">Agent</th>
                  <th className="py-1 pr-2">Drafts</th>
                  <th className="py-1 pr-2">Accepted</th>
                  <th className="py-1 pr-2">Edited</th>
                  <th className="py-1 pr-2">Rejected</th>
                  <th className="py-1 pr-2">Pending</th>
                  <th className="py-1 pr-2">Accept (unedited)</th>
                  <th className="py-1">Reject rate</th>
                </tr>
              </thead>
              <tbody>
                {(data?.loop?.agents ?? []).map((row) => (
                  <tr key={row.agent} className="border-b border-border/60">
                    <td className="py-1 pr-2 font-medium">{row.agent}</td>
                    <td className="py-1 pr-2">{formatCount(row.drafts)}</td>
                    <td className="py-1 pr-2">{formatCount(row.accepted)}</td>
                    <td className="py-1 pr-2">{formatCount(row.edited)}</td>
                    <td className="py-1 pr-2">{formatCount(row.rejected)}</td>
                    <td className="py-1 pr-2">{formatCount(row.pending)}</td>
                    <td className="py-1 pr-2">{formatRate(row.acceptedUneditedRate)}</td>
                    <td className="py-1">{formatRate(row.rejectionRate)}</td>
                  </tr>
                ))}
                {!data?.loop?.agents?.length && !loading && (
                  <tr>
                    <td colSpan={8} className="py-3 text-muted">
                      No agent-run cases in this tenant yet (or equity API unavailable).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {(data?.loop?.missingLabs?.length ?? 0) > 0 && (
            <div className="text-xs text-muted">
              Missing-lab signals (aggregate):{" "}
              {data!.loop!.missingLabs
                .slice(0, 5)
                .map((m) => `${m.lab} (${formatCount(m.runs)})`)
                .join(" · ")}
            </div>
          )}
        </section>

        <p className="text-[11px] text-muted">
          Read-only ops surface · tenant-scoped via readiness / equity APIs ·{" "}
          <Link href="/dashboard/admin/audit" className="underline">
            SHIELD audit
          </Link>
        </p>
      </div>
    </DashboardShell>
  );
}
