"use client";

import { Database, Lock, ShieldCheck } from "lucide-react";

import { useResearcherData } from "@/components/dashboard/researcher/ResearcherDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ResearcherDataAccessPage() {
  const { cohort } = useResearcherData();
  const isAggregate = cohort.dataAccessLevel === "aggregate";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Data Access</h2>
        <p className="text-sm text-muted">
          Your approved data access level and ethics governance for {cohort.organisationName}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn("shadow-sm border-l-4", isAggregate ? "border-l-[#E67E22]" : "border-l-accent")}>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Database className="h-4 w-4 text-[#E67E22]" />
            <CardTitle className="text-base">Current access level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-[#E67E22] px-3 py-1 text-xs font-semibold text-white capitalize">
                {cohort.dataAccessLevel}
              </span>
              {isAggregate && (
                <span className="text-xs text-muted">Default for new researcher accounts</span>
              )}
            </div>
            <p className="text-sm text-muted">
              Institution: <span className="font-medium text-foreground">{cohort.organisationName}</span>
            </p>
            <p className="text-sm text-muted">
              {isAggregate
                ? "You can view cohort-level metrics, study summaries, and offline evaluation signals. Individual patient identifiers are not available."
                : "Individual-level access is active under an approved ethics protocol. All exports are audit-logged."}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-[#E67E22]">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <ShieldCheck className="h-4 w-4 text-[#E67E22]" />
            <CardTitle className="text-base">Ethics reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cohort.ethicsReference ? (
              <p className="font-mono text-sm font-semibold text-foreground">{cohort.ethicsReference}</p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Lock className="h-4 w-4 shrink-0" />
                <span>No ethics reference on file. Individual-level access not approved.</span>
              </div>
            )}
            <p className="text-xs text-muted">
              To request individual-level data access, submit your REC or HRA approval reference to your organisation
              administrator. Ethics approval is required before any identifiable export is permitted.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Access comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted">
                  <th className="pb-2 pr-4">Capability</th>
                  <th className="pb-2 pr-4">Aggregate</th>
                  <th className="pb-2">Individual (ethics required)</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                {[
                  ["Cohort metrics", "Yes", "Yes"],
                  ["Study-level summaries", "Yes", "Yes"],
                  ["Offline evaluation export", "Yes", "Scoped to protocol"],
                  ["Patient identifiers", "No", "Yes, with ethics ref"],
                  ["Clinical record linkage", "No", "Governance approval required"],
                ].map(([capability, aggregate, individual]) => (
                  <tr key={capability} className="border-b border-border-subtle">
                    <td className="py-2 pr-4 font-medium text-foreground">{capability}</td>
                    <td className="py-2 pr-4">{aggregate}</td>
                    <td className="py-2">{individual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
