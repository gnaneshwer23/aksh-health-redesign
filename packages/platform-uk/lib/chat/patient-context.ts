import { getDiabetesFixtureBundle } from "@/lib/disease-modules/diabetes/fixtures";
import { getPatientById, reviewQueueItems } from "@/lib/mock-data";
import { isNeo4jConfigured } from "@/lib/neo4j";
import { getMockGuardianResponse, getMockPatientResponse } from "@/lib/neo4j/mock-fallback";
import { fetchGuardianFromGraph, fetchPatientFromGraph } from "@/lib/neo4j/queries";

export type PatientChatChartContext = {
  patientId: string;
  patientLabel: string;
  dataSource: "neo4j" | "mock";
  liveEmis: false;
  conditions: string[];
  medications: string[];
  allergies: string[];
  vitalsSummary: string | null;
  riskBand: string | null;
  riskScore: number | null;
  riskFactors: string[];
  guardianInteractions: Array<{
    drugA: string;
    drugB: string;
    severity: string;
    recommendation: string;
  }>;
  diabetes: {
    hba1c: Array<{ recordedAt: string; valueMmolMol: number }>;
    glucose: Array<{ recordedAt: string; glucoseMgDl: number; context?: string }>;
    insulinNotes: string | null;
  };
  openQueue: Array<{
    id: string;
    agentType: string;
    title: string;
    priority: string;
    status: string;
  }>;
  lastNotes: string[];
};

function truncate(text: string, max = 280): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Bounded chart context for Ask Aksh — meds, conditions, vitals, diabetes readings,
 * open review-queue items, and last note snippets. Prefer Neo4j when configured;
 * otherwise mock cohort. Always honesty-tagged liveEmis:false.
 */
export async function loadPatientChatContext(
  patientId: string
): Promise<PatientChatChartContext | null> {
  const id = patientId.trim();
  if (!id) return null;

  let dataSource: "neo4j" | "mock" = "mock";
  let name = id;
  let conditions: string[] = [];
  let medications: string[] = [];
  let riskBand: string | null = null;
  let riskScore: number | null = null;
  let riskFactors: string[] = [];
  let vitalsSummary: string | null = null;
  let allergies: string[] = [];

  const mockPatient = getPatientById(id);
  const mockNeo = getMockPatientResponse(id);

  if (isNeo4jConfigured()) {
    try {
      const graph = await fetchPatientFromGraph(id);
      if (graph) {
        dataSource = "neo4j";
        name = graph.name || id;
        conditions = graph.conditions ?? [];
        medications = graph.medications ?? [];
        riskBand = graph.oracleRisk ?? null;
        riskScore = graph.oracleScore ?? null;
        riskFactors = graph.riskFactors ?? [];
        if (graph.vitals) {
          vitalsSummary = `BP ${graph.vitals.bloodPressure}; HR ${graph.vitals.heartRate}; SpO₂ ${graph.vitals.spo2}%; RR ${graph.vitals.respiratoryRate}; Temp ${graph.vitals.temperature}°C (recorded ${graph.vitals.recordedAt})`;
        }
      }
    } catch {
      // Fall through to mock.
    }
  }

  if (dataSource === "mock") {
    if (!mockNeo && !mockPatient) return null;
    name = mockNeo?.name ?? mockPatient?.name ?? id;
    conditions = mockNeo?.conditions ?? mockPatient?.activeConditions ?? [];
    medications = mockNeo?.medications ?? mockPatient?.activeMedications ?? [];
    riskBand = mockNeo?.oracleRisk ?? mockPatient?.oracleRisk ?? null;
    riskScore = mockNeo?.oracleScore ?? mockPatient?.oracleScore ?? null;
    riskFactors =
      mockNeo?.riskFactors ?? mockPatient?.digitalTwinPrediction.deteriorationSignals ?? [];
    allergies = mockPatient?.allergies ?? [];
    const vitals = mockNeo?.vitals ?? mockPatient?.vitals ?? null;
    if (vitals) {
      vitalsSummary = `BP ${vitals.bloodPressure}; HR ${vitals.heartRate}; SpO₂ ${vitals.spo2}%; RR ${vitals.respiratoryRate}; Temp ${vitals.temperature}°C (recorded ${vitals.recordedAt})`;
    }
  } else if (mockPatient) {
    allergies = mockPatient.allergies ?? [];
  }

  let guardianInteractions: PatientChatChartContext["guardianInteractions"] = [];
  if (isNeo4jConfigured()) {
    try {
      const guardian = await fetchGuardianFromGraph(id);
      if (guardian) {
        guardianInteractions = guardian.interactions.map((i) => ({
          drugA: i.drugA,
          drugB: i.drugB,
          severity: i.severity,
          recommendation: i.recommendation,
        }));
      }
    } catch {
      // Fall through to mock guardian.
    }
  }
  if (guardianInteractions.length === 0) {
    const mockGuardian = getMockGuardianResponse(id);
    guardianInteractions =
      mockGuardian?.interactions.map((i) => ({
        drugA: i.drugA,
        drugB: i.drugB,
        severity: i.severity,
        recommendation: i.recommendation,
      })) ?? [];
  }

  const diabetesBundle = getDiabetesFixtureBundle(id);
  const openQueue = reviewQueueItems
    .filter((item) => item.patientId === id && (item.status === "Pending" || item.status === "Edited"))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      agentType: item.agentType,
      title: item.title,
      priority: item.priority,
      status: item.status,
    }));

  const lastNotes = reviewQueueItems
    .filter((item) => item.patientId === id)
    .slice(0, 3)
    .map((item) => truncate(`${item.agentType}: ${item.title} — ${item.content}`));

  const insulinNotes =
    diabetesBundle.insulinRegimen != null
      ? `Insulin: ${diabetesBundle.insulinRegimen.medications.join("; ")}; reported hypo events: ${diabetesBundle.insulinRegimen.reportedHypoEventCount}`
      : diabetesBundle.glp1SideEffects.length > 0
        ? `GLP-1 side effects: ${diabetesBundle.glp1SideEffects.join("; ")}`
        : null;

  return {
    patientId: id,
    patientLabel: name,
    dataSource,
    liveEmis: false,
    conditions,
    medications,
    allergies,
    vitalsSummary,
    riskBand,
    riskScore,
    riskFactors,
    guardianInteractions,
    diabetes: {
      hba1c: diabetesBundle.hba1cReadings.map((r) => ({
        recordedAt: r.recordedAt,
        valueMmolMol: r.valueMmolMol,
      })),
      glucose: diabetesBundle.glucoseReadings.map((r) => ({
        recordedAt: r.recordedAt,
        glucoseMgDl: r.glucoseMgDl,
        context: r.context,
      })),
      insulinNotes,
    },
    openQueue,
    lastNotes,
  };
}

export function formatPatientChatContextForPrompt(ctx: PatientChatChartContext): string {
  const hba1c =
    ctx.diabetes.hba1c.length > 0
      ? ctx.diabetes.hba1c
          .map((r) => `${r.valueMmolMol} mmol/mol @ ${r.recordedAt.slice(0, 10)}`)
          .join("; ")
      : "none in fixture";
  const glucose =
    ctx.diabetes.glucose.length > 0
      ? ctx.diabetes.glucose
          .slice(-4)
          .map((r) => `${r.glucoseMgDl} mg/dL (${r.context ?? "unspecified"}) @ ${r.recordedAt}`)
          .join("; ")
      : "none in fixture";
  const guardian =
    ctx.guardianInteractions.length > 0
      ? ctx.guardianInteractions
          .map((i) => `${i.drugA} + ${i.drugB} [${i.severity}]: ${i.recommendation}`)
          .join("\n")
      : "none flagged";
  const queue =
    ctx.openQueue.length > 0
      ? ctx.openQueue
          .map((q) => `${q.id} ${q.agentType} (${q.priority}/${q.status}): ${q.title}`)
          .join("\n")
      : "none open";
  const notes = ctx.lastNotes.length > 0 ? ctx.lastNotes.join("\n") : "none";

  return `Patient chart context (bounded; rehearsal data):
- Id: ${ctx.patientId}
- Label: ${ctx.patientLabel}
- Data source: ${ctx.dataSource}
- liveEmis: false (no live EHR pull/write)
- Conditions: ${ctx.conditions.join("; ") || "none listed"}
- Medications: ${ctx.medications.join("; ") || "none listed"}
- Allergies: ${ctx.allergies.join("; ") || "none listed"}
- Vitals: ${ctx.vitalsSummary ?? "none listed"}
- Risk: ${ctx.riskBand ?? "n/a"} (score ${ctx.riskScore ?? "n/a"})
- Risk factors: ${ctx.riskFactors.join("; ") || "none listed"}
- GUARDIAN interactions:
${guardian}
- HbA1c trend: ${hba1c}
- Recent glucose: ${glucose}
- Diabetes regimen notes: ${ctx.diabetes.insulinNotes ?? "none"}
- Open review queue:
${queue}
- Last note snippets:
${notes}`;
}
