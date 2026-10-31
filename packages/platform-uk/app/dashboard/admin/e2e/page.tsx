"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GoldenRow = {
  testId: string;
  title: string;
  primaryStage: number;
  status: string;
  architectureLayer?: string;
  notes?: string;
};

type StageRow = {
  stage: number;
  title: string;
  status: string;
};

type SimsSummary = {
  allowed?: boolean;
  batchId?: string;
  source?: string;
  counts?: {
    labEvents?: number;
    delayedLabs?: number;
    pharmacyEvents?: number;
    adherenceFailures?: number;
  };
  sampleDelayedLabIds?: string[];
  sampleAdherenceEventIds?: string[];
  liveNhsLab?: boolean;
  livePrescribing?: boolean;
  error?: string;
};

type E2EStatus = {
  allowed: boolean;
  liveEmis: boolean;
  autoRetrain?: boolean;
  batchSource?: string;
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
  coverage?: {
    stages?: StageRow[];
    goldenScenarios?: GoldenRow[];
    findings?: Array<{ id: string; severity: string; title: string }>;
    architectureLoop?: Record<string, string>;
  };
  commands?: Record<string, string>;
  error?: string;
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function E2EAdminDashboardPage() {
  const [status, setStatus] = useState<E2EStatus | null>(null);
  const [sims, setSims] = useState<SimsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [goldenQuery, setGoldenQuery] = useState("");
  const [simLog, setSimLog] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadStatus = useCallback(async () => {
    setBusy("refresh");
    try {
      const res = await fetch("/api/admin/e2e/status");
      const data = (await res.json()) as E2EStatus;
      setStatus(data);
      if (!res.ok || data.allowed === false) {
        showToast(data.error ?? "E2E surface unavailable");
      }
    } catch {
      setStatus({ allowed: false, liveEmis: false, error: "Failed to load status" });
    } finally {
      setBusy(null);
      setLoading(false);
    }
  }, [showToast]);

  const loadSims = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/e2e/sims");
      const data = (await res.json()) as SimsSummary;
      if (res.ok) setSims(data);
      else setSims({ error: data.error ?? `Sims unavailable (${res.status})` });
    } catch {
      setSims({ error: "Failed to load sims" });
    }
  }, []);

  useEffect(() => {
    void loadStatus().then(() => loadSims());
  }, [loadStatus, loadSims]);

  const m = status?.batch?.manifest;
  const report = status?.batch?.report;
  const summary = report?.executiveSummary;
  const stages = report?.stages?.length ? report.stages : status?.coverage?.stages ?? [];
  const findings = report?.findings?.length ? report.findings : status?.coverage?.findings ?? [];
  const golden = report?.goldenScenarios?.length
    ? report.goldenScenarios
    : status?.coverage?.goldenScenarios ?? [];
  const architectureLoop =
    report?.architectureLoop ?? status?.coverage?.architectureLoop ?? {};

  const filteredGolden = useMemo(() => {
    const q = goldenQuery.trim().toLowerCase();
    if (!q) return golden;
    return golden.filter(
      (g) =>
        g.testId.toLowerCase().includes(q) ||
        g.title.toLowerCase().includes(q) ||
        String(g.primaryStage).includes(q) ||
        (g.architectureLayer ?? "").toLowerCase().includes(q)
    );
  }, [golden, goldenQuery]);

  async function onCopy(cmd: string, label: string) {
    try {
      await copyText(cmd);
      showToast(`Copied ${label}`);
    } catch {
      showToast("Copy failed");
    }
  }

  async function onDownloadMarkdown() {
    setBusy("md");
    try {
      const res = await fetch("/api/admin/e2e/report?format=markdown");
      if (!res.ok) {
        showToast(`Download failed (${res.status})`);
        return;
      }
      const text = await res.text();
      const batchId = status?.batch?.batchId ?? "e2e";
      downloadBlob(`E2E_PLATFORM_FINAL_REPORT_${batchId}.md`, new Blob([text], { type: "text/markdown" }));
      showToast("Markdown report downloaded");
    } finally {
      setBusy(null);
    }
  }

  async function onDownloadJson() {
    setBusy("json");
    try {
      const res = await fetch("/api/admin/e2e/report?format=json");
      const data = await res.json();
      if (!res.ok) {
        showToast(`Download failed (${res.status})`);
        return;
      }
      const batchId = data.batchId ?? status?.batch?.batchId ?? "e2e";
      downloadBlob(
        `E2E_PLATFORM_REPORT_${batchId}.json`,
        new Blob([JSON.stringify(data.report ?? data, null, 2)], { type: "application/json" })
      );
      showToast("JSON report downloaded");
    } finally {
      setBusy(null);
    }
  }

  async function onRegenerateReport() {
    setBusy("regen");
    try {
      const res = await fetch("/api/admin/e2e/report", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; note?: string; error?: string };
      if (!res.ok) {
        showToast(data.error ?? `Regenerate failed (${res.status})`);
        return;
      }
      showToast(data.note ?? "Report regenerated");
      await loadStatus();
    } finally {
      setBusy(null);
    }
  }

  async function onCompleteLab() {
    const labEventId = sims?.sampleDelayedLabIds?.[0];
    if (!labEventId) {
      showToast("No delayed lab sample available");
      return;
    }
    setBusy("lab");
    try {
      const res = await fetch("/api/admin/e2e/sims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete-lab", labEventId, value: 58 }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? `Lab sim failed (${res.status})`);
        return;
      }
      setSimLog(JSON.stringify(data, null, 2));
      showToast(`Lab completed (sim) · ${labEventId}`);
      await loadSims();
    } finally {
      setBusy(null);
    }
  }

  async function onPharmacyEscalate() {
    const pharmacyEventId = sims?.sampleAdherenceEventIds?.[0];
    if (!pharmacyEventId) {
      showToast("No adherence failure sample available");
      return;
    }
    setBusy("rx");
    try {
      const res = await fetch("/api/admin/e2e/sims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "pharmacy-escalate", pharmacyEventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? `Pharmacy sim failed (${res.status})`);
        return;
      }
      setSimLog(JSON.stringify(data, null, 2));
      showToast(`Pharmacy escalated (sim) · ${pharmacyEventId}`);
      await loadSims();
    } finally {
      setBusy(null);
    }
  }

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
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin">Back to admin</Link>
            </Button>
            <Button variant="outline" onClick={() => void loadStatus()} disabled={busy === "refresh"}>
              Retry
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="E2E Platform Validation">
      <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
        <p
          className="rounded-2xl border border-border/60 bg-card/80 px-4 py-2.5 text-xs text-muted-foreground"
          data-testid="e2e-honesty-banner"
        >
          Synthetic E2E ecosystem only · source AKSH_E2E_TEST · liveEmis:false · autoRetrain:false.
          Never use for real patients. Cleanup is batch-scoped — demo cohort (@demo.akshhealth.com) is
          untouched. Seed/cleanup stay CLI-only — this UI refreshes, copies commands, downloads
          reports, and runs lab/pharmacy <em>simulations</em> only.
        </p>

        {toast ? (
          <p
            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground"
            role="status"
            data-testid="e2e-toast"
          >
            {toast}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin">Admin home</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadStatus().then(() => loadSims())}
            disabled={busy === "refresh"}
            data-testid="e2e-refresh"
          >
            {busy === "refresh" ? "Refreshing…" : "Refresh status"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onRegenerateReport()}
            disabled={busy === "regen"}
            data-testid="e2e-regenerate-report"
          >
            {busy === "regen" ? "Regenerating…" : "Regenerate report"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onDownloadMarkdown()}
            disabled={busy === "md"}
            data-testid="e2e-download-md"
          >
            Download Markdown
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onDownloadJson()}
            disabled={busy === "json"}
            data-testid="e2e-download-json"
          >
            Download JSON
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Batch</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p className="font-mono text-foreground">{status.batch?.batchId ?? "—"}</p>
              <p className="mt-1">source: {status.batchSource ?? "—"}</p>
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
              {summary?.overallStatus ?? "Generate report"}
            </CardContent>
          </Card>
        </div>

        {summary ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Final report summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Golden scenarios:{" "}
                <strong className="text-foreground">
                  {summary.goldenValidated ?? "—"}/{summary.goldenTotal ?? (golden.length || 21)}
                </strong>
              </p>
              <p className="text-xs">{summary.note}</p>
            </CardContent>
          </Card>
        ) : null}

        {Object.keys(architectureLoop).length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Architecture loop</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-1 text-sm sm:grid-cols-2" data-testid="e2e-architecture-loop">
                {Object.entries(architectureLoop).map(([layer, state]) => (
                  <li key={layer}>
                    {layer}: <strong>{state}</strong>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {m ? (
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
        ) : null}

        {stages.length > 0 ? (
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
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Golden scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={goldenQuery}
              onChange={(e) => setGoldenQuery(e.target.value)}
              placeholder="Filter by ID, title, stage, layer…"
              data-testid="e2e-golden-filter"
              aria-label="Filter golden scenarios"
            />
            <ul
              className="max-h-72 space-y-1 overflow-y-auto text-xs text-muted-foreground"
              data-testid="e2e-golden-list"
            >
              {filteredGolden.map((g) => (
                <li key={g.testId} className="rounded-md border border-border/40 px-2 py-1.5">
                  <span className="font-mono text-foreground">{g.testId}</span> · stage{" "}
                  {g.primaryStage} · {g.status}
                  {g.architectureLayer ? ` · ${g.architectureLayer}` : ""} — {g.title}
                  {g.notes ? <span className="mt-0.5 block text-[11px] opacity-80">{g.notes}</span> : null}
                </li>
              ))}
              {filteredGolden.length === 0 ? (
                <li className="text-muted-foreground">No scenarios match this filter.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        {findings.length > 0 ? (
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
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lab / pharmacy simulations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p
              className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              data-testid="lab-pharmacy-sim-honesty"
            >
              Lab / pharmacy HITL · <strong>simulation only</strong> until live NHS lab / EPS paths
              exist · liveNhsLab:{String(sims?.liveNhsLab ?? false)} · livePrescribing:
              {String(sims?.livePrescribing ?? false)} · ehrWrite:false · no invented AI success
            </p>
            {sims?.error ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">{sims.error}</p>
            ) : (
              <ul className="grid gap-1 text-xs sm:grid-cols-2">
                <li>Delayed labs: <strong>{sims?.counts?.delayedLabs ?? "—"}</strong></li>
                <li>Adherence failures: <strong>{sims?.counts?.adherenceFailures ?? "—"}</strong></li>
                <li>Lab events: <strong>{sims?.counts?.labEvents ?? "—"}</strong></li>
                <li>Pharmacy events: <strong>{sims?.counts?.pharmacyEvents ?? "—"}</strong></li>
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void onCompleteLab()}
                disabled={busy === "lab" || !sims?.sampleDelayedLabIds?.length}
                data-testid="e2e-complete-lab"
              >
                {busy === "lab" ? "Completing…" : "Complete sample delayed lab"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void onPharmacyEscalate()}
                disabled={busy === "rx" || !sims?.sampleAdherenceEventIds?.length}
                data-testid="e2e-pharmacy-escalate"
              >
                {busy === "rx" ? "Escalating…" : "Escalate sample adherence failure"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadSims()}
                data-testid="e2e-refresh-sims"
              >
                Refresh sims
              </Button>
            </div>
            {simLog ? (
              <pre
                className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 text-[11px]"
                data-testid="e2e-sim-log"
              >
                {simLog}
              </pre>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CLI commands (copy)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Seed and cleanup are intentionally not runnable from the browser — copy and run in a
              trusted terminal only.
            </p>
            {Object.entries(status.commands ?? {}).map(([key, cmd]) => (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-lg bg-muted/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 font-mono text-xs">
                  <span className="text-muted-foreground">{key}: </span>
                  <span className="break-all">{cmd}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => void onCopy(cmd, key)}
                  data-testid={`e2e-copy-${key}`}
                >
                  Copy
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
