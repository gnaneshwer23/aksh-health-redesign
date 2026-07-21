"use client";

import Link from "next/link";
import { useState } from "react";

import { AgentBadge } from "@/components/dashboard/AgentBadge";
import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { RiskGauge } from "@/components/dashboard/RiskScoreBadge";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { VoiceRecorder } from "@/components/dashboard/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import type { Patient } from "@/lib/mock-data/types";
import type { Neo4jGuardianResponse, Neo4jPatientResponse } from "@/lib/neo4j/types";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

type AgentDraftState = {
  mode?: string;
  dataSource?: string;
  summary?: string;
  confidence?: number;
  codes?: Array<{ system: string; code: string; display: string; confidence: number }>;
  contributingFactors?: string[];
  interactions?: Array<{
    drugA: string;
    drugB: string;
    severity: "red" | "amber" | "green";
    recommendation: string;
    bnfRef: string;
  }>;
  overallStatus?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  queueItem?: { title?: string; summary?: string; content?: string };
  serviceRequest?: { codeText?: string; priority?: string };
};

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

async function postAgent(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Agent call failed (${response.status})`);
  }
  return response.json() as Promise<{ draft?: AgentDraftState }>;
}

async function shieldAccept(payload: {
  agentLabel: string;
  label: string;
  detail: string;
  resourceRef: string;
  extra?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/audit/shield", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "accept",
        agentLabel: payload.agentLabel,
        label: payload.label,
        detail: payload.detail.slice(0, 280),
        resourceRef: payload.resourceRef,
        category: "reviewer_decision",
        payload: payload.extra
      })
    });
  } catch {
    // Local staging still applies.
  }
}

export function AgentControlPanel({
  patient,
  oracleData,
  guardianData,
  oracleLoading,
  guardianLoading,
  className
}: {
  patient: Patient | null;
  oracleData?: Neo4jPatientResponse | null;
  guardianData?: Neo4jGuardianResponse | null;
  oracleLoading?: boolean;
  guardianLoading?: boolean;
  className?: string;
}) {
  const stageVoiceTranscript = useDashboardStore((state) => state.stageVoiceTranscript);
  const stageAgentDraft = useDashboardStore((state) => state.stageAgentDraft);
  const { profile } = useUserProfile();
  const reviewerName = profile?.fullName ?? "Clinician";

  const [lastDictationAt, setLastDictationAt] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  const [drAssistDraft, setDrAssistDraft] = useState<AgentDraftState | null>(null);
  const [drAssistNote, setDrAssistNote] = useState("");
  const [drAssistEditing, setDrAssistEditing] = useState(false);
  const [drAssistEdited, setDrAssistEdited] = useState(false);
  const [drAssistStaged, setDrAssistStaged] = useState(false);

  const [oracleDraft, setOracleDraft] = useState<AgentDraftState | null>(null);
  const [oracleNote, setOracleNote] = useState("");
  const [oracleEditing, setOracleEditing] = useState(false);
  const [oracleEdited, setOracleEdited] = useState(false);
  const [oracleStaged, setOracleStaged] = useState(false);

  const [guardianDraft, setGuardianDraft] = useState<AgentDraftState | null>(null);
  const [guardianStaged, setGuardianStaged] = useState(false);

  const [synthesisDraft, setSynthesisDraft] = useState<AgentDraftState | null>(null);
  const [synthesisNote, setSynthesisNote] = useState("");
  const [synthesisEditing, setSynthesisEditing] = useState(false);
  const [synthesisEdited, setSynthesisEdited] = useState(false);
  const [synthesisStaged, setSynthesisStaged] = useState(false);
  const [synthesisLevel, setSynthesisLevel] = useState<"Brief" | "Standard" | "Detailed">("Standard");

  const [referralDraft, setReferralDraft] = useState<AgentDraftState | null>(null);
  const [referralStaged, setReferralStaged] = useState(false);

  const oracleScore = oracleData?.oracleScore ?? patient?.oracleScore ?? 0;
  const oracleRisk = oracleData?.oracleRisk ?? patient?.oracleRisk ?? "Low";
  const riskFactors =
    oracleData?.riskFactors ?? patient?.digitalTwinPrediction.deteriorationSignals ?? [];

  function requirePatient(): Patient | null {
    if (!patient) {
      toast({
        title: "Select a patient",
        description: "Choose a patient before running clinical agents."
      });
      return null;
    }
    return patient;
  }

  function handleVoiceTranscript(transcript: string) {
    const current = requirePatient();
    if (!current) return;

    stageVoiceTranscript({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      transcript,
      reviewerName
    });
    setLastDictationAt(new Date().toLocaleString("en-GB"));
    toast({
      title: "Transcript staged for CANVAS",
      description: "VOICE feeds CANVAS intake · HITL review · no EHR write-back."
    });
  }

  async function runDrAssist() {
    const current = requirePatient();
    if (!current) return;
    setRunning("dr-assist");
    setDrAssistStaged(false);
    setDrAssistEdited(false);
    setDrAssistEditing(false);
    try {
      const data = await postAgent("/api/agents/dr-assist", { patientId: current.id });
      if (!data.draft) throw new Error("empty draft");
      setDrAssistDraft(data.draft);
      const codeLines =
        data.draft.codes?.map((c) => `${c.system} ${c.code}: ${c.display}`).join("\n") ??
        data.draft.summary ??
        "";
      setDrAssistNote(codeLines);
      toast({
        title: "Dr.Assist coding draft ready",
        description: "Coding sub-capability under HITL — not a 13th directory agent."
      });
    } catch {
      toast({ title: "Dr.Assist unavailable", description: "Could not generate coding suggestions." });
    } finally {
      setRunning(null);
    }
  }

  async function stageDrAssist() {
    const current = requirePatient();
    if (!current || !drAssistDraft) return;
    stageAgentDraft({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      agentType: "DrASSIST",
      title: "Diagnosis code suggestions",
      content: drAssistNote,
      confidenceScore:
        typeof drAssistDraft.confidence === "number"
          ? Math.round(drAssistDraft.confidence * 100)
          : null,
      reviewerName
    });
    await shieldAccept({
      agentLabel: "DrASSIST",
      label: "SHIELD: Dr.Assist coding draft staged for GP review",
      detail: drAssistNote,
      resourceRef: `${current.name} (${current.id})`,
      extra: { mode: drAssistDraft.mode, dataSource: drAssistDraft.dataSource, viaBridge: true }
    });
    setDrAssistStaged(true);
    toast({
      title: "Staged via BRIDGE",
      description: "Dr.Assist codes · SHIELD logged · liveEmis:false · no EHR write-back"
    });
  }

  async function runOracle() {
    const current = requirePatient();
    if (!current) return;
    setRunning("oracle");
    setOracleStaged(false);
    setOracleEdited(false);
    setOracleEditing(false);
    try {
      const data = await postAgent("/api/agents/oracle", { patientId: current.id });
      if (!data.draft) throw new Error("empty draft");
      setOracleDraft(data.draft);
      setOracleNote(data.draft.summary ?? "");
      toast({
        title: "HORIZON draft ready",
        description: "Review the risk brief, then Accept/Edit/Reject."
      });
    } catch {
      toast({ title: "HORIZON unavailable", description: "Could not generate a risk brief." });
    } finally {
      setRunning(null);
    }
  }

  async function stageOracle() {
    const current = requirePatient();
    if (!current || !oracleDraft) return;
    stageAgentDraft({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      agentType: "ORACLE",
      title: "HORIZON risk brief",
      content: oracleNote,
      confidenceScore:
        typeof oracleDraft.confidence === "number" ? Math.round(oracleDraft.confidence * 100) : null,
      priority: "High",
      reviewerName
    });
    await shieldAccept({
      agentLabel: "HORIZON",
      label: "SHIELD: HORIZON risk brief staged for GP review",
      detail: oracleNote,
      resourceRef: `${current.name} (${current.id})`,
      extra: { mode: oracleDraft.mode, dataSource: oracleDraft.dataSource, viaBridge: true }
    });
    setOracleStaged(true);
    toast({
      title: "Staged via BRIDGE",
      description: "HORIZON brief · SHIELD logged · liveEmis:false · no EHR write-back"
    });
  }

  async function runGuardian() {
    const current = requirePatient();
    if (!current) return;
    setRunning("guardian");
    setGuardianStaged(false);
    try {
      const data = await postAgent("/api/agents/guardian", { patientId: current.id });
      if (!data.draft) throw new Error("empty draft");
      setGuardianDraft(data.draft);
      toast({
        title: "GUARDIAN draft ready",
        description: "Review interactions, then Accept before staging."
      });
    } catch {
      toast({ title: "GUARDIAN unavailable", description: "Could not generate a safety brief." });
    } finally {
      setRunning(null);
    }
  }

  async function stageGuardian() {
    const current = requirePatient();
    if (!current || !guardianDraft) return;
    const content =
      guardianDraft.summary ??
      guardianDraft.interactions
        ?.map((ix) => `${ix.drugA} + ${ix.drugB}: ${ix.recommendation}`)
        .join("\n") ??
      "GUARDIAN safety brief";
    stageAgentDraft({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      agentType: "GUARDIAN",
      title: "GUARDIAN medicines safety brief",
      content,
      priority: "High",
      confidenceScore:
        typeof guardianDraft.confidence === "number"
          ? Math.round(guardianDraft.confidence * 100)
          : null,
      reviewerName
    });
    await shieldAccept({
      agentLabel: "GUARDIAN",
      label: "SHIELD: GUARDIAN brief staged for GP review",
      detail: content,
      resourceRef: `${current.name} (${current.id})`,
      extra: { mode: guardianDraft.mode, dataSource: guardianDraft.dataSource, viaBridge: true }
    });
    setGuardianStaged(true);
    toast({
      title: "Staged via BRIDGE",
      description: "GUARDIAN brief · SHIELD logged · liveEmis:false · no EHR write-back"
    });
  }

  async function runSynthesis() {
    const current = requirePatient();
    if (!current) return;
    setRunning("synthesis");
    setSynthesisStaged(false);
    setSynthesisEdited(false);
    setSynthesisEditing(false);
    const conditions = (oracleData?.conditions ?? current.activeConditions).join(", ") || "general review";
    const meds = (oracleData?.medications ?? current.activeMedications).slice(0, 4).join("; ");
    const detailHint =
      synthesisLevel === "Brief"
        ? "Keep the note concise."
        : synthesisLevel === "Detailed"
          ? "Include fuller assessment and safety-netting detail."
          : "Use a standard SOAP structure.";
    const transcript = `GP consultation for ${current.name}. Active conditions: ${conditions}. Current medicines: ${meds || "none listed"}. ${detailHint} Generate a ${synthesisLevel.toLowerCase()} SOAP draft for clinician review.`;
    try {
      const data = await postAgent("/api/agents/synthesis", {
        transcript,
        patientLabel: current.name
      });
      if (!data.draft) throw new Error("empty draft");
      setSynthesisDraft(data.draft);
      const soap = [
        `S: ${data.draft.subjective ?? ""}`,
        `O: ${data.draft.objective ?? ""}`,
        `A: ${data.draft.assessment ?? ""}`,
        `P: ${data.draft.plan ?? ""}`
      ].join("\n");
      setSynthesisNote(soap);
      toast({
        title: "SYNTHESIS draft ready",
        description: "Review the SOAP note, then Accept/Edit/Reject."
      });
    } catch {
      toast({ title: "SYNTHESIS unavailable", description: "Could not generate a SOAP draft." });
    } finally {
      setRunning(null);
    }
  }

  async function stageSynthesis() {
    const current = requirePatient();
    if (!current || !synthesisDraft) return;
    stageAgentDraft({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      agentType: "SYNTHESIS",
      title: `SOAP note draft (${synthesisLevel})`,
      content: synthesisNote,
      confidenceScore:
        typeof synthesisDraft.confidence === "number"
          ? Math.round(synthesisDraft.confidence * 100)
          : null,
      reviewerName
    });
    await shieldAccept({
      agentLabel: "SYNTHESIS",
      label: "SHIELD: SYNTHESIS SOAP draft staged for GP review",
      detail: synthesisNote,
      resourceRef: `${current.name} (${current.id})`,
      extra: { mode: synthesisDraft.mode, level: synthesisLevel, viaBridge: true }
    });
    setSynthesisStaged(true);
    toast({
      title: "Staged via BRIDGE",
      description: "SYNTHESIS note · SHIELD logged · liveEmis:false · no EHR write-back"
    });
  }

  async function runReferral() {
    const current = requirePatient();
    if (!current) return;
    setRunning("referral");
    setReferralStaged(false);
    const indication =
      (oracleData?.conditions ?? current.activeConditions).slice(0, 2).join("; ") ||
      "Clinical referral packaging for review";
    try {
      const data = await postAgent("/api/agents/referral", {
        patientId: current.id,
        patientLabel: current.name,
        indication,
        priority: oracleRisk === "High" || oracleRisk === "VeryHigh" ? "urgent" : "routine"
      });
      if (!data.draft) throw new Error("empty draft");
      setReferralDraft(data.draft);
      toast({
        title: "PATHWAY package ready",
        description: "Synthetic draft only — no e-Referral write-back."
      });
    } catch {
      toast({ title: "PATHWAY unavailable", description: "Could not generate a referral package." });
    } finally {
      setRunning(null);
    }
  }

  async function stageReferral() {
    const current = requirePatient();
    if (!current || !referralDraft) return;
    const content =
      referralDraft.queueItem?.content ??
      referralDraft.queueItem?.summary ??
      "Synthetic referral package";
    stageAgentDraft({
      patientId: current.id,
      patientName: current.name,
      patientNhsNumber: current.nhsNumber,
      agentType: "REFERRAL",
      title: referralDraft.queueItem?.title ?? "Referral package",
      content,
      priority: "High",
      confidenceScore:
        typeof referralDraft.confidence === "number"
          ? Math.round(referralDraft.confidence * 100)
          : null,
      reviewerName
    });
    await shieldAccept({
      agentLabel: "PATHWAY",
      label: "SHIELD: PATHWAY package staged for GP review",
      detail: content,
      resourceRef: `${current.name} (${current.id})`,
      extra: { mode: referralDraft.mode, eReferralWrite: false, viaBridge: true }
    });
    setReferralStaged(true);
    toast({
      title: "Staged via BRIDGE",
      description: "PATHWAY package · SHIELD logged · no e-Referral write · liveEmis:false"
    });
  }

  const liveGuardianInteractions =
    guardianDraft?.interactions ?? guardianData?.interactions ?? [];
  const conductorHref = patient
    ? `/dashboard/gp/patients/${patient.id}`
    : "/dashboard/gp/review-queue";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col gap-3 overflow-y-auto bg-card p-3 lg:w-72 lg:border-l lg:border-border",
        className
      )}
      data-testid="agent-control-panel"
    >
      <div className="space-y-1.5 px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
          Agent Control · 12-agent directory
        </p>
        <p className="text-[10px] text-muted">
          Drafts call live <code className="text-[9px]">/api/agents/*</code> · HITL required · SHIELD ·{" "}
          <span className="font-medium text-foreground">liveEmis:false</span>
        </p>
        <div
          className="flex flex-wrap gap-1"
          aria-label="Directory spine labels"
          data-testid="gp-agent-brand-strip"
        >
          <AgentBadge agent="CANVAS" />
          <AgentBadge agent="BRIDGE" />
          <AgentBadge agent="CONDUCTOR" />
        </div>
        <p className="text-[9px] text-muted">
          VOICE and Dr.Assist are intake/coding <span className="font-medium">sub-capabilities</span> — not
          peer 13th/14th agents.
        </p>
      </div>

      <Card className="shadow-sm" data-testid="gp-canvas-panel">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <AgentBadge agent="CANVAS" /> CANVAS
          </CardTitle>
          <p className="text-[10px] text-muted pt-1">
            Clinical Intake — structures patient history, conditions, and medications for review (synthetic /
            staged context).
          </p>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          {patient ? (
            <ul className="space-y-1 text-[11px]">
              {patient.activeConditions.slice(0, 3).map((c) => (
                <li key={c} className="border-b border-border pb-1">
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">Select a patient to load intake context.</p>
          )}

          <div className="rounded-sm border border-border-subtle bg-muted/20 p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide">VOICE · sub-capability</p>
              <span className="text-[9px] text-muted">feeds CANVAS</span>
            </div>
            <p className="text-[10px] text-muted">
              Dictation feeds CANVAS intake and stages a transcript for HITL — not a separate directory
              agent. Without <code className="text-[9px]">DEEPGRAM_API_KEY</code> the mic uses a labelled{" "}
              <strong>simulated ASR</strong> path.
            </p>
            <div className="flex flex-col items-center gap-2">
              <VoiceRecorder onTranscript={handleVoiceTranscript} />
              <p className="text-[10px] text-muted text-center">
                {lastDictationAt
                  ? `Last dictation: ${lastDictationAt}. Pending approval.`
                  : "Tap to dictate into CANVAS."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm" data-testid="gp-conductor-panel">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <AgentBadge agent="CONDUCTOR" /> CONDUCTOR
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <p className="text-[10px] text-muted">
            Supervisor — runs SYNTHESIS → GUARDIAN → HORIZON → NEXUS on the clinical spine. Drafts only · HITL
            mandatory · liveEmis:false.
          </p>
          <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" asChild>
            <Link href={conductorHref}>Open CONDUCTOR · Orchestrate</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AgentBadge agent="ORACLE" /> HORIZON
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px]"
              disabled={!patient || running === "oracle"}
              onClick={() => void runOracle()}
            >
              {running === "oracle" ? "…" : "Brief"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {!patient ? (
            <p className="text-xs text-muted">Select a patient</p>
          ) : oracleLoading && !oracleDraft ? (
            <PanelSkeleton />
          ) : (
            <>
              <RiskGauge score={oracleScore} risk={oracleRisk} />
              <ul className="space-y-1 text-[10px] text-muted">
                {riskFactors.slice(0, 3).map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
              {oracleDraft ? (
                <>
                  {oracleEditing ? (
                    <SOAPEditor
                      value={oracleNote}
                      onChange={setOracleNote}
                      onSave={() => {
                        setOracleEditing(false);
                        setOracleEdited(true);
                      }}
                      onCancel={() => {
                        setOracleEditing(false);
                        setOracleNote(oracleDraft.summary ?? "");
                      }}
                    />
                  ) : (
                    <p className="text-[10px] rounded-sm bg-muted/30 p-2">{oracleNote}</p>
                  )}
                  {oracleStaged ? (
                    <p className="text-[10px] text-accent">Staged via BRIDGE · SHIELD · no EHR write</p>
                  ) : !oracleEditing ? (
                    <HitlActions
                      status={oracleEdited ? "Edited" : "Pending"}
                      onAccept={() => void stageOracle()}
                      onEdit={() => setOracleEditing(true)}
                      onReject={(reason) => {
                        setOracleDraft(null);
                        toast({ title: "HORIZON dismissed", description: reason || "No reason provided" });
                      }}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AgentBadge agent="GUARDIAN" /> GUARDIAN
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px]"
              disabled={!patient || running === "guardian"}
              onClick={() => void runGuardian()}
            >
              {running === "guardian" ? "…" : "Check"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {!patient ? (
            <p className="text-xs text-muted">Select a patient</p>
          ) : guardianLoading && !guardianDraft ? (
            <PanelSkeleton />
          ) : liveGuardianInteractions.length > 0 ? (
            <>
              {liveGuardianInteractions.slice(0, 3).map((interaction) => (
                <GuardianAlert
                  key={`${interaction.drugA}-${interaction.drugB}`}
                  severity={guardianSeverity(interaction.severity)}
                  title={`${interaction.drugA} + ${interaction.drugB}`}
                  description={interaction.recommendation}
                  bnfRef={interaction.bnfRef}
                />
              ))}
              {guardianDraft?.summary ? (
                <p className="text-[10px] text-muted">{guardianDraft.summary}</p>
              ) : null}
              {guardianDraft && !guardianStaged ? (
                <HitlActions
                  status="Pending"
                  onAccept={() => void stageGuardian()}
                  onEdit={() =>
                    toast({
                      title: "Edit in pharmacist checker",
                      description: "Use /dashboard/pharmacist/interactions for detailed edit."
                    })
                  }
                  onReject={(reason) => {
                    setGuardianDraft(null);
                    toast({ title: "GUARDIAN dismissed", description: reason || "No reason provided" });
                  }}
                />
              ) : null}
              {guardianStaged ? (
                <p className="text-[10px] text-accent">Staged via BRIDGE · SHIELD · no EHR write</p>
              ) : null}
            </>
          ) : patient.flags.includes("GUARDIAN") ? (
            <GuardianAlert
              severity="high"
              title="Drug interaction flagged"
              description="Run GUARDIAN check for a live HITL draft."
              bnfRef="BNF"
            />
          ) : (
            <p className="text-xs text-muted">No active alerts — run Check for a fresh brief.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <AgentBadge agent="SYNTHESIS" /> SYNTHESIS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="flex rounded-sm border border-border p-0.5 text-[10px]">
            {(["Brief", "Standard", "Detailed"] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={cn(
                  "flex-1 rounded-sm py-1",
                  synthesisLevel === level ? "bg-primary text-white" : "text-muted"
                )}
                onClick={() => setSynthesisLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!patient || running === "synthesis"}
            onClick={() => void runSynthesis()}
          >
            {running === "synthesis" ? "Generating…" : "Generate SOAP draft"}
          </Button>
          {synthesisDraft ? (
            <>
              {synthesisEditing ? (
                <SOAPEditor
                  value={synthesisNote}
                  onChange={setSynthesisNote}
                  onSave={() => {
                    setSynthesisEditing(false);
                    setSynthesisEdited(true);
                  }}
                  onCancel={() => {
                    setSynthesisEditing(false);
                    setSynthesisNote(
                      [
                        `S: ${synthesisDraft.subjective ?? ""}`,
                        `O: ${synthesisDraft.objective ?? ""}`,
                        `A: ${synthesisDraft.assessment ?? ""}`,
                        `P: ${synthesisDraft.plan ?? ""}`
                      ].join("\n")
                    );
                  }}
                />
              ) : (
                <pre className="whitespace-pre-wrap rounded-sm bg-muted/30 p-2 text-[10px] leading-relaxed">
                  {synthesisNote}
                </pre>
              )}
              {synthesisStaged ? (
                <p className="text-[10px] text-accent">Staged via BRIDGE · SHIELD · no EHR write</p>
              ) : !synthesisEditing ? (
                <HitlActions
                  status={synthesisEdited ? "Edited" : "Pending"}
                  onAccept={() => void stageSynthesis()}
                  onEdit={() => setSynthesisEditing(true)}
                  onReject={(reason) => {
                    setSynthesisDraft(null);
                    toast({ title: "SYNTHESIS dismissed", description: reason || "No reason provided" });
                  }}
                />
              ) : null}
            </>
          ) : null}

          <div
            className="rounded-sm border border-dashed border-border-subtle p-2 space-y-2"
            data-testid="gp-drassist-subcapability"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide">Dr.Assist · coding support</p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px]"
                disabled={!patient || running === "dr-assist"}
                onClick={() => void runDrAssist()}
              >
                {running === "dr-assist" ? "…" : "Suggest codes"}
              </Button>
            </div>
            <p className="text-[10px] text-muted">
              Sub-capability under documentation/coding — SNOMED / ICD-10 drafts for HITL. Not a peer Phase-1
              directory agent.
            </p>
            {!patient ? (
              <p className="text-muted text-[10px]">Select a patient</p>
            ) : drAssistDraft ? (
              <>
                <p className="text-[10px] text-muted">
                  {drAssistDraft.mode}/{drAssistDraft.dataSource}
                  {typeof drAssistDraft.confidence === "number"
                    ? ` · conf ${drAssistDraft.confidence.toFixed(2)}`
                    : ""}
                </p>
                {drAssistEditing ? (
                  <SOAPEditor
                    value={drAssistNote}
                    onChange={setDrAssistNote}
                    onSave={() => {
                      setDrAssistEditing(false);
                      setDrAssistEdited(true);
                    }}
                    onCancel={() => {
                      setDrAssistEditing(false);
                      setDrAssistNote(
                        drAssistDraft.codes?.map((c) => `${c.system} ${c.code}: ${c.display}`).join("\n") ??
                          ""
                      );
                    }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap rounded-sm bg-muted/30 p-2 text-[10px] leading-relaxed">
                    {drAssistNote}
                  </pre>
                )}
                {drAssistStaged ? (
                  <p className="text-[10px] text-accent">Staged via BRIDGE · SHIELD · no EHR write</p>
                ) : !drAssistEditing ? (
                  <HitlActions
                    status={drAssistEdited ? "Edited" : "Pending"}
                    onAccept={() => void stageDrAssist()}
                    onEdit={() => setDrAssistEditing(true)}
                    onReject={(reason) => {
                      setDrAssistDraft(null);
                      toast({ title: "Dr.Assist dismissed", description: reason || "No reason provided" });
                    }}
                  />
                ) : null}
              </>
            ) : (
              <p className="text-[10px] text-muted">Run Suggest codes for SNOMED / ICD-10 drafts.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AgentBadge agent="REFERRAL" /> PATHWAY
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px]"
              disabled={!patient || running === "referral"}
              onClick={() => void runReferral()}
            >
              {running === "referral" ? "…" : "Package"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2 text-xs">
          {!patient ? (
            <p className="text-muted">Select a patient</p>
          ) : referralDraft ? (
            <>
              <p className="text-[10px] font-medium">
                {referralDraft.queueItem?.title ?? "Referral package"}
              </p>
              <p className="text-[10px] text-muted">
                {referralDraft.serviceRequest?.codeText ?? referralDraft.queueItem?.summary}
                {referralDraft.serviceRequest?.priority
                  ? ` · ${referralDraft.serviceRequest.priority}`
                  : ""}
              </p>
              <p className="text-[10px] text-warning">Synthetic packaging only — no e-Referral write.</p>
              {referralStaged ? (
                <p className="text-[10px] text-accent">Staged via BRIDGE · SHIELD · no e-Referral write</p>
              ) : (
                <HitlActions
                  status="Pending"
                  onAccept={() => void stageReferral()}
                  onEdit={() =>
                    toast({
                      title: "Edit after staging",
                      description: "Accept stages a draft you can edit in the review queue."
                    })
                  }
                  onReject={(reason) => {
                    setReferralDraft(null);
                    toast({ title: "PATHWAY dismissed", description: reason || "No reason provided" });
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-[10px] text-muted">
              Package a synthetic ServiceRequest draft for HITL review.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm" data-testid="gp-bridge-panel">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <AgentBadge agent="BRIDGE" /> BRIDGE
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          <p className="text-[10px] text-muted">
            Interoperability — after Accept, drafts stage as FHIR R4 for review. Medplum rehearsal when
            configured; otherwise local staging / sim.
          </p>
          <p className="text-[10px] font-medium text-foreground">
            liveEmis:false · no live EMIS / SystmOne write-back in this build
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}
