"use client";

import { useState } from "react";

import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { HitlActions, SOAPEditor } from "@/components/dashboard/SOAPEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { checkInteractions, getPatientById, patients, searchDrugs } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

type Interaction = ReturnType<typeof checkInteractions>[number];

type InteractionItemState = {
  note: string;
  editing: boolean;
  edited: boolean;
  dismissed: boolean;
};

function interactionKey(ix: Interaction) {
  return `${ix.drugA}|${ix.drugB}`;
}

const PHARMACIST_ACCENT = "text-[#6B46C1]";

export function InteractionChecker() {
  const { selectedPatientId, setSelectedPatient, stageGuardianInteraction } = useDashboardStore();
  const [drugQuery, setDrugQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState("");
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [itemStates, setItemStates] = useState<Record<string, InteractionItemState>>({});

  const checkPatient = getPatientById(selectedPatientId ?? "P002") ?? patients[1];
  const drugSuggestions = searchDrugs(drugQuery);

  const runCheck = (drug: string) => {
    setChecking(true);
    setSelectedDrug(drug);
    setTimeout(() => {
      const results = checkInteractions(drug, checkPatient.activeMedications);
      setInteractions(results);
      setItemStates(
        Object.fromEntries(
          results.map((ix) => [
            interactionKey(ix),
            { note: ix.recommendation, editing: false, edited: false, dismissed: false },
          ])
        )
      );
      setChecking(false);
    }, 500);
  };

  const updateItemState = (key: string, patch: Partial<InteractionItemState>) => {
    setItemStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const stageInteraction = (ix: Interaction, note: string) => {
    const severity = ix.severity === "High" ? "🔴 HIGH" : ix.severity === "Medium" ? "🟡 MEDIUM" : "🟢 LOW";
    stageGuardianInteraction({
      patientId: checkPatient.id,
      patientName: checkPatient.name,
      patientNhsNumber: checkPatient.nhsNumber,
      title: `Interaction check: ${ix.drugA} + ${ix.drugB}`,
      content: `${severity}: ${ix.drugA} and ${ix.drugB}. ${note} (${ix.bnfSection})`,
    });
    toast({ title: "Staged for GP review queue", description: "GUARDIAN alert added — pending Accept" });
  };

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-3 ${PHARMACIST_ACCENT}`}>Interaction Checker</h2>
      <Card className="shadow-sm border-[#6B46C1]/10 p-4 space-y-3">
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
        </div>
        <Input
          placeholder={`Type drug name to check against ${checkPatient.name} current meds`}
          value={drugQuery}
          onChange={(e) => setDrugQuery(e.target.value)}
          aria-label="Drug interaction search"
        />
        {drugSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {drugSuggestions.map((d) => (
              <Button key={d} size="sm" variant="outline" className="border-[#6B46C1]/30" onClick={() => runCheck(d)}>
                {d}
              </Button>
            ))}
          </div>
        )}
        {checking && <p className="text-sm text-muted">Checking interactions...</p>}
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
                    onAccept={() => stageInteraction(ix, state.note)}
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
          <p className="text-sm text-[#6B46C1]">No significant interactions found</p>
        )}
      </Card>
    </section>
  );
}
