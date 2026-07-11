"use client";

import { CheckCircle2, Shield, Stethoscope } from "lucide-react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WEEKLY_CONSULTATIONS = [38, 41, 39, 44, 42, 45, 47];

export default function GpReportsPage() {
  return (
    <DashboardShell role="gp" title="Practice Reports">
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />

        <div>
          <h1 className="text-lg font-semibold text-foreground">Summary Reports</h1>
          <p className="text-sm text-muted">Practice KPIs for the current week — mock data for QA review.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Consultations This Week"
            value="47"
            icon={Stethoscope}
            sparkline={WEEKLY_CONSULTATIONS}
            trend="up"
          />
          <MetricCard
            label="AI Acceptance Rate"
            value="94%"
            icon={CheckCircle2}
            tone="accent"
            trend="up"
          />
          <MetricCard
            label="GUARDIAN Alerts Resolved"
            value="12"
            icon={Shield}
            tone="warn"
            sparkline={[8, 9, 10, 11, 10, 11, 12]}
          />
        </div>

        <Card className="dashboard-card border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Weekly activity snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>AI-assisted documentation saved an estimated 6.2 hours of clinician time this week.</p>
            <p>3 care pathways advanced to supervised automation; 1 remains awaiting GP approval.</p>
            <p>ORACLE flagged 5 patients for elevated admission risk — 4 reviewed, 1 pending follow-up.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
