"use client";

import { useState } from "react";

import { VoiceRecorder } from "@/components/dashboard/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export type VitalsValues = {
  bpSys: string;
  bpDia: string;
  hr: string;
  rr: string;
  spo2: string;
  temp: string;
  weight: string;
};

const EMPTY_VITALS: VitalsValues = {
  bpSys: "",
  bpDia: "",
  hr: "",
  rr: "",
  spo2: "",
  temp: "",
  weight: "",
};

const MOCK_VOICE_VITALS: VitalsValues = {
  bpSys: "128",
  bpDia: "82",
  hr: "78",
  rr: "16",
  spo2: "97",
  temp: "36.8",
  weight: "72.5",
};

export function VitalsForm() {
  const { selectedPatientId, addAuditEvent } = useDashboardStore();
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const [entryMode, setEntryMode] = useState<"manual" | "voice">("manual");
  const [vitals, setVitals] = useState<VitalsValues>(EMPTY_VITALS);

  const saveVitals = () => {
    addAuditEvent({
      user: "Nurse Davies",
      agent: "Nurse",
      action: "Saved vital signs",
      resource: `${patient.name} — BP ${vitals.bpSys}/${vitals.bpDia}`,
    });
    toast({ title: "Observations saved", description: "Mock FHIR Observation created" });
  };

  const handleVoiceComplete = () => {
    setVitals(MOCK_VOICE_VITALS);
    setEntryMode("manual");
    toast({
      title: "VOICE parsed vitals — please verify before save",
      description: "Review auto-filled values before saving to the record.",
    });
  };

  return (
    <Card className="border-secondary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">Vital Signs Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={entryMode === "manual" ? "default" : "outline"}
            className={entryMode === "manual" ? "bg-secondary hover:bg-secondary/90" : ""}
            onClick={() => setEntryMode("manual")}
          >
            Manual Entry
          </Button>
          <Button
            size="sm"
            variant={entryMode === "voice" ? "default" : "outline"}
            className={entryMode === "voice" ? "bg-secondary hover:bg-secondary/90" : ""}
            onClick={() => setEntryMode("voice")}
          >
            VOICE Dictation
          </Button>
        </div>
        {entryMode === "voice" ? (
          <VoiceRecorder onRecordingComplete={handleVoiceComplete} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <Input
                placeholder="Systolic"
                value={vitals.bpSys}
                onChange={(e) => setVitals({ ...vitals, bpSys: e.target.value })}
                aria-label="Systolic BP"
              />
              <Input
                placeholder="Diastolic"
                value={vitals.bpDia}
                onChange={(e) => setVitals({ ...vitals, bpDia: e.target.value })}
                aria-label="Diastolic BP"
              />
            </div>
            <Input placeholder="Heart rate (bpm)" value={vitals.hr} onChange={(e) => setVitals({ ...vitals, hr: e.target.value })} />
            <Input placeholder="Resp rate (/min)" value={vitals.rr} onChange={(e) => setVitals({ ...vitals, rr: e.target.value })} />
            <Input placeholder="SpO2 (%)" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} />
            <Input placeholder="Temperature (°C)" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} />
            <Input placeholder="Weight (kg)" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
          </div>
        )}
        <Button variant="accent" onClick={saveVitals}>
          Save Observations
        </Button>
      </CardContent>
    </Card>
  );
}
