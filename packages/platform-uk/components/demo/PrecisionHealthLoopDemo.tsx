"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LoopRunReport, StageStatus, WholeLoopCapabilities } from "@/lib/precision-health/whole-loop";

const COHORT_OPTIONS = [
  { id: "P001", label: "P001 — Mrs Sarah Johnson (demo default)" },
  { id: "P002", label: "P002 — Mr James Patel (golden path)" },
  { id: "P003", label: "P003 — cohort" },
  { id: "P008", label: "P008 — cohort" }
];

function statusBadgeClass(status: StageStatus): string {
  switch (status) {
    case "pass":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "partial":
      return "bg-amber-100 text-amber-950 border-amber-300";
    case "synthetic":
      return "bg-sky-100 text-sky-950 border-sky-300";
    case "blocked":
      return "bg-orange-100 text-orange-950 border-orange-300";
    case "failed":
      return "bg-rose-100 text-rose-950 border-rose-300";
    case "skipped":
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

/**
 * Interactive Precision Health whole-loop demo.
 * Ruthlessly honest: never claims live twin / EMR / auto-retrain.
 */
export function PrecisionHealthLoopDemo() {
  const [capabilities, setCapabilities] = useState<WholeLoopCapabilities | null>(null);
  const [patientId, setPatientId] = useState("P001");
  const [demoAccept, setDemoAccept] = useState(true);
  const [publicDemo, setPublicDemo] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<LoopRunReport | null>(null);

  useEffect(() => {
    void fetch("/api/precision-health/whole-loop")
      .then((r) => r.json())
      .then((data: WholeLoopCapabilities) => setCapabilities(data))
      .catch(() => setCapabilities(null));
  }, []);

  const runLoop = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/precision-health/whole-loop", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: publicDemo ? "P001" : patientId,
          publicDemo,
          demoAccept
        })
      });
      const data = (await response.json()) as LoopRunReport & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Whole-loop run failed");
    } finally {
      setRunning(false);
    }
  }, [demoAccept, patientId, publicDemo]);

  const stageSummary = useMemo(() => {
    if (!report) return null;
    const counts = report.stages.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  }, [report]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
          Aksh clinical spine · synthetic replay
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Replay the Aksh clinical spine
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Same backend as live onboarding → GP review → SHIELD audit — not a separate stack. This
          run walks consent → multimodal ingest → timeline → Neo4j → agents → synthetic scenario
          ranking → plan draft → safety route → HITL/sim staging → learning on{" "}
          <strong>synthetic modalities</strong>. Not a living physiological twin; not live EMR
          write-back.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
          {[
            "synthetic: true",
            "scaffolding: true",
            "physiologicalTwin: false",
            "liveEmis: false",
            "autoRetrain: false",
            "ehrWrite: false"
          ].map((flag) => (
            <span
              key={flag}
              className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-slate-700"
            >
              {flag}
            </span>
          ))}
        </div>
      </header>

      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Run controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={publicDemo}
              onChange={(e) => {
                setPublicDemo(e.target.checked);
                if (e.target.checked) setPatientId("P001");
              }}
            />
            <span>
              <strong>Public demo mode (P001 only)</strong> — rate-limited, synthetic-only. Uncheck
              and sign in to run other cohort patients with your session scope.
            </span>
          </label>

          {!publicDemo ? (
            <label className="block text-sm text-slate-700">
              Cohort patient
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                {COHORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={demoAccept}
              onChange={(e) => setDemoAccept(e.target.checked)}
            />
            <span>
              <strong>Demo clinician Accept</strong> — explicit one-click HITL that stages
              FHIR-shaped evidence + SHIELD as a labelled demo actor, then sim write only. Still{" "}
              <code className="text-xs">liveEmis: false</code>. Leave off to leave the HITL gate
              blocked awaiting a real clinician.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void runLoop()} disabled={running}>
              {running ? "Running whole loop…" : "Run whole loop"}
            </Button>
            <Link
              href="/demo/script"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              Guided demo script
            </Link>
            <Link
              href="/review/pilot?demo=1"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              Pilot HITL cases
            </Link>
            <Link
              href="/security#precision-health"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              Roadmap & honesty notes
            </Link>
            <Link
              href="/dashboard/gp"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              GP dashboard
            </Link>
            <Link
              href="/dashboard/admin/precision-health"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              Admin system spine
            </Link>
            <Link
              href="/dashboard/admin/audit"
              className="text-sm text-teal-800 underline-offset-2 hover:underline"
            >
              SHIELD audit
            </Link>
          </div>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          ) : null}

          {capabilities ? (
            <p className="text-xs text-slate-500">{capabilities.honesty.note}</p>
          ) : null}
        </CardContent>
      </Card>

      {report ? (
        <>
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Run report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>
                <span className="font-medium">{report.patientLabel}</span> ({report.patientId}) ·{" "}
                {report.elapsedMs}ms · route{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">{report.safetyRoute ?? "n/a"}</code>{" "}
                · HITL{" "}
                <code className="rounded bg-slate-100 px-1 text-xs">{report.hitlGate.status}</code>
              </p>
              <p className="text-xs text-slate-500">{report.hitlGate.message}</p>
              {stageSummary ? (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {Object.entries(stageSummary).map(([k, v]) => (
                    <span
                      key={k}
                      className={`rounded-md border px-2 py-1 ${statusBadgeClass(k as StageStatus)}`}
                    >
                      {k}: {v}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <ol className="space-y-3">
            {report.stages.map((stage, index) => (
              <li key={stage.id}>
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Stage {index + 1} · {stage.id}
                      </p>
                      <p className="font-medium text-slate-900">{stage.label}</p>
                      <p className="text-sm text-slate-600">{stage.message}</p>
                      {stage.artifacts ? (
                        <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-slate-50 p-2 text-[10px] text-slate-600">
                          {JSON.stringify(stage.artifacts, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase ${statusBadgeClass(stage.status)}`}
                      >
                        {stage.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{stage.durationMs}ms</span>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Continue on the real spine</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/dashboard/gp/patients/${report.patientId}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm transition hover:border-teal-400 hover:bg-teal-50/40"
              >
                <p className="font-medium text-slate-900">GP patient surface</p>
                <p className="mt-1 text-xs text-slate-500">
                  Timeline, health-plan draft, consent for {report.patientId}
                </p>
              </Link>
              <Link
                href="/dashboard/admin/learning"
                className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm transition hover:border-teal-400 hover:bg-teal-50/40"
              >
                <p className="font-medium text-slate-900">Learning events</p>
                <p className="mt-1 text-xs text-slate-500">
                  Prediction → decision recorder (autoRetrain:false)
                </p>
              </Link>
              {report.stakeholderGlimpses.map((g) => (
                <Link
                  key={g.id}
                  href={g.href}
                  className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm transition hover:border-teal-400 hover:bg-teal-50/40"
                >
                  <p className="font-medium text-slate-900">{g.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{g.note}</p>
                  <p className="mt-2 text-[11px] text-teal-800">{g.href}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Partner gaps (still Phase 2–3)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {report.partnerGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-800">Full LoopRunReport JSON</summary>
            <pre className="mt-2 max-h-96 overflow-auto">{JSON.stringify(report, null, 2)}</pre>
          </details>
        </>
      ) : null}
    </div>
  );
}
