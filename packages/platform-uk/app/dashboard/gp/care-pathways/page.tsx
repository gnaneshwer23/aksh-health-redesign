"use client";

import { useMemo } from "react";

import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { carePathways, countAwaitingApproval, PRACTICE_NAME } from "@/lib/mock-data";
import { buildEmptyStateMessage, filterByOrg, getPersonalizedLabel } from "@/lib/profile/personalization";

export default function GpCarePathwaysPage() {
  const { profile } = useUserProfile();
  const practiceLabel = getPersonalizedLabel(profile, PRACTICE_NAME);
  const scopedPathways = useMemo(
    () => filterByOrg(carePathways, profile?.organisation),
    [profile?.organisation]
  );

  return (
    <DashboardShell role="gp" title="Care Pathway Automation" organisation={profile?.organisation}>
      <div className="overflow-y-auto p-4 space-y-6">
        <ConsentBanner />
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h1 className="text-lg font-semibold">Active Care Pathways</h1>
          <Badge className="bg-warning text-white">{countAwaitingApproval()} awaiting approval</Badge>
        </div>
        <p className="text-sm text-muted">Pathways for {practiceLabel}</p>
        {scopedPathways.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
            {buildEmptyStateMessage(profile, "care pathways", "No active care pathways yet.")}
          </p>
        ) : (
          scopedPathways.map((cp) => (
            <Card key={cp.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{cp.name}</CardTitle>
                <p className="text-xs text-muted">
                  {cp.triggerCondition} · {cp.automationLevel}
                  {cp.organisation ? ` · ${cp.organisation}` : ""}
                </p>
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
          ))
        )}
      </div>
    </DashboardShell>
  );
}
