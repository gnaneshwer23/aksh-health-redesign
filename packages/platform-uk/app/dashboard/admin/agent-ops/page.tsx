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

type OpsAlertSignal = {
  id: string;
  code: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  count: number;
  sampleRefs: string[];
};

type OpsAlertsSummary = {
  alerts: OpsAlertSignal[];
  metrics: {
    sampleSize: number;
    failedOrTimedOut: number;
    shieldBlocked: number;
    shieldBlockRate: number | null;
    stuckRunning: number;
    stuckEpisodeTasks: number;
  };
  note?: string;
};

type OpsRunsSummary = {
  total: number;
  shieldBlockedCount: number;
  runningCount: number;
  failedOrTimedOutCount: number;
  byStatus: Record<string, number>;
  rows: OpsRunRow[];
  note?: string;
  alerts?: OpsAlertsSummary | null;
};

type EvalFixturesPayload = {
  available: boolean;
  fixtures?: { id: string; agent: string; label: string }[];
  ehrWrite: false;
  hitlRequired: true;
  note?: string;
};

type HcpFeedbackSummary = {
  total: number;
  byDecision: { accept: number; edit: number; reject: number };
  safetyMissCount: number;
  meanTrustHonesty: number | null;
  byAgent: { agentLabel: string; count: number; meanRubric: number | null }[];
  samplePatientRefs: string[];
  note?: string;
};

type HcpCasePackPayload = {
  version: string;
  caseCount: number;
  syntheticOnly: true;
  clinicalValidationClaim: false;
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
  evalFixtures: EvalFixturesPayload | null;
  hcpFeedback: HcpFeedbackSummary | null;
  hcpCasePack: HcpCasePackPayload | null;
  honesty: {
    simulationOnly: true;
    acceptanceNotAccuracy: true;
    ehrWrite: false;
    phiLeakage: false;
    labPharmacySim: true;
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
        const [readyRes, loopRes, runsRes, evalRes, hcpFbRes, casePackRes] = await Promise.all([
          fetch("/api/agents/readiness", { credentials: "include" }),
          fetch("/api/agents/loop-outcomes", { credentials: "include" }),
          fetch("/api/agents/ops-runs?limit=20&alerts=1", { credentials: "include" }),
          fetch("/api/eval/agents", { credentials: "include" }),
          fetch("/api/eval/hcp-feedback", { credentials: "include" }),
          fetch("/api/eval/hcp-case-pack", { credentials: "include" }),
        ]);
        if (!readyRes.ok) {
          throw new Error(`readiness ${readyRes.status}`);
        }
        const readiness = await readyRes.json();
        let loop: LoopSummary | null = null;
        if (loopRes.ok) {
          loop = (await loopRes.json()) as LoopSummary;
        }
        let durableRuns: OpsRunsSummary | null = null;
        if (runsRes.ok) {
          durableRuns = (await runsRes.json()) as OpsRunsSummary;
        }
        let evalFixtures: EvalFixturesPayload | null = null;
        if (evalRes.ok) {
          evalFixtures = (await evalRes.json()) as EvalFixturesPayload;
        }
        let hcpFeedback: HcpFeedbackSummary | null = null;
        if (hcpFbRes.ok) {
          hcpFeedback = (await hcpFbRes.json()) as HcpFeedbackSummary;
        }
        let hcpCasePack: HcpCasePackPayload | null = null;
        if (casePackRes.ok) {
          hcpCasePack = (await casePackRes.json()) as HcpCasePackPayload;
        }
        if (!cancelled) {
          setData({
            readiness,
            loop,
            durableRuns,
            evalFixtures,
            hcpFeedback,
            hcpCasePack,
            honesty: {
              simulationOnly: true,
              acceptanceNotAccuracy: true,
              ehrWrite: false,
              phiLeakage: false,
              labPharmacySim: true,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setData({
            readiness: null,
            loop: null,
            durableRuns: null,
            evalFixtures: null,
            hcpFeedback: null,
            hcpCasePack: null,
            honesty: {
              simulationOnly: true,
              acceptanceNotAccuracy: true,
              ehrWrite: false,
              phiLeakage: false,
              labPharmacySim: true,
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
            <li data-testid="lab-pharmacy-sim-honesty">
              Lab approve / pharmacy adherence paths remain <strong>simulation</strong> — not live NHS pathology or EPS.
            </li>
          </ul>
          <p className="text-[11px] text-muted">
            Milestone B HCP prep · docs/milestone-b/ · HCP_AGENT_EVALUATION_PLAN.md. PRISM/ATLAS are P4 L2 scaffolds
            (synthetic eval only) — never shown as live.
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

        <section className="space-y-3" data-testid="agent-ops-alerts">
          <h2 className="text-sm font-semibold">Durable-run alerts (A4)</h2>
          <p className="text-xs text-muted">
            Failed/timeout (window): {data?.durableRuns?.alerts?.metrics.failedOrTimedOut ?? "—"} · SHIELD
            blocks: {data?.durableRuns?.alerts?.metrics.shieldBlocked ?? "—"}
            {data?.durableRuns?.alerts?.metrics.shieldBlockRate != null
              ? ` (${Math.round(data.durableRuns.alerts.metrics.shieldBlockRate * 100)}%)`
              : ""}{" "}
            · Stuck running: {data?.durableRuns?.alerts?.metrics.stuckRunning ?? "—"} · Stuck episode tasks:{" "}
            {data?.durableRuns?.alerts?.metrics.stuckEpisodeTasks ?? "—"}. Aggregates only — no PHI.
          </p>
          <ul className="space-y-2 text-xs">
            {(data?.durableRuns?.alerts?.alerts ?? []).map((alert) => (
              <li
                key={alert.id}
                className={
                  alert.severity === "critical"
                    ? "rounded-md border border-red-300/80 bg-red-50/50 px-3 py-2"
                    : "rounded-md border border-amber-300/80 bg-amber-50/40 px-3 py-2"
                }
                data-alert-code={alert.code}
              >
                <div className="font-medium">
                  [{alert.severity}] {alert.title} · n={alert.count}
                </div>
                <div className="text-muted mt-0.5">{alert.detail}</div>
                {alert.sampleRefs.length > 0 && (
                  <div className="font-mono text-[11px] text-muted mt-1">
                    refs: {alert.sampleRefs.join(", ")}
                  </div>
                )}
              </li>
            ))}
            {!data?.durableRuns?.alerts?.alerts?.length && !loading && (
              <li className="text-muted">No active durable-run alerts in this tenant scope.</li>
            )}
          </ul>
        </section>

        <section className="space-y-3" data-testid="agent-ops-durable-runs">
          <h2 className="text-sm font-semibold">Durable CONDUCTOR runs (A3/A4)</h2>
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

        <section className="space-y-3" data-testid="agent-ops-eval-harness">
          <h2 className="text-sm font-semibold">Eval harness · HCP case pack (Milestone B)</h2>
          <p className="text-xs text-muted">
            Golden fixtures: {data?.evalFixtures?.fixtures?.length ?? "—"} · ehrWrite: false · hitlRequired: true.
            Case pack {data?.hcpCasePack?.version ?? "—"} · {data?.hcpCasePack?.caseCount ?? "—"} synthetic session
            cases. This surface is rehearsal scoring — not clinical validation.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-md border border-border px-3 py-2 space-y-1">
              <div className="font-medium">HCP feedback (aggregates)</div>
              <div className="text-muted">
                n={data?.hcpFeedback?.total ?? 0} · accept{" "}
                {data?.hcpFeedback?.byDecision.accept ?? 0} / edit {data?.hcpFeedback?.byDecision.edit ?? 0} / reject{" "}
                {data?.hcpFeedback?.byDecision.reject ?? 0}
              </div>
              <div className="text-muted">
                Safety misses: {data?.hcpFeedback?.safetyMissCount ?? 0} · Mean trust in honesty labels:{" "}
                {data?.hcpFeedback?.meanTrustHonesty != null
                  ? data.hcpFeedback.meanTrustHonesty.toFixed(1)
                  : "n/a"}
              </div>
              {(data?.hcpFeedback?.byAgent?.length ?? 0) > 0 && (
                <ul className="text-muted list-disc pl-4">
                  {data!.hcpFeedback!.byAgent.slice(0, 4).map((a) => (
                    <li key={a.agentLabel}>
                      {a.agentLabel}: n={a.count}
                      {a.meanRubric != null ? ` · rubric μ=${a.meanRubric.toFixed(1)}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {(data?.hcpFeedback?.samplePatientRefs?.length ?? 0) > 0 && (
                <div className="font-mono text-[11px] text-muted">
                  refs: {data!.hcpFeedback!.samplePatientRefs.join(", ")}
                </div>
              )}
            </div>
            <div className="rounded-md border border-border px-3 py-2 space-y-1">
              <div className="font-medium">How facilitators capture scores</div>
              <p className="text-muted">
                Use the in-app facilitator session (Milestone C1) — no curl required:{" "}
                <Link
                  href="/dashboard/admin/hcp-eval-session"
                  className="underline text-primary"
                  data-testid="agent-ops-hcp-session-link"
                >
                  Admin HCP eval session
                </Link>{" "}
                ·{" "}
                <Link href="/dashboard/gp/hcp-eval-session" className="underline text-primary">
                  GP HCP eval session
                </Link>
                . APIs remain POST /api/eval/hcp-feedback and GET /api/eval/hcp-case-pack. Protocol:
                docs/milestone-c/FACILITATOR_SESSION.md · docs/milestone-b/SESSION_PROTOCOL.md. Multi-role
                lab/pharmacy HITL (C3):{" "}
                <Link href="/dashboard/gp/lab-pharmacy" className="underline text-primary" data-testid="agent-ops-lph-link">
                  GP stage
                </Link>{" "}
                ·{" "}
                <Link href="/dashboard/admin/lab-queue" className="underline text-primary">
                  Lab queue
                </Link>{" "}
                ·{" "}
                <Link href="/dashboard/pharmacist/pharmacy-queue" className="underline text-primary">
                  Pharmacy queue
                </Link>{" "}
                · docs/milestone-c/LAB_PHARMACY_HITL.md.
              </p>
              <p className="text-[11px] text-muted">
                {data?.hcpFeedback?.note ??
                  "Acceptance rate ≠ accuracy. Hashed patient refs only on this admin view."}
              </p>
            </div>
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
                      No agent-run cases in this tenant yet (or loop-outcomes API unavailable).
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
