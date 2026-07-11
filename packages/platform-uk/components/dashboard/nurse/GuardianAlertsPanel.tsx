"use client";

import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patients } from "@/lib/mock-data";
import type { ReviewQueueItem } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function guardianSeverity(item: ReviewQueueItem): "high" | "medium" | "low" {
  if (item.priority === "Urgent") return "high";
  if (item.priority === "High") return "medium";
  return "low";
}

export function GuardianAlertsPanel({ scope = "selected" }: { scope?: "selected" | "filtered" }) {
  const { selectedPatientId, nurseFilter, reviewQueueItems } = useDashboardStore();

  const filteredPatients = patients.filter((p) => {
    if (nurseFilter === "alerts") return p.flags.includes("GUARDIAN") || p.flags.includes("URGENT");
    if (nurseFilter === "observations") return !p.lastObsTime?.startsWith("2026-07-10");
    if (nurseFilter === "completed") return p.lastObsTime?.startsWith("2026-07-10");
    return true;
  });

  const patientIds =
    scope === "filtered"
      ? filteredPatients.map((p) => p.id)
      : [selectedPatientId ?? filteredPatients[0]?.id ?? "P001"];

  const guardianItems = reviewQueueItems.filter(
    (r) => r.agentType === "GUARDIAN" && patientIds.includes(r.patientId)
  );

  const selectedPatient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];

  return (
    <Card className="border-secondary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">GUARDIAN Alerts</CardTitle>
        <p className="text-xs text-muted">
          {scope === "filtered"
            ? `${guardianItems.length} alert(s) across ${filteredPatients.length} patient(s) in current filter`
            : `Safety alerts for ${selectedPatient.name} — reviewed in-dashboard, not routed to GP queue`}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {guardianItems.length > 0 ? (
          guardianItems.map((g) => (
            <GuardianAlert
              key={g.id}
              severity={guardianSeverity(g)}
              title={g.title}
              description={g.content.slice(0, 160)}
              bnfRef={g.content.includes("BNF") ? "BNF 2.9" : undefined}
            />
          ))
        ) : (
          <p className="text-sm text-muted">No active GUARDIAN alerts for the current selection.</p>
        )}
      </CardContent>
    </Card>
  );
}
