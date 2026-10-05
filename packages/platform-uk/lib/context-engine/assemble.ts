import { getDiabetesFixtureBundle } from "@/lib/disease-modules/diabetes/fixtures";
import { getPatientById } from "@/lib/mock-data/patients";
import { loadPatientChatContext } from "@/lib/chat/patient-context";
import { getPatientStateSnapshot } from "@/lib/patient-state/repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

import { DIABETES_GUIDELINE_FIXTURES } from "@/lib/graphrag/fixtures";
import { getLongitudinalBundle } from "@/lib/mock-data/longitudinal-bundles";

import { authorizeContextAssembly, stableContextHash } from "./policy";
import {
  CONTEXT_ENGINE_VERSION,
  type ClinicalContextPackage,
  type ContextAssemblyInput,
  type ContextEvidenceItem,
} from "./types";

function factString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.valuePercent === "number") return `${rec.valuePercent}%`;
    if (typeof rec.value === "string" || typeof rec.value === "number") return String(rec.value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function assembleClinicalContext(
  input: ContextAssemblyInput
): Promise<{ ok: true; package: ClinicalContextPackage } | { ok: false; status: number; reason: string }> {
  const auth = authorizeContextAssembly(input);
  if (!auth.allowed) {
    return { ok: false, status: auth.status, reason: auth.reason };
  }

  const patient = getPatientById(input.patientId);
  if (!patient) {
    return { ok: false, status: 404, reason: `Unknown patient ${input.patientId}` };
  }

  const [snapshot, chart] = await Promise.all([
    getPatientStateSnapshot(input.patientId),
    loadPatientChatContext(input.patientId),
  ]);

  const diabetes = getDiabetesFixtureBundle(input.patientId);
  const longitudinal = getLongitudinalBundle(input.patientId);
  const conditions = chart?.conditions?.length ? chart.conditions : patient.activeConditions;
  const medications = chart?.medications?.length
    ? chart.medications
    : longitudinal?.medications.map((m) =>
        m.status === "proposed" ? `${m.name} (proposed)` : m.name
      ) ?? patient.activeMedications;
  const allergies = chart?.allergies?.length
    ? chart.allergies
    : longitudinal?.allergies ?? patient.allergies;

  const observations: ClinicalContextPackage["observations"] = [];
  if (patient.vitals) {
    observations.push(
      { name: "bloodPressure", value: patient.vitals.bloodPressure, recordedAt: patient.vitals.recordedAt },
      { name: "heartRate", value: `${patient.vitals.heartRate}`, recordedAt: patient.vitals.recordedAt }
    );
  }

  const laboratory_results: ClinicalContextPackage["laboratory_results"] = [];
  const hba1cFacts = chart?.diabetes.hba1c ?? [];
  const longHba1c = longitudinal?.labs.filter((l) => l.name === "HbA1c") ?? [];

  if (hba1cFacts.length > 0) {
    for (const row of hba1cFacts) {
      laboratory_results.push({
        name: "HbA1c",
        value: `${row.valuePercent}%`,
        recordedAt: row.recordedAt,
      });
    }
  } else if (longHba1c.length > 0) {
    for (const lab of longHba1c) {
      laboratory_results.push({
        name: "HbA1c",
        value: `${lab.value}%`,
        recordedAt: lab.recordedAt,
      });
    }
  } else {
    const snapshotHba1c = snapshot.current.hba1c;
    if (snapshotHba1c) {
      const v = factString(snapshotHba1c.value);
      if (v) laboratory_results.push({ name: "HbA1c", value: v, recordedAt: snapshotHba1c.effectiveAt });
    } else if (diabetes.hba1cReadings[0]) {
      for (const row of diabetes.hba1cReadings) {
        laboratory_results.push({
          name: "HbA1c",
          value: `${row.valuePercent}%`,
          recordedAt: row.recordedAt,
        });
      }
    }
  }

  for (const lab of longitudinal?.labs ?? []) {
    if (lab.name === "HbA1c") continue;
    laboratory_results.push({
      name: lab.name,
      value: lab.unit ? `${lab.value} ${lab.unit}` : lab.value,
      recordedAt: lab.recordedAt,
    });
  }

  const snapshotHba1c = snapshot.current.hba1c;

  const missing_information: string[] = [];
  if (!snapshot.current.adherence && !snapshot.current.medication_adherence) {
    missing_information.push("ADHERENCE");
  }
  if (!snapshot.current.egfr && !snapshot.current.eGFR) {
    const hasEgfrLab = laboratory_results.some((r) => /egfr/i.test(r.name));
    if (!hasEgfrLab) missing_information.push("EGFR");
  }
  for (const m of longitudinal?.missingInformation ?? []) {
    if (m === "EGFR" && laboratory_results.some((r) => /egfr/i.test(r.name))) continue;
    if (!missing_information.includes(m)) missing_information.push(m);
  }

  const uncertainties: string[] = [];
  if (patient.digitalTwinPrediction.deteriorationSignals.some((s) => /hba1c/i.test(s))) {
    uncertainties.push("HbA1c review may be overdue — treat as deteriorating until confirmed lab.");
  }
  if (
    medications.some((m) => /aspirin/i.test(m)) &&
    medications.some((m) => /apixaban/i.test(m))
  ) {
    uncertainties.push("Aspirin + anticoagulant combination recorded — conflict remains visible, not merged.");
  }
  for (const u of longitudinal?.uncertainties ?? []) {
    if (!uncertainties.includes(u)) uncertainties.push(u);
  }

  const guidelines: ContextEvidenceItem[] =
    input.purpose === "patient_self"
      ? []
      : DIABETES_GUIDELINE_FIXTURES.filter((g) =>
          conditions.some((c) => c.toLowerCase().includes("diabetes") || c.toLowerCase().includes("t2"))
        ).map((g) => ({
          id: g.id,
          title: g.title,
          kind: "guideline" as const,
          citation: g.citation,
          provenance: g.provenance,
        }));

  const provenance: ClinicalContextPackage["provenance"] = [
    { field: "conditions", source: chart?.dataSource === "neo4j" ? "neo4j" : "mock_cohort", timestamp: patient.lastEncounterDate },
    { field: "medications", source: chart?.dataSource === "neo4j" ? "neo4j" : "mock_cohort", timestamp: patient.lastEncounterDate },
    {
      field: "laboratory_results",
      source: snapshotHba1c ? snapshotHba1c.source.system : "diabetes_fixture",
      timestamp: laboratory_results[0]?.recordedAt ?? new Date().toISOString(),
      reference: snapshotHba1c?.source.reference,
    },
  ];

  const dataSource: ClinicalContextPackage["dataSource"] =
    chart?.dataSource === "neo4j" && snapshot.factCount > 0
      ? "hybrid"
      : chart?.dataSource === "neo4j"
        ? "neo4j"
        : snapshot.factCount > 0
          ? "patient_state"
          : "mock";

  const assembledAt = new Date().toISOString();
  const unsigned = {
    schemaVersion: CONTEXT_ENGINE_VERSION,
    purpose: input.purpose,
    liveEmis: false as const,
    patient_context: {
      patientId: patient.id,
      label: patient.name,
      age: patient.age,
      gender: patient.gender,
      organisation: patient.organisation,
    },
    encounter_context: {
      lastEncounterDate: patient.lastEncounterDate,
      nextAppointmentDate: patient.nextAppointmentDate ?? null,
    },
    clinical_history: { conditions, flags: patient.flags },
    conditions,
    medications,
    allergies,
    observations,
    laboratory_results,
    procedures: [] as string[],
    relevant_guidelines: guidelines,
    evidence: guidelines,
    risk_factors: patient.digitalTwinPrediction.deteriorationSignals,
    missing_information,
    uncertainties,
    provenance,
    dataSource,
  };

  const pkg: ClinicalContextPackage = {
    ...unsigned,
    contextId: `ctx_${stableContextHash({ patientId: patient.id, purpose: input.purpose, facts: unsigned.laboratory_results, missing_information })}`,
    assembledAt,
  };

  void persistShieldAuditEvent({
    action: "defer",
    actor: "context-engine",
    label: "SHIELD: context package assembled",
    detail: `${pkg.patient_context.patientId} purpose=${pkg.purpose} missing=${missing_information.join(",") || "none"}`,
    category: "system",
    agentLabel: "CONDUCTOR",
    resourceRef: pkg.contextId,
    payload: {
      context_version: CONTEXT_ENGINE_VERSION,
      purpose: pkg.purpose,
      liveEmis: false,
      missing_information,
    },
  });

  return { ok: true, package: pkg };
}
