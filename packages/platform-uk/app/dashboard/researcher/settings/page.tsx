"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearcherSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Researcher Settings</h2>
        <p className="text-sm text-muted">Notification preferences, data access scopes, and export governance.</p>
      </div>

      <Card className="border-l-4 border-l-[#E67E22] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Coming in Phase B</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p>Researcher settings will include:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Export notification preferences</li>
            <li>Data access scope requests</li>
            <li>Ethics reference management</li>
            <li>Study cohort membership</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
