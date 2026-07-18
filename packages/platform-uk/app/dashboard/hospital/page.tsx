import Link from "next/link";
import { BarChart3, Building2, Users } from "lucide-react";

import { calcBedOccupancyPct } from "@/components/dashboard/hospital/hospital-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hospitalData } from "@/lib/mock-data";

const sections = [
  {
    href: "/dashboard/hospital/wards",
    label: "Ward Status",
    description: "Live ward grid with occupancy and discharge backlog",
    icon: Building2,
  },
  {
    href: "/dashboard/hospital/capacity",
    label: "Capacity",
    description: "14-day forecast and AI recommendations with HITL approval",
    icon: BarChart3,
  },
  {
    href: "/dashboard/hospital/staffing",
    label: "Staffing",
    description: "Ward staffing ratios and agency trigger alerts",
    icon: Users,
  },
];

export default function HospitalOverviewPage({
  hospitalName = hospitalData.hospitalName,
}: {
  hospitalName?: string;
}) {
  const bedPct = calcBedOccupancyPct(hospitalData);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Command Centre Overview</h2>
        <p className="text-sm text-muted mt-1">
          {hospitalName}: synthetic operational intelligence across {hospitalData.wards.length} wards
          (rehearsal — not a live PAS feed)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted">ED Wait</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-danger">{hospitalData.edWaitingTime}h</p>
            <p className="text-xs text-muted">{hospitalData.edPatientsWaiting} patients waiting</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted">Bed Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{bedPct}%</p>
            <p className="text-xs text-muted">Across all wards at {hospitalName}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted">Theatres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">
              {hospitalData.theatresRunning}/{hospitalData.theatresTotal}
            </p>
            <p className="text-xs text-muted">Running now</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted">Agency Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-danger">{hospitalData.agencyTriggers.length}</p>
            <p className="text-xs text-muted">Pending staffing triggers</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h3 className="text-sm font-semibold mb-3">Sections</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href} className="group">
                <Card className="shadow-sm h-full transition-colors group-hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{section.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted">{section.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
