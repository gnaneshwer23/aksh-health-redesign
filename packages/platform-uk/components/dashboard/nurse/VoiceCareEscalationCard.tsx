"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { VoiceCareEscalationResult } from "@/lib/agents/voice-care";
import { persistVoiceCareClientState } from "@/lib/agents/voice-care";
import type { NurseEscalationTask } from "@/lib/types";
import { readNurseEscalationTasks } from "@/lib/voice-care";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { patients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Quiet VoiceCare strip for nurse home — collapsed by default; expands for tasks / simulate.
 */
export function VoiceCareEscalationCard() {
  const { status } = useSession();
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const [escalationTasks, setEscalationTasks] = useState<NurseEscalationTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
        description: "Synthetic VOICE CARE escalation logs to SHIELD when signed in.",
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
          oracleScore: patient.oracleScore,
        }),
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
      setExpanded(true);
      await refresh();
      toast({
        title: "Synthetic outbound logged",
        description: result.durable
          ? "SHIELD audit + nurse task created · no telephony · no EHR write"
          : "Nurse task staged locally · SHIELD durable write unavailable",
      });
    } catch {
      toast({ title: "Escalation failed", description: "Network error calling VOICE CARE." });
    } finally {
      setBusy(false);
    }
  };

  const taskCount = escalationTasks.length;

  return (
    <div
      className={cn(
        "rounded-xl border border-secondary/25 bg-secondary/[0.04]",
        expanded ? "px-3 py-2.5" : "px-3 py-1.5"
      )}
      data-testid="voice-care-strip"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Phone className="h-3.5 w-3.5 text-secondary" aria-hidden />
        <p className="text-xs font-medium text-secondary">Voice Care</p>
        <span className="text-[10px] text-muted">synthetic outbound · no telephony</span>
        {taskCount > 0 ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            {taskCount} task{taskCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {lastLabel ? (
          <span className="text-[10px] font-medium text-secondary" data-testid="voice-care-synthetic-label">
            {lastLabel}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            disabled={busy}
            onClick={() => void simulateEscalation()}
            data-testid="voice-care-simulate-escalation"
          >
            {busy ? "Logging…" : "Simulate Day-3"}
          </Button>
          <button
            type="button"
            className="rounded-md p-1 text-muted hover:bg-muted/30 hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse Voice Care" : "Expand Voice Care"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-2 space-y-2 border-t border-border-subtle/60 pt-2">
          <p className="text-[11px] text-muted">
            Channel: <strong>synthetic outbound</strong> only. No live telephony, no auto-dialler, and no
            EHR write-back. Escalations create a nurse-facing task and attempt a durable SHIELD audit row.
          </p>
          {escalationTasks.length > 0 ? (
            escalationTasks.map((task) => (
              <div className="rounded-sm border border-border bg-card p-2.5" key={task.id}>
                <p className="text-sm font-medium">{task.patientLabel}</p>
                <p className="text-xs text-muted">{task.summary}</p>
                <span className="mt-1.5 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
                  {task.priority}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted">
              No escalations yet. Run a synthetic Day-3 outbound to stage a nurse task for triage.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
