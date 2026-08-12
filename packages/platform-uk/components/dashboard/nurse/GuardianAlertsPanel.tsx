"use client";

import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeo4jGuardian } from "@/lib/hooks/use-neo4j-clinical";
import { patients } from "@/lib/mock-data";
import type { ReviewQueueItem } from "@/lib/mock-data/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function guardianSeverity(item: ReviewQueueItem): "high" | "medium" | "low" {
  if (item.priority === "Urgent") return "high";
  if (item.priority === "High") return "medium";
  return "low";
}

function graphSeverity(severity: "red" | "amber" | "green"): "high" | "medium" | "low" {
  if (severity === "red") return "high";
  if (severity === "amber") return "medium";
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

  const primaryPatientId = patientIds[0] ?? "P001";
  const { data: neo4jGuardian, loading: neo4jLoading, source } = useNeo4jGuardian(primaryPatientId);

  const guardianItems = reviewQueueItems.filter(
    (r) => r.agentType === "GUARDIAN" && patientIds.includes(r.patientId)
  );

  const selectedPatient = patients.find((p) => p.id === primaryPatientId) ?? patients[0];
  const graphInteractions = neo4jGuardian?.interactions ?? [];

  return (
    <Card className="border-secondary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">GUARDIAN Alerts</CardTitle>
        <p className="text-xs text-muted">
          {scope === "filtered"
            ? `${guardianItems.length} queue alert(s) across ${filteredPatients.length} patient(s) in current filter`
            : `Safety alerts for ${selectedPatient.name} | reviewed in-dashboard, not routed to GP queue`}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {!neo4jLoading && graphInteractions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted">
              Graph interactions ({source === "neo4j" ? "live Neo4j" : "local fallback"}
              {neo4jGuardian?.overallStatus ? ` · ${neo4jGuardian.overallStatus}` : ""})
            </p>
            {graphInteractions.map((ix) => (
              <GuardianAlert
                key={`${ix.drugA}|${ix.drugB}`}
                severity={graphSeverity(ix.severity)}
                title={`${ix.drugA} + ${ix.drugB}`}
                description={ix.recommendation}
                bnfRef={ix.bnfRef}
              />
            ))}
          </div>
        ) : null}

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
        ) : graphInteractions.length === 0 && !neo4jLoading ? (
          <p className="text-sm text-muted">No active GUARDIAN alerts for the current selection.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
