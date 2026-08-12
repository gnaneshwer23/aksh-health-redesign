"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type GoldenRow = {
  testId: string;
  title: string;
  primaryStage: number;
  status: string;
};

type StageRow = {
  stage: number;
  title: string;
  status: string;
};

type E2EStatus = {
  allowed: boolean;
  liveEmis: boolean;
  autoRetrain?: boolean;
  batch?: {
    batchId: string;
    manifest: {
      patientCount: number;
      userCount: number;
      scenarioDistribution: Record<string, number>;
      patientStateFactCount: number;
      labEventCount: number;
      pharmacyEventCount: number;
      seed: number;
    };
    report?: {
      artifactType?: string;
      executiveSummary?: {
        overallStatus?: string;
        stagesComplete?: number;
        goldenValidated?: number;
        goldenTotal?: number;
        note?: string;
      };
      goldenScenarios?: GoldenRow[];
      stages?: StageRow[];
      findings?: Array<{ id: string; severity: string; title: string }>;
      architectureLoop?: Record<string, string>;
    };
  } | null;
  commands?: Record<string, string>;
  error?: string;
};

export default function E2EAdminDashboardPage() {
  const [status, setStatus] = useState<E2EStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/e2e/status")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ allowed: false, liveEmis: false, error: "Failed to load" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell role="admin" title="E2E Platform Validation">
        <div className="p-6 text-sm text-muted-foreground">Loading E2E status…</div>
      </DashboardShell>
    );
  }

  if (!status?.allowed) {
    return (
      <DashboardShell role="admin" title="E2E Platform Validation">
        <div className="space-y-4 p-6">
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            E2E dashboard is disabled in production. Set{" "}
            <code className="text-xs">E2E_TEST_MODE=true</code> or{" "}
            <code className="text-xs">E2E_ADMIN_ENABLED=true</code> in dev/test only.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Back to admin</Link>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const m = status.batch?.manifest;
  const report = status.batch?.report;
  const summary = report?.executiveSummary;
  const findings = report?.findings ?? [];
  const golden = report?.goldenScenarios ?? [];
  const stages = report?.stages ?? [];

  return (
    <DashboardShell role="admin" title="E2E Platform Validation">
      <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
        <p
          className="rounded-2xl border border-border/60 bg-card/80 px-4 py-2.5 text-xs text-muted-foreground"
          data-testid="e2e-honesty-banner"
        >
          Synthetic E2E ecosystem only · source AKSH_E2E_TEST · liveEmis:false · autoRetrain:false.
          Never use for real patients. Cleanup is batch-scoped — demo cohort (@demo.akshhealth.com) is
          untouched. Software validation only — not production clinical readiness.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin">Admin home</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Batch</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {status.batch?.batchId ?? "None — run seed:e2e"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{m?.patientCount ?? "—"}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stages</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {summary?.stagesComplete != null ? `${summary.stagesComplete}/12` : "—"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm" data-testid="e2e-report-status">
              {summary?.overallStatus ?? "Run npm run report:e2e"}
            </CardContent>
          </Card>
        </div>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Final report summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Golden scenarios:{" "}
                <strong className="text-foreground">
                  {summary.goldenValidated ?? "—"}/{summary.goldenTotal ?? 20}
                </strong>
              </p>
              <p className="text-xs">{summary.note}</p>
            </CardContent>
          </Card>
        )}

        {m && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cohort distribution (A–H)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {Object.entries(m.scenarioDistribution).map(([id, count]) => (
                  <li key={id}>
                    Cohort {id}: <strong>{count}</strong>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Facts: {m.patientStateFactCount} · Lab sim: {m.labEventCount} · Pharmacy sim:{" "}
                {m.pharmacyEventCount} · Seed: {m.seed}
              </p>
            </CardContent>
          </Card>
        )}

        {stages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stage matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1 text-sm sm:grid-cols-2" data-testid="e2e-stage-matrix">
                {stages.map((s) => (
                  <li key={s.stage}>
                    Stage {s.stage}: {s.title} — <strong>{s.status}</strong>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {golden.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Golden scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul
                className="max-h-64 space-y-1 overflow-y-auto text-xs text-muted-foreground"
                data-testid="e2e-golden-list"
              >
                {golden.map((g) => (
                  <li key={g.testId}>
                    <span className="font-mono text-foreground">{g.testId}</span> · stage{" "}
                    {g.primaryStage} · {g.status} — {g.title}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {findings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Findings (honest)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm" data-testid="e2e-findings-list">
                {findings.map((f) => (
                  <li key={f.id}>
                    <strong>{f.severity}</strong> {f.id}: {f.title}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CLI commands (dev/test)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            {Object.entries(status.commands ?? {}).map(([key, cmd]) => (
              <div key={key} className="rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">{key}: </span>
                {cmd}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
