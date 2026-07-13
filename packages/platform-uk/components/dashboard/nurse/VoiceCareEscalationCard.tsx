"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NurseEscalationTask } from "@/lib/types";
import { readNurseEscalationTasks } from "@/lib/voice-care";

export function VoiceCareEscalationCard() {
  const [escalationTasks, setEscalationTasks] = useState<NurseEscalationTask[]>([]);

  useEffect(() => {
    setEscalationTasks(readNurseEscalationTasks());
  }, []);

  return (
    <Card className="mb-4 border-secondary/30 bg-emerald-light/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">Voice Care</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
            Voice Care monitors patients between appointments. Escalations from outbound calls appear here for nurse
            triage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
