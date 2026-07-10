"use client";

import { Mic } from "lucide-react";

import { AgentBadge } from "@/components/dashboard/AgentBadge";
import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { RiskGauge } from "@/components/dashboard/RiskScoreBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Patient } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

const AGENT_FILTERS = ["VOICE", "DrASSIST", "ORACLE", "GUARDIAN", "SYNTHESIS"] as const;

export function AgentControlPanel({ patient }: { patient: Patient | null }) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-card p-3">
      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="VOICE" /> VOICE</CardTitle></CardHeader>
        <CardContent className="p-3 flex flex-col items-center gap-2">
          <button type="button" aria-label="Start dictation" className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Mic className="h-7 w-7" />
          </button>
          <p className="text-xs text-muted text-center">Click to start dictation</p>
          <p className="text-[10px] text-muted">Last dictation: 2h ago — Pending approval</p>
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
          {patient ? (
            <>
              <RiskGauge score={patient.oracleScore} risk={patient.oracleRisk} />
              <ul className="mt-3 space-y-1 text-[10px] text-muted">
                {patient.digitalTwinPrediction.deteriorationSignals.slice(0, 4).map((s) => <li key={s}>• {s}</li>)}
              </ul>
              <p className="mt-2 text-[10px] text-muted">Updated: {new Date().toLocaleString("en-GB")}</p>
            </>
          ) : <p className="text-xs text-muted">Select a patient</p>}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm flex items-center gap-2"><AgentBadge agent="GUARDIAN" /> GUARDIAN</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2">
          {patient?.flags.includes("GUARDIAN") ? (
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
