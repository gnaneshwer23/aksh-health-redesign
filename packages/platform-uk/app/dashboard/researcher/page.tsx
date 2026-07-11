"use client";

import Link from "next/link";
import { ChevronRight, Database, FlaskConical, Settings, Shield } from "lucide-react";

import { GovernanceBoundariesCard } from "@/components/dashboard/researcher/GovernanceBoundariesCard";
import { ResearcherKpiRow } from "@/components/dashboard/researcher/ResearcherKpiRow";
import { useResearcherData } from "@/components/dashboard/researcher/ResearcherDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_LINKS = [
  {
    href: "/dashboard/researcher/evaluation",
    title: "Outcome Evaluation",
    description: "Cohort metrics, evaluation charts, and authenticated JSON export.",
    icon: FlaskConical,
  },
  {
    href: "/dashboard/researcher/data-access",
    title: "Data Access",
    description: "Aggregate vs individual access level and ethics reference status.",
    icon: Database,
  },
  {
    href: "/dashboard/researcher/settings",
    title: "Settings",
    description: "Notification preferences and export governance — Phase B stub.",
    icon: Settings,
  },
] as const;

export default function ResearcherOverviewPage() {
  const { cohort } = useResearcherData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Research Cohort Overview</h2>
        <p className="text-sm text-muted">
          {cohort.organisationName} · {cohort.studiesActive} active studies · aggregate access by default
        </p>
      </div>

      <ResearcherKpiRow />

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
          All cohort metrics in this dashboard use pseudonymised synthetic patients. Benchmark drilldowns and
          sign-off workflows are available in the research evaluation module — not via legacy review routes.
        </CardContent>
      </Card>
    </div>
  );
}
