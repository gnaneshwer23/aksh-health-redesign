import { checkInteractions } from "@/lib/mock-data/medications";
import { getPatientById } from "@/lib/mock-data/patients";
import { populationData } from "@/lib/mock-data/population";
import type {
  GuardianSeverity,
  Neo4jGuardianInteraction,
  Neo4jGuardianResponse,
  Neo4jIcsPopulationResponse,
  Neo4jPatientResponse,
} from "@/lib/neo4j/types";

function mapSeverity(severity: "High" | "Medium" | "Low"): GuardianSeverity {
  if (severity === "High") return "red";
  if (severity === "Medium") return "amber";
  return "green";
}

function overallGuardianStatus(interactions: Neo4jGuardianInteraction[]): GuardianSeverity {
  if (interactions.some((i) => i.severity === "red")) return "red";
  if (interactions.some((i) => i.severity === "amber")) return "amber";
  return "green";
}

export function getMockPatientResponse(id: string): Neo4jPatientResponse | null {
  const patient = getPatientById(id);
  if (!patient) return null;

  return {
    id: patient.id,
    name: patient.name,
    nhsNumber: patient.nhsNumber,
    dob: patient.dob,
    age: patient.age,
    postcode: patient.postcode,
    oracleScore: patient.oracleScore,
    oracleRisk: patient.oracleRisk,
    conditions: patient.activeConditions,
    medications: patient.activeMedications,
    riskFactors: patient.digitalTwinPrediction.deteriorationSignals,
    admissionRisk14Days: patient.digitalTwinPrediction.admissionRisk14Days,
    vitals: patient.vitals
      ? {
          bloodPressure: patient.vitals.bloodPressure,
          heartRate: patient.vitals.heartRate,
          temperature: patient.vitals.temperature,
          spo2: patient.vitals.spo2,
          respiratoryRate: patient.vitals.respiratoryRate,
          recordedAt: patient.vitals.recordedAt,
        }
      : null,
  };
}

export function getMockGuardianResponse(patientId: string): Neo4jGuardianResponse | null {
  const patient = getPatientById(patientId);
  if (!patient) return null;

  const interactions: Neo4jGuardianInteraction[] = [];
  const seen = new Set<string>();

  for (const medLine of patient.activeMedications) {
    const drugName = medLine.split(/\s+\d/)[0]?.trim() ?? medLine;
    const hits = checkInteractions(drugName, patient.activeMedications);
    for (const hit of hits) {
      const key = [hit.drugA, hit.drugB].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      interactions.push({
        drugA: hit.drugA,
        drugB: hit.drugB,
        severity: mapSeverity(hit.severity),
        bnfRef: `BNF ${hit.bnfSection}`,
        recommendation: hit.recommendation,
      });
    }
  }

  if (patientId === "P002") {
    const patelKey = "Apixaban|Aspirin";
    if (!seen.has(patelKey)) {
      interactions.unshift({
        drugA: "Apixaban",
        drugB: "Aspirin",
        severity: "red",
        bnfRef: "BNF 2.9",
        recommendation: "Additive bleeding risk: review aspirin indication; consider apixaban monotherapy",
      });
    }
  }

  return {
    patientId,
    interactions,
    overallStatus: overallGuardianStatus(interactions),
  };
}

export function getMockIcsPopulationResponse(): Neo4jIcsPopulationResponse {
  return {
    icsName: populationData.icsName,
    totalPatients: populationData.totalPatients,
    practices: populationData.practices,
    aiActionsThisMonth: populationData.aiActionsThisMonth,
    synthesisApprovalRate: populationData.synthesisApprovalRate,
    guardianAlertsGenerated: populationData.guardianAlertsGenerated,
    conditionPrevalenceByIMD: populationData.conditionPrevalenceByIMD,
    riskDistribution: populationData.riskDistribution,
    equityFlags: populationData.equityFlags,
    benchmarkByPractice: populationData.benchmarkByPractice,
    admissionForecast: populationData.admissionForecast,
    equityDeepDive: populationData.equityDeepDive,
  };
}
