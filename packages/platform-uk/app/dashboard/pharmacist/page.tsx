"use client";

import { useState } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GuardianAlert } from "@/components/dashboard/GuardianAlert";
import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { bnfEntries, checkInteractions, getPatientById, patients, searchDrugs } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function PharmacistDashboardPage() {
  const {
    medicationReviewsCompleted,
    markMedicationReviewed,
    selectedPatientId,
    setSelectedPatient,
    stageGuardianInteraction,
    reviewQueueItems,
  } = useDashboardStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drugQuery, setDrugQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState("");
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState<ReturnType<typeof checkInteractions>>([]);
  const [bnfSearch, setBnfSearch] = useState("");
  const [recentBnf, setRecentBnf] = useState<string[]>(["Apixaban", "Metformin", "Furosemide", "Amlodipine", "Sertraline"]);

  const checkPatient = getPatientById(selectedPatientId ?? "P002") ?? patients[1];
  const medQueue = patients.filter((p) => p.activeMedications.length >= 2);
  const drugSuggestions = searchDrugs(drugQuery);

  const runCheck = (drug: string) => {
    setChecking(true);
    setSelectedDrug(drug);
    setTimeout(() => {
      setInteractions(checkInteractions(drug, checkPatient.activeMedications));
      setChecking(false);
    }, 500);
  };

  const stageInteraction = (ix: (typeof interactions)[number]) => {
    const severity = ix.severity === "High" ? "🔴 HIGH" : ix.severity === "Medium" ? "🟡 MEDIUM" : "🟢 LOW";
    stageGuardianInteraction({
      patientId: checkPatient.id,
      patientName: checkPatient.name,
      patientNhsNumber: checkPatient.nhsNumber,
      title: `Interaction check: ${ix.drugA} + ${ix.drugB}`,
      content: `${severity}: ${ix.drugA} and ${ix.drugB}. ${ix.recommendation} (${ix.bnfSection})`,
    });
    toast({ title: "Staged for GP review queue", description: "GUARDIAN alert added — pending Accept" });
  };

  return (
    <DashboardShell role="pharmacist" title="Pharmacist Dashboard">
      <div className="overflow-y-auto p-4 space-y-8">
        <ConsentBanner />

        <section>
          <h2 className="text-lg font-semibold mb-3">
            Medication Review Queue <Badge>{medQueue.length}</Badge>
          </h2>
          <div className="space-y-2">
            {medQueue.map((p) => (
              <Card key={p.id} className="shadow-sm">
                <CardHeader className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">{p.name}</CardTitle>
                    <Badge variant="outline">{p.activeMedications.length} meds</Badge>
                  </div>
                  <p className="text-xs text-muted">Last review: {p.lastEncounterDate}</p>
                </CardHeader>
                {expanded === p.id && (
                  <CardContent className="p-4 pt-0 space-y-2">
                    <ul className="text-xs">{p.activeMedications.map((m) => <li key={m}>{m}</li>)}</ul>
                    {reviewQueueItems.filter((r) => r.patientId === p.id && r.agentType === "GUARDIAN").map((r) => (
                      <ReviewQueueItem key={r.id} item={r} />
                    ))}
                    <Button size="sm" variant="accent" disabled={medicationReviewsCompleted.includes(p.id)} onClick={() => markMedicationReviewed(p.id)}>
                      {medicationReviewsCompleted.includes(p.id) ? "Reviewed ✓" : "Mark Reviewed"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Interaction Checker</h2>
          <Card className="shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted">Patient:</span>
              <Select value={checkPatient.id} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {patients.filter((p) => p.activeMedications.length > 0).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                  <Button key={d} size="sm" variant="outline" onClick={() => runCheck(d)}>{d}</Button>
                ))}
              </div>
            )}
            {checking && <p className="text-sm text-muted">Checking interactions...</p>}
            {selectedDrug && !checking && interactions.map((ix, i) => (
              <div key={i} className="space-y-2">
                <GuardianAlert
                  severity={ix.severity === "High" ? "high" : ix.severity === "Medium" ? "medium" : "low"}
                  title={`${ix.drugA} + ${ix.drugB}`}
                  description={ix.recommendation}
                  bnfRef={ix.bnfSection}
                />
                <HitlActions
                  status="Pending"
                  onAccept={() => stageInteraction(ix)}
                  onEdit={() => toast({ title: "Edit interaction note", description: "Use GP review queue to edit staged item" })}
                  onReject={(reason) => toast({ title: "Interaction dismissed", description: reason })}
                />
              </div>
            ))}
            {selectedDrug && !checking && interactions.length === 0 && (
              <p className="text-sm text-accent">No significant interactions found</p>
            )}
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">BNF Search</h3>
            <Input placeholder="Search BNF..." value={bnfSearch} onChange={(e) => setBnfSearch(e.target.value)} />
            <div className="mt-3 space-y-2">
              {bnfEntries.filter((b) => !bnfSearch || b.name.toLowerCase().includes(bnfSearch.toLowerCase())).map((b) => (
                <div key={b.name} className="text-xs border-b border-border py-2 cursor-pointer hover:bg-background" onClick={() => setRecentBnf((r) => [b.name, ...r.filter((x) => x !== b.name)].slice(0, 5))}>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-muted">{b.section}</p>
                  <p>{b.dosing}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">Recently Viewed</h3>
            <ul className="text-sm space-y-1">{recentBnf.map((r) => <li key={r}>{r}</li>)}</ul>
          </Card>
        </section>
      </div>
    </DashboardShell>
  );
}
