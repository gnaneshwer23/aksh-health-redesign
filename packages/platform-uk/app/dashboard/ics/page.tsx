"use client";

import Link from "next/link";
import { Activity, BarChart3, ChevronRight, Heart, Users } from "lucide-react";

import { IcsKpiRow } from "@/components/dashboard/ics/IcsKpiRow";
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
    description: "EQUITY deep-dive flags, recommended actions, and action plan generation.",
    icon: BarChart3,
    accent: "border-l-accent",
  },
  {
    href: "/dashboard/ics/benchmarking",
    title: "Practice Benchmarking",
    description: "Sortable practice scorecard: AI adoption,, queue clearance, and overall score.",
    icon: Activity,
    accent: "border-l-primary",
  },
  {
    href: "/dashboard/ics/forecast",
    title: "Admission Forecast & Digital Twin",
    description: "14-day ICS admission forecast with aggregate Digital Twin intelligence.",
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
      <div>
        <h2 className="text-lg font-semibold text-foreground">ICS Population Intelligence</h2>
        <p className="text-sm text-muted">
          {icsName}: {data.practices} practices · {data.equityFlags} equity flags · {data.totalPatients.toLocaleString()} patients
          {!loading && source
            ? ` · ${source === "neo4j" ? "live Neo4j" : "local fallback"}`
            : null}
        </p>
      </div>

      <IcsKpiRow />

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className={`h-full shadow-sm transition-shadow hover:shadow-md border-l-4 ${section.accent}`}>
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
