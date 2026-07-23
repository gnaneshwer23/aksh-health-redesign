"use client";

import Link from "next/link";
import { Activity, BarChart3, ChevronRight, Heart, Users } from "lucide-react";

import { IcsHeroDemoPath } from "@/components/dashboard/ics/IcsHeroDemoPath";
import { IcsKpiRow } from "@/components/dashboard/ics/IcsKpiRow";
import { SpineSharedEventsPanel } from "@/components/dashboard/precision-health/SpineSharedEventsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";

const SECTIONS = [
  {
    href: "/dashboard/ics/population",
    title: "Population Health",
    description: "Risk distribution and deprivation-linked condition prevalence across the ICS.",
    icon: Users,
    accent: "border-l-warning",
  },
  {
    href: "/dashboard/ics/equity",
    title: "Equity Metrics",
    description: "COMPASS deep-dive flags, recommended actions, and action plan generation.",
    icon: BarChart3,
    accent: "border-l-accent",
  },
  {
    href: "/dashboard/ics/benchmarking",
    title: "Practice Benchmarking",
    description: "Sortable practice scorecard: AI adoption, queue clearance, and overall score.",
    icon: Activity,
    accent: "border-l-primary",
  },
  {
    href: "/dashboard/ics/forecast",
    title: "Admission Forecast & Risk state",
    description: "14-day ICS admission forecast with aggregate population risk-state (not a physiological twin).",
    icon: Heart,
    accent: "border-l-[#006B4F]",
  },
] as const;

export default function IcsOverviewPage() {
  const { data, source, loading } = useIcsData();
  const { profile } = useUserProfile();
  const icsName = getPersonalizedLabel(profile, data.icsName);

  return (
    <div className="space-y-6">
      <IcsHeroDemoPath />
      <p
        className="rounded-2xl border border-border/60 bg-card/80 px-4 py-2.5 text-xs text-muted-foreground shadow-sm"
        data-testid="ics-honesty-banner"
      >
        Synthetic ICS cohorts · liveEmis:false · aggregate planning only — no patient-level spill.
        COMPASS leads equity; HORIZON / PATHWAY frame forecast scaffolding — not a live ICS feed or twin.
      </p>

      <div>
        <h2 className="text-lg font-semibold text-foreground">ICS Population Intelligence</h2>
        <p className="text-sm text-muted">
          {icsName}: {data.practices} practices · {data.equityFlags} equity flags · {data.totalPatients.toLocaleString()} patients
          {!loading && source
            ? ` · ${source === "neo4j" ? "live Neo4j" : source === "demo" ? "public synthetic demo" : "local fallback"}`
            : null}
        </p>
      </div>

      <IcsKpiRow />

      <SpineSharedEventsPanel
        title="Shared clinical spine (cohort aggregates)"
        patientIds={["P001", "P002"]}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className={`dashboard-card h-full border-0 border-l-4 shadow-none ${section.accent}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-warning" />
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
