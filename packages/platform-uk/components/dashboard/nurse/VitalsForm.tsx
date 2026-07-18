"use client";

import { useState } from "react";
import Link from "next/link";

import { Neo4jMockModeBanner } from "@/components/dashboard/Neo4jMockModeBanner";
import { VoiceRecorder } from "@/components/dashboard/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useNeo4jPatient } from "@/lib/hooks/use-neo4j-clinical";
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
  weight: ""
};

/** Best-effort parse of spoken vitals from Deepgram/simulated transcript. */
function parseVitalsFromTranscript(transcript: string): Partial<VitalsValues> {
  const text = transcript.toLowerCase();
  const out: Partial<VitalsValues> = {};

  const bp = text.match(/\b(?:bp|blood pressure)\s*(?:is|of|=|:)?\s*(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})\b/);
  if (bp) {
    out.bpSys = bp[1];
    out.bpDia = bp[2];
  }

  const hr = text.match(/\b(?:hr|heart rate|pulse)\s*(?:is|of|=|:)?\s*(\d{2,3})\b/);
  if (hr) out.hr = hr[1];

  const rr = text.match(/\b(?:rr|resp(?:iratory)? rate)\s*(?:is|of|=|:)?\s*(\d{1,2})\b/);
  if (rr) out.rr = rr[1];

  const spo2 = text.match(/\b(?:spo2|sats|oxygen)\s*(?:is|of|=|:)?\s*(\d{2,3})\s*%?/);
  if (spo2) out.spo2 = spo2[1];

  const temp = text.match(/\b(?:temp(?:erature)?)\s*(?:is|of|=|:)?\s*(\d{2}(?:\.\d)?)\b/);
  if (temp) out.temp = temp[1];

  const weight = text.match(/\b(?:weight)\s*(?:is|of|=|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:kg)?\b/);
  if (weight) out.weight = weight[1];

  return out;
}

export function VitalsForm() {
  const { selectedPatientId, addAuditEvent } = useDashboardStore();
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const { data: neo4jPatient, loading: neo4jLoading, source } = useNeo4jPatient(patient.id);
  const [entryMode, setEntryMode] = useState<"manual" | "voice">("manual");
  const [vitals, setVitals] = useState<VitalsValues>(EMPTY_VITALS);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [transcriptMode, setTranscriptMode] = useState<"live" | "simulated" | null>(null);

  const saveVitals = async () => {
    addAuditEvent({
      user: "Nurse Davies",
      agent: "Nurse",
      action: "Saved vital signs",
      resource: `${patient.name} | BP ${vitals.bpSys}/${vitals.bpDia}`
    });

    try {
      const response = await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          agentLabel: "Nurse",
          label: "SHIELD: nurse vitals saved (HITL pending record write)",
          detail: `BP ${vitals.bpSys}/${vitals.bpDia} HR ${vitals.hr} SpO2 ${vitals.spo2}`,
          resourceRef: `${patient.name} (${patient.id})`,
          category: "reviewer_decision"
        })
      });
      const durable = response.ok;
      toast({
        title: durable ? "Observations saved + audited" : "Observations saved locally",
        description: durable
          ? "Appended to durable SHIELD audit. Still no EHR write-back."
          : "Mock FHIR Observation created. Sign in with Postgres for durable audit."
      });
    } catch {
      toast({ title: "Observations saved", description: "Mock FHIR Observation created" });
    }
  };

  const handleTranscript = (transcript: string, meta?: { simulated?: boolean }) => {
    setLastTranscript(transcript);
    setTranscriptMode(meta?.simulated ? "simulated" : "live");
    const parsed = parseVitalsFromTranscript(transcript);
    const hasParsed = Object.keys(parsed).length > 0;

    if (hasParsed) {
      setVitals((prev) => ({ ...prev, ...parsed }));
      setEntryMode("manual");
      toast({
        title: "VOICE parsed vitals — please verify before save",
        description: meta?.simulated
          ? "Simulated transcript used. Confirm values before saving."
          : "Live Deepgram transcript used. Confirm values before saving."
      });
      return;
    }

    // Prefer Neo4j vitals as a verify-first starting point when speech parse fails.
    if (neo4jPatient?.vitals) {
      const [sys, dia] = (neo4jPatient.vitals.bloodPressure || "/").split("/");
      setVitals({
        bpSys: sys?.trim() || "",
        bpDia: dia?.trim() || "",
        hr: String(neo4jPatient.vitals.heartRate ?? ""),
        rr: String(neo4jPatient.vitals.respiratoryRate ?? ""),
        spo2: String(neo4jPatient.vitals.spo2 ?? ""),
        temp: String(neo4jPatient.vitals.temperature ?? ""),
        weight: ""
      });
      setEntryMode("manual");
      toast({
        title: "Transcript captured — graph vitals prefilled for verify",
        description: "Speech did not contain clear vitals; review graph/fallback values before save."
      });
      return;
    }

    setEntryMode("manual");
    toast({
      title: "Transcript captured — enter vitals manually",
      description: "Could not parse structured vitals from speech. Type values and verify before save."
    });
  };

  return (
    <Card className="border-secondary/20 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-secondary">Vital Signs Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Neo4jMockModeBanner source={source} loading={neo4jLoading} showLive />
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
          <div className="space-y-2">
            <VoiceRecorder
              onTranscript={(transcript, meta) => {
                handleTranscript(transcript, { simulated: meta?.simulated });
              }}
            />
            {lastTranscript ? (
              <p className="text-xs text-muted whitespace-pre-wrap rounded border border-dashed border-border p-2">
                Last transcript{transcriptMode ? ` (${transcriptMode})` : ""}: {lastTranscript}
              </p>
            ) : null}
          </div>
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
            <Input
              placeholder="Heart rate (bpm)"
              value={vitals.hr}
              onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
            />
            <Input
              placeholder="Resp rate (/min)"
              value={vitals.rr}
              onChange={(e) => setVitals({ ...vitals, rr: e.target.value })}
            />
            <Input
              placeholder="SpO2 (%)"
              value={vitals.spo2}
              onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
            />
            <Input
              placeholder="Temperature (°C)"
              value={vitals.temp}
              onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
            />
            <Input
              placeholder="Weight (kg)"
              value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
            />
          </div>
        )}
        <Button variant="accent" onClick={saveVitals}>
          Save Observations
        </Button>
        <p className="text-[11px] text-muted" data-testid="nurse-vitals-timeline-note">
          Vitals stay on the nurse observations spine (SHIELD audit · no EHR write). Consent-gated
          wearable/lifestyle ingest from patient or GP also appears on the{" "}
          <Link
            href={`/dashboard/gp/patients/${patient.id}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            patient timeline
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
