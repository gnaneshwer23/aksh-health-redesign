"use client";

import { useEffect, useState } from "react";

import { Neo4jMockModeBanner } from "@/components/dashboard/Neo4jMockModeBanner";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { useNeo4jPatient } from "@/lib/hooks/use-neo4j-clinical";
import type { OracleRisk } from "@/lib/mock-data/types";
import type { OracleModelCard } from "@/lib/precision-health/oracle-model-card";

type OracleDraftView = {
  mode?: string;
  dataSource?: string;
  oracleScore?: number;
  oracleRisk?: OracleRisk;
  summary?: string;
  contributingFactors?: string[];
  clinicianActions?: string[];
  confidence?: number;
};

export function OracleRiskPanel({
  patientId,
  patientName,
  fallbackScore,
  fallbackRisk
}: {
  patientId: string;
  patientName: string;
  fallbackScore: number;
  fallbackRisk: OracleRisk;
}) {
  const { data: neo4jPatient, loading, source } = useNeo4jPatient(patientId);
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState<OracleDraftView | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const [staged, setStaged] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [modelCard, setModelCard] = useState<OracleModelCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/agents/oracle", { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as { modelCard?: OracleModelCard };
        if (!cancelled && data.modelCard) setModelCard(data.modelCard);
      } catch {
        // Model card is informational only.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const score = neo4jPatient?.oracleScore ?? fallbackScore;
  const risk = neo4jPatient?.oracleRisk ?? fallbackRisk;

  const runOracle = async () => {
    setRunning(true);
    setDraft(null);
    setStaged(false);
    setDismissed(false);
    setEdited(false);
    setEditing(false);

    try {
      const response = await fetch("/api/agents/oracle", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId })
      });

      if (!response.ok) {
        toast({ title: "ORACLE unavailable", description: "Could not generate a risk brief." });
        return;
      }

      const data = (await response.json()) as { draft?: OracleDraftView };
      if (!data.draft) {
        toast({ title: "ORACLE unavailable", description: "Empty draft returned." });
        return;
      }

      setDraft(data.draft);
      setNote(data.draft.summary ?? "");
      toast({
        title: "ORACLE draft ready",
        description: "Review the risk brief, then Accept/Edit/Reject before staging."
      });
    } catch {
      toast({ title: "ORACLE unavailable", description: "Network error generating risk brief." });
    } finally {
      setRunning(false);
    }
  };

  const stageOracle = async () => {
    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          agentLabel: "ORACLE",
          label: "SHIELD: ORACLE risk brief staged for GP review",
          detail: note.slice(0, 280),
          resourceRef: `${patientName} (${patientId})`,
          category: "reviewer_decision",
          payload: {
            oracleScore: draft?.oracleScore ?? score,
            oracleRisk: draft?.oracleRisk ?? risk,
            mode: draft?.mode,
            dataSource: draft?.dataSource ?? source
          }
        })
      });
    } catch {
      // Local staging still applies.
    }

    setStaged(true);
    toast({
      title: "Staged for GP review",
      description: "ORACLE brief logged to SHIELD · no EHR write-back"
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">ORACLE risk brief</h2>
        <Button size="sm" variant="outline" disabled={running} onClick={() => void runOracle()}>
          {running ? "Generating…" : "Generate ORACLE brief"}
        </Button>
      </div>
      {modelCard && (
        <p className="text-[10px] text-muted" data-testid="oracle-risk-model-card">
          Model {modelCard.modelId}@{modelCard.version} · owner: {modelCard.clinicalOwner} ·
          autoRetrain: false · physiologicalTwin: false · see {modelCard.governedReleaseSop}
        </p>
      )}
      <Neo4jMockModeBanner source={source} loading={loading} showLive />
      <Card className="shadow-sm border-border-subtle">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm">Current score</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Graph:{" "}
              {loading
                ? "loading…"
                : source === "neo4j"
                  ? "live Neo4j"
                  : source === "mock"
                    ? "local fallback"
                    : "unavailable"}
            </p>
          </div>
          <RiskScoreBadge score={score} risk={risk} size="lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {draft && !dismissed ? (
            <>
              <p className="text-sm rounded-md bg-muted/40 p-3">
                <span className="font-medium">ORACLE brief</span>
                <span className="text-xs text-muted">
                  {" "}
                  · {draft.mode ?? "unknown"} / {draft.dataSource ?? source ?? "unknown"}
                  {typeof draft.confidence === "number" ? ` · conf ${draft.confidence.toFixed(2)}` : ""}
                </span>
                <br />
                {editing ? null : note}
              </p>
              {(draft.contributingFactors?.length ?? 0) > 0 ? (
                <ul className="text-xs text-muted space-y-1">
                  {draft.contributingFactors!.map((factor) => (
                    <li key={factor}>• {factor}</li>
                  ))}
                </ul>
              ) : null}
              {editing ? (
                <SOAPEditor
                  value={note}
                  onChange={setNote}
                  onSave={() => {
                    setEditing(false);
                    setEdited(true);
                  }}
                  onCancel={() => {
                    setEditing(false);
                    setNote(draft.summary ?? "");
                  }}
                />
              ) : staged ? (
                <p className="text-xs text-accent">Staged to SHIELD audit · pending GP queue Accept · no EHR write</p>
              ) : (
                <HitlActions
                  status={edited ? "Edited" : "Pending"}
                  onAccept={() => void stageOracle()}
                  onEdit={() => setEditing(true)}
                  onReject={(reason) => {
                    setDismissed(true);
                    toast({ title: "ORACLE brief dismissed", description: reason || "No reason provided" });
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              Generate an ORACLE HITL draft from Neo4j/mock risk context. Drafts never write to the EHR.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
