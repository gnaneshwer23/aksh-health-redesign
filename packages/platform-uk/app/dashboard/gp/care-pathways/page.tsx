"use client";

import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { carePathways, countAwaitingApproval } from "@/lib/mock-data";

export default function GpCarePathwaysPage() {
  return (
    <DashboardShell role="gp" title="Care Pathway Automation">
      <div className="overflow-y-auto p-4 space-y-6">
        <ConsentBanner />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Active Care Pathways</h1>
          <Badge className="bg-warning text-white">{countAwaitingApproval()} awaiting approval</Badge>
        </div>
        {carePathways.map((cp) => (
          <Card key={cp.id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{cp.name}</CardTitle>
              <p className="text-xs text-muted">{cp.triggerCondition} · {cp.automationLevel}</p>
            </CardHeader>
            <CardContent>
              <CarePathwayTracker pathways={[cp]} />
              <div className="mt-4 space-y-2">
                {cp.steps.map((s) => (
                  <div key={s.stepNumber} className="flex items-center justify-between text-xs border-b border-border py-2">
                    <span>{s.stepNumber}. {s.title}</span>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
