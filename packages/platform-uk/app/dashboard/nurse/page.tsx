"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { VoiceRecorder } from "@/components/dashboard/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toaster";
import { CURRENT_GP, patients, reviewQueueItems } from "@/lib/mock-data";
import type { NurseEscalationTask } from "@/lib/types";
import { readNurseEscalationTasks } from "@/lib/voice-care";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";
import { cn } from "@/lib/utils";

const HANDOVER_DRAFT = `Night shift handover — Ward 3A
3 patients with elevated ORACLE scores. Mrs Johnson (P001) — breathlessness reported via Voice Care Agent, requires same-day review. Mr Green (P008) — polypharmacy alert pending pharmacist review. All vital signs documented. 2 EQUITY flags raised for review.`;

export default function NurseDashboardPage() {
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const { nurseFilter, setNurseFilter, selectedPatientId, setSelectedPatient, addAuditEvent } = useDashboardStore();
  const [handoverOpen, setHandoverOpen] = useState(panel === "handover");
  const [handoverAccepted, setHandoverAccepted] = useState(false);
  const [handoverEditing, setHandoverEditing] = useState(false);
  const [handoverContent, setHandoverContent] = useState(HANDOVER_DRAFT);
  const [handoverEdited, setHandoverEdited] = useState(false);
  const [entryMode, setEntryMode] = useState<"manual" | "voice">("manual");
  const [vitals, setVitals] = useState({ bpSys: "", bpDia: "", hr: "", rr: "", spo2: "", temp: "", weight: "" });
  const [escalationTasks, setEscalationTasks] = useState<NurseEscalationTask[]>([]);

  useEffect(() => {
    setEscalationTasks(readNurseEscalationTasks());
  }, []);

  useEffect(() => {
    if (panel === "handover") setHandoverOpen(true);
    if (panel === "alerts") setNurseFilter("alerts");
    if (panel === "observations") setNurseFilter("observations");
  }, [panel, setNurseFilter]);

  const filtered = patients.filter((p) => {
    if (nurseFilter === "alerts") return p.flags.includes("GUARDIAN") || p.flags.includes("URGENT");
    if (nurseFilter === "observations") return !p.lastObsTime?.startsWith("2026-07-10");
    if (nurseFilter === "completed") return p.lastObsTime?.startsWith("2026-07-10");
    return true;
  });

  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const guardianItems = reviewQueueItems.filter((r) => r.patientId === patient.id && r.agentType === "GUARDIAN");

  const saveVitals = () => {
    addAuditEvent({ user: "Nurse Davies", agent: "Nurse", action: "Saved vital signs", resource: `${patient.name} — BP ${vitals.bpSys}/${vitals.bpDia}` });
    toast({ title: "Observations saved", description: "Mock FHIR Observation created" });
  };

  return (
    <DashboardShell role="nurse" title="Nurse Dashboard">
      {escalationTasks.length ? (
        <Card className="mb-4 border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Voice Care escalation tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {escalationTasks.map((task) => (
              <div className="rounded-sm border border-border bg-card p-3" key={task.id}>
                <p className="font-medium">{task.patientLabel}</p>
                <p className="text-sm text-muted">{task.summary}</p>
                <span className="mt-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{task.priority}</span>
              </div>
            ))}
            <Link className="text-sm text-accent underline" href="/demo/voice-care-day3">
              Open Voice Care Day 3 simulation
            </Link>
          </CardContent>
        </Card>
      ) : null}
      <div className="flex h-full overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-border bg-card p-3">
          <ConsentBanner className="mb-3" />
          <Tabs value={nurseFilter} onValueChange={(v) => setNurseFilter(v as typeof nurseFilter)}>
            <TabsList className="w-full grid grid-cols-2 h-auto">
              <TabsTrigger value="all" className="text-[10px]">All</TabsTrigger>
              <TabsTrigger value="alerts" className="text-[10px]">🔴 Alerts</TabsTrigger>
              <TabsTrigger value="observations" className="text-[10px]">Obs Due</TabsTrigger>
              <TabsTrigger value="completed" className="text-[10px]">Done</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-3 space-y-1">
            {filtered.map((p) => (
              <PatientCard key={p.id} patient={p} selected={patient.id === p.id} onClick={() => setSelectedPatient(p.id)} />
            ))}
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <header className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <h1 className="text-lg font-semibold">{patient.name}</h1>
            <p className="text-xs text-muted">DOB {patient.dob} · NHS {patient.nhsNumber} · GP: {patient.supervisingGp}</p>
            <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} className="mt-2" />
          </header>

          {patient.equityFlag && (
            <div className="rounded-sm bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-800" role="alert">
              Disparity flag — consider GP review
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Vital Signs Entry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" variant={entryMode === "manual" ? "default" : "outline"} onClick={() => setEntryMode("manual")}>Manual Entry</Button>
                <Button size="sm" variant={entryMode === "voice" ? "default" : "outline"} onClick={() => setEntryMode("voice")}>VOICE Dictation</Button>
              </div>
              {entryMode === "voice" ? <VoiceRecorder /> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex gap-2"><Input placeholder="Systolic" value={vitals.bpSys} onChange={(e) => setVitals({ ...vitals, bpSys: e.target.value })} aria-label="Systolic BP" /><Input placeholder="Diastolic" value={vitals.bpDia} onChange={(e) => setVitals({ ...vitals, bpDia: e.target.value })} aria-label="Diastolic BP" /></div>
                  <Input placeholder="Heart rate (bpm)" value={vitals.hr} onChange={(e) => setVitals({ ...vitals, hr: e.target.value })} />
                  <Input placeholder="Resp rate (/min)" value={vitals.rr} onChange={(e) => setVitals({ ...vitals, rr: e.target.value })} />
                  <Input placeholder="SpO2 (%)" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} />
                  <Input placeholder="Temperature (°C)" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} />
                  <Input placeholder="Weight (kg)" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
                </div>
              )}
              <Button variant="accent" onClick={saveVitals}>Save Observations</Button>
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">GUARDIAN Alerts</h2>
            {guardianItems.length > 0 ? guardianItems.map((g) => (
              <GuardianAlert key={g.id} severity="high" title={g.title} description={g.content.slice(0, 120)} bnfRef="BNF 2.9" />
            )) : <p className="text-sm text-muted">No active alerts</p>}
          </section>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <Button onClick={() => setHandoverOpen(true)}>Generate Handover Summary</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={handoverOpen} onOpenChange={setHandoverOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              AI Handover Summary — {handoverAccepted ? "Shared" : handoverEdited ? "Edited — re-acceptance required" : "Draft — Not Sent"}
            </DialogTitle>
          </DialogHeader>
          {handoverEditing ? (
            <SOAPEditor
              value={handoverContent}
              onChange={setHandoverContent}
              onSave={() => {
                setHandoverEditing(false);
                setHandoverEdited(true);
                setHandoverAccepted(false);
                addAuditEvent({ user: "Nurse Davies", agent: "SYNTHESIS", action: "Edited handover summary", resource: "Night shift" });
              }}
              onCancel={() => {
                setHandoverEditing(false);
                setHandoverContent(HANDOVER_DRAFT);
              }}
            />
          ) : (
            <p className="text-sm whitespace-pre-line">{handoverContent}</p>
          )}
          {!handoverAccepted && !handoverEditing ? (
            <HitlActions
              status={handoverEdited ? "Edited" : "Pending"}
              onAccept={() => {
                setHandoverAccepted(true);
                setHandoverEdited(false);
                addAuditEvent({ user: "Nurse Davies", agent: "SYNTHESIS", action: "Approved handover summary", resource: "Night shift" });
                toast({ title: "Handover shared" });
              }}
              onEdit={() => setHandoverEditing(true)}
              onReject={(reason) => {
                addAuditEvent({ user: "Nurse Davies", agent: "SYNTHESIS", action: `Rejected handover — ${reason || "No reason provided"}`, resource: "Night shift" });
                setHandoverOpen(false);
              }}
            />
          ) : handoverAccepted ? (
            <p className="text-xs text-accent">Shared at {new Date().toLocaleTimeString("en-GB")}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
