"use client";

import { useSession } from "next-auth/react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import {
  DEFAULT_GP_PREFERENCES,
  GP_PREFERENCE_LABELS,
  type GpPreferences,
} from "@/lib/mock-data/gp-preferences";

function resolveGpPreferences(sessionPreferences: Record<string, unknown> | undefined): GpPreferences {
  if (!sessionPreferences) return DEFAULT_GP_PREFERENCES;

  return {
    synthesisLength:
      (sessionPreferences.synthesisLength as GpPreferences["synthesisLength"]) ??
      DEFAULT_GP_PREFERENCES.synthesisLength,
    oracleAlerts:
      (sessionPreferences.oracleAlerts as GpPreferences["oracleAlerts"]) ??
      DEFAULT_GP_PREFERENCES.oracleAlerts,
    guardianSensitivity:
      (sessionPreferences.guardianSensitivity as GpPreferences["guardianSensitivity"]) ??
      DEFAULT_GP_PREFERENCES.guardianSensitivity,
    voiceAgent:
      (sessionPreferences.voiceAgent as GpPreferences["voiceAgent"]) ?? DEFAULT_GP_PREFERENCES.voiceAgent,
    equityReports:
      (sessionPreferences.equityReports as GpPreferences["equityReports"]) ??
      DEFAULT_GP_PREFERENCES.equityReports,
    dailyDigest:
      (sessionPreferences.dailyDigest as GpPreferences["dailyDigest"]) ??
      DEFAULT_GP_PREFERENCES.dailyDigest,
  };
}

export default function GpSettingsPage() {
  const { data: session } = useSession();
  const preferences = resolveGpPreferences(
    (session?.user as { preferences?: Record<string, unknown> } | undefined)?.preferences
  );

  return (
    <DashboardShell role="gp" title="GP Settings">
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI agent preferences</h1>
            <p className="text-sm text-muted">
              Configured during onboarding — read-only in this build. Editing opens in a future release.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast({
                title: "Edit preferences",
                description: "Preference editing will be available in Phase C.",
              })
            }
          >
            Edit preferences
          </Button>
        </div>

        <Card className="dashboard-card border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Onboarding preferences</CardTitle>
            <p className="text-xs text-muted">
              Signed in as {session?.user?.name ?? session?.user?.email ?? "GP user"}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border-subtle">
              {(Object.keys(GP_PREFERENCE_LABELS) as Array<keyof GpPreferences>).map((key) => (
                <div key={key} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <dt className="font-medium text-foreground">{GP_PREFERENCE_LABELS[key]}</dt>
                  <dd className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {preferences[key]}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
