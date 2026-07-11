"use client";

import { Shield } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useResearcherData } from "./ResearcherDataContext";

export function GovernanceBoundariesCard() {
  const { cohort } = useResearcherData();

  return (
    <Card className="border-l-4 border-l-[#E67E22] shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Shield className="h-4 w-4 text-[#E67E22]" />
        <CardTitle className="text-base">Governance boundaries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted">
        <p>
          Your default access is <strong className="text-foreground">aggregate-only</strong>. Pseudonymised cohort
          metrics, study-level summaries, and offline evaluation signals. No identifiable patient records are included
          in routine exports.
        </p>
        <p>
          <strong className="text-foreground">Individual-level data</strong> requires a valid ethics reference and
          explicit governance approval. Requests without an approved ethics reference are blocked at export time.
        </p>
        <div className="rounded-lg bg-[#E67E22]/5 px-3 py-2 text-xs">
          <span className="font-semibold text-[#E67E22]">Current access: </span>
          <span className="capitalize text-foreground">{cohort.dataAccessLevel}</span>
          {cohort.ethicsReference ? (
            <span className="text-muted"> · Ethics ref: {cohort.ethicsReference}</span>
          ) : (
            <span className="text-muted"> · No individual-level ethics approval on file</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
