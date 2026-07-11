"use client";

import { useState } from "react";

import { AgentBadge } from "@/components/dashboard/AgentBadge";
import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { RiskGauge } from "@/components/dashboard/RiskScoreBadge";
import { VoiceRecorder } from "@/components/dashboard/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import type { Patient } from "@/lib/mock-data/types";
import type { Neo4jGuardianResponse, Neo4jPatientResponse } from "@/lib/neo4j/types";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function PanelSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 w-3/4 rounded bg-muted/40" />
      <div className="h-3 w-full rounded bg-muted/30" />
      <div className="h-3 w-2/3 rounded bg-muted/20" />
    </div>
  );
}

function guardianSeverity(severity: "red" | "amber" | "green"): "high" | "medium" | "low" {
  if (severity === "red") return "high";
  if (severity === "amber") return "medium";
  return "low";
}

export function AgentControlPanel({
  patient,
  oracleData,
  guardianData,
  oracleLoading,
  guardianLoading,
  className,
}: {
  patient: Patient | null;
  oracleData?: Neo4jPatientResponse | null;
  guardianData?: Neo4jGuardianResponse | null;
  oracleLoading?: boolean;
  guardianLoading?: boolean;
  className?: string;
}) {
  const stageVoiceTranscript = useDashboardStore((state) => state.stageVoiceTranscript);
  const { profile } = useUserProfile();
  const [lastDictationAt, setLastDictationAt] = useState<string | null>(null);

  const oracleScore = oracleData?.oracleScore ?? patient?.oracleScore ?? 0;
  const oracleRisk = oracleData?.oracleRisk ?? patient?.oracleRisk ?? "Low";
  const riskFactors =
    oracleData?.riskFactors ??
    patient?.digitalTwinPrediction.deteriorationSignals ??
    [];

  function handleVoiceTranscript(transcript: string) {
    if (!patient) {
      toast({
        title: "Select a patient",
        description: "Choose a patient before starting dictation.",
      });
      return;
    }

    stageVoiceTranscript({
      patientId: patient.id,
      patientName: patient.name,
      patientNhsNumber: patient.nhsNumber,
      transcript,
      reviewerName: profile?.fullName ?? "Clinician",
    });
    setLastDictationAt(new Date().toLocaleString("en-GB"));
    toast({
      title: "Transcript staged",
      description: "VOICE transcript added to your review queue.",
    });
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col gap-3 overflow-y-auto bg-card p-3 lg:w-72 lg:border-l lg:border-border",
        className
      )}
    >
      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="VOICE" /> VOICE</CardTitle></CardHeader>
        <CardContent className="p-3 flex flex-col items-center gap-2">
          <VoiceRecorder onTranscript={handleVoiceTranscript} />
          <p className="text-[10px] text-muted text-center">
            {lastDictationAt
              ? `Last dictation: ${lastDictationAt}. Pending approval.`
              : "Dictation feeds the VOICE agent and stages a transcript for review."}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="DrASSIST" /> Working Diagnoses</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2 text-xs">
          {patient ? patient.activeConditions.slice(0, 3).map((c) => (
            <div key={c} className="flex justify-between gap-2 border-b border-border pb-2">
              <span>{c}</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">Override</Button>
            </div>
          )) : <p className="text-muted">Select a patient</p>}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="ORACLE" /> ORACLE Risk</CardTitle></CardHeader>
        <CardContent className="p-3">
          {!patient ? (
            <p className="text-xs text-muted">Select a patient</p>
          ) : oracleLoading ? (
            <PanelSkeleton />
          ) : (
            <>
              <RiskGauge score={oracleScore} risk={oracleRisk} />
              <ul className="mt-3 space-y-1 text-[10px] text-muted">
                {riskFactors.slice(0, 4).map((s) => <li key={s}>• {s}</li>)}
              </ul>
              <p className="mt-2 text-[10px] text-muted">Updated: {new Date().toLocaleString("en-GB")}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="GUARDIAN" /> GUARDIAN</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2">
          {!patient ? (
            <p className="text-xs text-muted">Select a patient</p>
          ) : guardianLoading ? (
            <PanelSkeleton />
          ) : guardianData && guardianData.interactions.length > 0 ? (
            guardianData.interactions.map((interaction) => (
              <GuardianAlert
                key={`${interaction.drugA}-${interaction.drugB}`}
                severity={guardianSeverity(interaction.severity)}
                title={`${interaction.drugA} + ${interaction.drugB}`}
                description={interaction.recommendation}
                bnfRef={interaction.bnfRef}
              />
            ))
          ) : patient.flags.includes("GUARDIAN") ? (
            <GuardianAlert severity="high" title="Drug interaction flagged" description="Review current medications for bleeding risk." bnfRef="BNF 2.9" />
          ) : (
            <p className="text-xs text-muted">No active alerts</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="SYNTHESIS" /> SYNTHESIS</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="flex rounded-sm border border-border p-0.5 text-[10px]">
            {["Brief", "Standard", "Detailed"].map((l, i) => (
              <button key={l} type="button" className={cn("flex-1 rounded-sm py-1", i === 1 ? "bg-primary text-white" : "text-muted")}>{l}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" disabled={!patient}>Regenerate Summary</Button>
        </CardContent>
      </Card>
    </aside>
  );
}
