"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { VoiceCareEscalationResult } from "@/lib/agents/voice-care";
import { persistVoiceCareClientState } from "@/lib/agents/voice-care";
import type { NurseEscalationTask } from "@/lib/types";
import { readNurseEscalationTasks } from "@/lib/voice-care";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { patients } from "@/lib/mock-data";

export function VoiceCareEscalationCard() {
  const { status } = useSession();
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const [escalationTasks, setEscalationTasks] = useState<NurseEscalationTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastLabel, setLastLabel] = useState<string | null>(null);

  const refresh = async () => {
    const local = readNurseEscalationTasks();
    if (status !== "authenticated") {
      setEscalationTasks(local);
      return;
    }
    try {
      const response = await fetch("/api/agents/voice-care", { credentials: "include" });
      if (!response.ok) {
        setEscalationTasks(local);
        return;
      }
      const data = (await response.json()) as { tasks?: NurseEscalationTask[] };
      const remote = data.tasks ?? [];
      const byId = new Map<string, NurseEscalationTask>();
      for (const task of [...remote, ...local]) byId.set(task.id, task);
      setEscalationTasks(Array.from(byId.values()));
    } catch {
      setEscalationTasks(local);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const simulateEscalation = async () => {
    if (status !== "authenticated") {
      toast({
        title: "Sign in required",
        description: "Synthetic VOICE CARE escalation logs to SHIELD when signed in."
      });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/agents/voice-care", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: `voice-care-${patient.id}`,
          patientLabel: patient.name,
          oracleScore: patient.oracleScore
        })
      });
      if (!response.ok) {
        toast({ title: "Escalation failed", description: "VOICE CARE API unavailable." });
        return;
      }
      const result = (await response.json()) as VoiceCareEscalationResult & {
        durable?: boolean;
      };
      persistVoiceCareClientState(result);
      setLastLabel(result.label);
      await refresh();
      toast({
        title: "Synthetic outbound logged",
        description: result.durable
          ? "SHIELD audit + nurse task created · no telephony · no EHR write"
          : "Nurse task staged locally · SHIELD durable write unavailable"
      });
    } catch {
      toast({ title: "Escalation failed", description: "Network error calling VOICE CARE." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-4 border-secondary/30 bg-emerald-light/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">Voice Care</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="rounded-md border border-border/60 bg-card/80 px-2.5 py-2 text-[11px] text-muted">
          Channel: <strong>synthetic outbound</strong> only. No live telephony, no auto-dialler, and no EHR
          write-back. Escalations create a nurse-facing task and attempt a durable SHIELD audit row.
        </p>
        {lastLabel ? (
          <p className="text-[11px] font-medium text-secondary" data-testid="voice-care-synthetic-label">
            {lastLabel}
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void simulateEscalation()}
          data-testid="voice-care-simulate-escalation"
        >
          {busy ? "Logging…" : "Simulate Day-3 synthetic outbound"}
        </Button>
        {escalationTasks.length > 0 ? (
          escalationTasks.map((task) => (
            <div className="rounded-sm border border-border bg-card p-3" key={task.id}>
              <p className="font-medium">{task.patientLabel}</p>
              <p className="text-sm text-muted">{task.summary}</p>
              <span className="mt-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                {task.priority}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">
            No escalations yet. Run a synthetic Day-3 outbound to stage a nurse task for triage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
