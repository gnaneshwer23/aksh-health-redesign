"use client";

import { useEffect, useState } from "react";

import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { useNeo4jGuardian } from "@/lib/hooks/use-neo4j-clinical";
import { checkInteractions, getPatientById, patients, searchDrugs } from "@/lib/mock-data";
import type { Neo4jGuardianInteraction } from "@/lib/neo4j/types";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

type Interaction = ReturnType<typeof checkInteractions>[number];

type InteractionItemState = {
  note: string;
  editing: boolean;
  edited: boolean;
  dismissed: boolean;
};

function interactionKey(ix: { drugA: string; drugB: string }) {
  return `${ix.drugA}|${ix.drugB}`;
}

function neo4jToMockShape(ix: Neo4jGuardianInteraction): Interaction {
  return {
    drugA: ix.drugA,
    drugB: ix.drugB,
    severity: ix.severity === "red" ? "High" : ix.severity === "amber" ? "Medium" : "Low",
    bnfSection: ix.bnfRef.replace(/^BNF\s+/i, "") || ix.bnfRef,
    recommendation: ix.recommendation
  };
}

const PHARMACIST_ACCENT = "text-accent";

export function InteractionChecker() {
  const { selectedPatientId, setSelectedPatient, stageGuardianInteraction } = useDashboardStore();
  const [drugQuery, setDrugQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState("");
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [itemStates, setItemStates] = useState<Record<string, InteractionItemState>>({});
  const [agentBrief, setAgentBrief] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState<string | null>(null);

  const checkPatient = getPatientById(selectedPatientId ?? "P002") ?? patients[1];
  const { data: neo4jGuardian, loading: neo4jLoading, source } = useNeo4jGuardian(checkPatient.id);
  const drugSuggestions = searchDrugs(drugQuery);

  useEffect(() => {
    setSelectedDrug("");
    setInteractions([]);
    setItemStates({});
    setAgentBrief(null);
    setAgentMode(null);
  }, [checkPatient.id]);

  const runCheck = async (drug: string) => {
    setChecking(true);
    setSelectedDrug(drug);
    setAgentBrief(null);
    setAgentMode(null);

    try {
      const response = await fetch("/api/agents/guardian", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: checkPatient.id,
          proposedDrug: drug
        })
      });

      if (response.ok) {
        const data = (await response.json()) as {
          draft?: {
            mode?: string;
            dataSource?: string;
            summary?: string;
            interactions?: Neo4jGuardianInteraction[];
          };
        };
        const draft = data.draft;
        if (draft) {
          const mapped = (draft.interactions ?? []).map(neo4jToMockShape);
          setInteractions(mapped);
          setItemStates(
            Object.fromEntries(
              mapped.map((ix) => [
                interactionKey(ix),
                { note: ix.recommendation, editing: false, edited: false, dismissed: false }
              ])
            )
          );
          setAgentBrief(draft.summary ?? null);
          setAgentMode(`${draft.mode ?? "unknown"} / ${draft.dataSource ?? source ?? "unknown"}`);
          toast({
            title: "GUARDIAN draft ready",
            description: "Review interactions, then Accept/Edit/Reject before staging."
          });
          return;
        }
      }
    } catch {
      // Fall through to local heuristic check.
    }

    const results = checkInteractions(drug, checkPatient.activeMedications);
    setInteractions(results);
    setItemStates(
      Object.fromEntries(
        results.map((ix) => [
          interactionKey(ix),
          { note: ix.recommendation, editing: false, edited: false, dismissed: false }
        ])
      )
    );
    setAgentMode("local-heuristic");
  };

  const updateItemState = (key: string, patch: Partial<InteractionItemState>) => {
    setItemStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const stageInteraction = async (ix: Interaction, note: string) => {
    const severity = ix.severity === "High" ? "🔴 HIGH" : ix.severity === "Medium" ? "🟡 MEDIUM" : "🟢 LOW";
    stageGuardianInteraction({
      patientId: checkPatient.id,
      patientName: checkPatient.name,
      patientNhsNumber: checkPatient.nhsNumber,
      title: `Interaction check: ${ix.drugA} + ${ix.drugB}`,
      content: `${severity}: ${ix.drugA} and ${ix.drugB}. ${note} (${ix.bnfSection})`
    });

    try {
      await fetch("/api/audit/shield", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "staged", subject: "interaction_alert", action: "accept", agent: "GUARDIAN", note: `${ix.drugA} + ${ix.drugB} (${ix.severity})`, resourceRef: `${checkPatient.name} (${checkPatient.id})` })
      });
    } catch {
      // Staging still applies locally.
    }

    toast({
      title: "Staged for GP review queue",
      description: "GUARDIAN alert staged · SHIELD audited when signed in · liveEmis:false"
    });
  };

  const liveInteractions = neo4jGuardian?.interactions ?? [];

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-3 ${PHARMACIST_ACCENT}`}>Interaction Checker</h2>
      <div
        id="pharmacist-hitl-stage"
        data-testid="pharmacist-hitl-stage"
        className="mb-3 scroll-mt-24 rounded-lg border border-accent/25 bg-accent/[0.05] px-3 py-2 text-xs text-muted-foreground"
      >
        <p className="font-medium text-foreground">HITL stage · GUARDIAN + SHIELD</p>
        <p className="mt-1">
          Run a drug check, then Accept / Edit / Reject. Accept stages a GUARDIAN alert for the GP
          review queue and best-effort SHIELD audit when signed in — liveEmis:false · no EHR write.
        </p>
      </div>
      <Card className="shadow-sm border-accent/10 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted">Patient:</span>
          <Select value={checkPatient.id} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patients
                .filter((p) => p.activeMedications.length > 0)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted">
            Graph status:{" "}
            {neo4jLoading
              ? "loading…"
              : source === "neo4j"
                ? `live (${liveInteractions.length} pairs)`
                : `fallback (${liveInteractions.length} pairs)`}
          </span>
        </div>

        {!neo4jLoading && liveInteractions.length > 0 && !selectedDrug ? (
          <div className="space-y-2 rounded-md border border-dashed border-accent/30 p-3">
            <p className="text-xs text-muted">
              Current-regimen interactions from {source === "neo4j" ? "Neo4j" : "local fallback"} — run a drug check to
              generate a GUARDIAN HITL draft.
            </p>
            {liveInteractions.slice(0, 3).map((ix) => (
              <GuardianAlert
                key={interactionKey(ix)}
                severity={ix.severity === "red" ? "high" : ix.severity === "amber" ? "medium" : "low"}
                title={`${ix.drugA} + ${ix.drugB}`}
                description={ix.recommendation}
                bnfRef={ix.bnfRef}
              />
            ))}
          </div>
        ) : null}

        <Input
          placeholder={`Type drug name to check against ${checkPatient.name} current meds`}
          value={drugQuery}
          onChange={(e) => setDrugQuery(e.target.value)}
          aria-label="Drug interaction search"
        />
        {drugSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {drugSuggestions.map((d) => (
              <Button
                key={d}
                size="sm"
                variant="outline"
                className="border-accent/30"
                disabled={checking}
                onClick={() => void runCheck(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        )}
        {checking && <p className="text-sm text-muted">Running GUARDIAN check…</p>}
        {agentBrief ? (
          <p className="text-sm rounded-md bg-muted/40 p-3">
            <span className="font-medium">GUARDIAN brief</span>
            {agentMode ? <span className="text-xs text-muted"> · {agentMode}</span> : null}
            <br />
            {agentBrief}
          </p>
        ) : null}
        {selectedDrug &&
          !checking &&
          interactions.map((ix) => {
            const key = interactionKey(ix);
            const state = itemStates[key];
            if (!state || state.dismissed) return null;

            return (
              <div key={key} className="space-y-2">
                <GuardianAlert
                  severity={ix.severity === "High" ? "high" : ix.severity === "Medium" ? "medium" : "low"}
                  title={`${ix.drugA} + ${ix.drugB}`}
                  description={state.note}
                  bnfRef={ix.bnfSection}
                />
                {state.editing ? (
                  <SOAPEditor
                    value={state.note}
                    onChange={(note) => updateItemState(key, { note })}
                    onSave={() => updateItemState(key, { editing: false, edited: true })}
                    onCancel={() =>
                      updateItemState(key, { editing: false, note: state.edited ? state.note : ix.recommendation })
                    }
                  />
                ) : (
                  <HitlActions
                    status={state.edited ? "Edited" : "Pending"}
                    onAccept={() => void stageInteraction(ix, state.note)}
                    onEdit={() => updateItemState(key, { editing: true })}
                    onReject={(reason) => {
                      updateItemState(key, { dismissed: true });
                      toast({ title: "Interaction dismissed", description: reason || "No reason provided" });
                    }}
                  />
                )}
              </div>
            );
          })}
        {selectedDrug && !checking && interactions.length === 0 && (
          <p className="text-sm text-accent">No significant interactions found</p>
        )}
      </Card>
    </section>
  );
}
