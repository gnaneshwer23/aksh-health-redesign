"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearcherDashboardPage() {
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const section = searchParams.get("section");

  if (section === "settings") {
    return (
      <DashboardShell role="researcher" title="Settings">
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Researcher settings</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>Notification preferences, data access scopes, and export governance — coming in Phase B.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (panel === "evaluation") {
    return (
      <DashboardShell role="researcher" title="Evaluation">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Outcome evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>Pseudonymised cohort metrics and AI outcome signals for approved studies.</p>
              <div className="flex flex-wrap gap-3">
                <Link className="text-sm font-semibold text-primary underline" href="/api/research/evaluation">
                  API evaluation export
                </Link>
                <Link className="text-sm font-semibold text-primary underline" href="/review/benchmarks">
                  Benchmark dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="researcher" title="Researcher Dashboard">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Aggregate research view</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              <p>Pseudonymised cohort metrics and AI outcome signals for approved studies.</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Report formats</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted" href="/api/research/evaluation">
                API evaluation export
              </Link>
              <Link className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted" href="/review/benchmarks">
                Benchmark dashboard
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
