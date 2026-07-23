"use client";

import Link from "next/link";
import { ChevronRight, Database, FlaskConical, Settings, Shield } from "lucide-react";

import { FederatedJobsPanel } from "@/components/dashboard/precision-health/FederatedJobsPanel";
import { GovernanceBoundariesCard } from "@/components/dashboard/researcher/GovernanceBoundariesCard";
import { ResearcherKpiRow } from "@/components/dashboard/researcher/ResearcherKpiRow";
import { useResearcherData } from "@/components/dashboard/researcher/ResearcherDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_LINKS = [
  {
    href: "/dashboard/researcher/evaluation",
    title: "Outcome Evaluation",
    description: "Cohort metrics, evaluation charts, and authenticated JSON export with SHIELD logging.",
    icon: FlaskConical
  },
  {
    href: "/dashboard/researcher/data-access",
    title: "Data Access",
    description: "Aggregate vs individual access level and ethics reference status.",
    icon: Database
  },
  {
    href: "/dashboard/researcher/settings",
    title: "Settings",
    description: "Notification preferences and export governance (Phase B stub).",
    icon: Settings
  }
] as const;

export default function ResearcherOverviewPage() {
  const { cohort } = useResearcherData();
  const ethicsEmpty = !cohort.ethicsApproved || !cohort.ethicsReference;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Research Cohort Overview</h2>
        <p className="text-sm text-muted">
          {cohort.organisationName} · {cohort.studiesActive} active studies · aggregate access by default
        </p>
      </div>

      <p
        role="status"
        data-testid="researcher-honesty-banner"
        className="rounded-lg border border-[#E67E22]/30 bg-[#E67E22]/5 px-3 py-2 text-xs text-[#6B3A0A]"
      >
        Synthetic cohorts · ATLAS Phase 2 (not live) · COMPASS / SHIELD support governed aggregates ·
        liveEmis:false — no patient-level spill by default.
      </p>

      {ethicsEmpty ? (
        <Card
          className="border-dashed border-[#E67E22]/40 bg-[#E67E22]/5 shadow-none"
          data-testid="researcher-ethics-empty"
        >
          <CardContent className="p-4 text-sm text-muted">
            <p className="font-medium text-foreground">Demo / synthetic cohort — ethics not signed off</p>
            <p className="mt-1 text-xs">
              Metrics below are rehearsal figures from synthetic patients. No real patient identifiable data
              and no production study export authority until ethics reference is recorded. ATLAS is Phase 2 —
              not a live research agent in this build.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ResearcherKpiRow />

      <FederatedJobsPanel />

      <GovernanceBoundariesCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="h-full border-l-4 border-l-[#E67E22] shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#E67E22]" />
                    <CardTitle className="text-sm">{link.title}</CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-[#E67E22]/20 bg-[#E67E22]/5 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Shield className="h-4 w-4 text-[#E67E22]" />
          <CardTitle className="text-sm text-[#E67E22]">Synthetic data only</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          All cohort metrics in this dashboard use pseudonymised synthetic patients. Evaluation exports log a
          SHIELD audit event when durable Postgres audit is available. No live EHR write-back and no
          certification claims.
        </CardContent>
      </Card>
    </div>
  );
}
