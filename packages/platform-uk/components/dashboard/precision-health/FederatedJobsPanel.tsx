"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { FederatedResearchJob } from "@/lib/precision-health/federated-research";

type JobsResponse = {
  jobs?: FederatedResearchJob[];
  ethicsGatePassed?: boolean;
  syntheticAggregatesOnly?: boolean;
  patientLevelExportDefault?: boolean;
  liveFederatedLearning?: boolean;
  note?: string;
  error?: string;
};

/**
 * Researcher panel — federated job list with synthetic aggregates only.
 */
export function FederatedJobsPanel() {
  const [jobs, setJobs] = useState<FederatedResearchJob[]>([]);
  const [note, setNote] = useState("");
  const [ethicsGatePassed, setEthicsGatePassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/research/federated/jobs", { credentials: "include" });
      const data = (await response.json()) as JobsResponse;
      if (!response.ok) {
        toast({
          title: "Federated jobs unavailable",
          description: data.error ?? "Could not list jobs.",
        });
        return;
      }
      setJobs(data.jobs ?? []);
      setNote(data.note ?? "");
      setEthicsGatePassed(Boolean(data.ethicsGatePassed));
    } catch {
      toast({ title: "Federated jobs unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createJob = async (withEthicsClaim: boolean) => {
    setCreating(true);
    try {
      const response = await fetch("/api/research/federated/jobs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Synthetic HF cohort aggregate rehearsal",
          ethicsApprovedClaim: withEthicsClaim,
        }),
      });
      const data = (await response.json()) as JobsResponse & { job?: FederatedResearchJob };
      if (data.job) {
        setJobs((prev) => [data.job!, ...prev]);
      }
      if (response.status === 403 || data.job?.status === "blocked_ethics") {
        toast({
          title: "Ethics gate blocked",
          description:
            "Job recorded as blocked_ethics. Set FEDERATED_RESEARCH_ETHICS_APPROVED=true for synthetic aggregates.",
        });
      } else if (!response.ok) {
        toast({
          title: "Job failed",
          description: data.error ?? "Could not create federated job.",
        });
      } else {
        toast({
          title: "Synthetic aggregate job completed",
          description: "Synthetic aggregates only · no patient-level export",
        });
      }
      if (typeof data.ethicsGatePassed === "boolean") {
        setEthicsGatePassed(data.ethicsGatePassed);
      }
    } catch {
      toast({ title: "Job failed", description: "Network error." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card id="federated" className="scroll-mt-24 shadow-sm" data-testid="federated-jobs-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">Federated research jobs (synthetic aggregates)</CardTitle>
          <p className="text-xs text-muted">
            Not live federated learning · patient-level export off by default · ethics gate required
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={creating}
            onClick={() => void createJob(false)}
          >
            Create (expect block)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={creating}
            onClick={() => void createJob(true)}
          >
            Create + ethics claim
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        <p className="text-[11px] text-muted">
          Ethics gate: {ethicsGatePassed ? "open (env)" : "closed"} · {note || "Loading status…"}
        </p>

        {loading && jobs.length === 0 ? (
          <p className="text-sm text-muted">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted">
            No federated jobs yet. Created jobs return synthetic cohort aggregates only.
          </p>
        ) : (
          <ul className="space-y-2">
            {jobs.slice(0, 8).map((job) => (
              <li key={job.id} className="rounded-sm border border-border p-2 text-xs">
                <p className="font-semibold">
                  {job.title}{" "}
                  <span className="font-normal text-muted">· {job.status}</span>
                </p>
                {job.aggregate ? (
                  <p className="mt-1 text-muted">
                    n={job.aggregate.cohortSizeSynthetic} · mean ORACLE{" "}
                    {job.aggregate.meanOracleScore} · high-risk{" "}
                    {job.aggregate.highRiskSharePercent}% · {job.aggregate.sitesParticipating} sites
                    (synthetic)
                  </p>
                ) : (
                  <p className="mt-1 text-muted">No aggregate — ethics gate or incomplete job.</p>
                )}
                <p className="mt-1 text-[10px] text-muted">
                  patientLevelExport: false · syntheticAggregatesOnly: true
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
