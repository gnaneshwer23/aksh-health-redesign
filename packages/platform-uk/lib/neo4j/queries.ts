import type { Record as Neo4jRecord } from "neo4j-driver";

import type { OracleRisk } from "@/lib/mock-data/types";
import { runQuery } from "@/lib/neo4j";
import type {
  GuardianSeverity,
  Neo4jGuardianInteraction,
  Neo4jGuardianResponse,
  Neo4jIcsPopulationResponse,
  Neo4jPatientResponse,
} from "@/lib/neo4j/types";

function recordValue(record: Neo4jRecord, key: string): unknown {
  return record.get(key);
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapGraphSeverity(severity: string): GuardianSeverity {
  const normalized = severity.toLowerCase();
  if (normalized === "high" || normalized === "red") return "red";
  if (normalized === "medium" || normalized === "amber") return "amber";
  return "green";
}

function overallGuardianStatus(interactions: Neo4jGuardianInteraction[]): GuardianSeverity {
  if (interactions.some((i) => i.severity === "red")) return "red";
  if (interactions.some((i) => i.severity === "amber")) return "amber";
  return "green";
}

export async function fetchPatientFromGraph(id: string): Promise<Neo4jPatientResponse | null> {
  // OPTIONAL MATCH keeps honesty: a Patient node in-graph is neo4j even with 0 conditions.
  // Required HAS_CONDITION previously returned null → mock header while Aura was live.
  const result = await runQuery(
    `MATCH (p:Patient {id: $id})
     OPTIONAL MATCH (p)-[:HAS_CONDITION]->(c:Condition)
     OPTIONAL MATCH (p)-[:TAKES_MEDICATION]->(m:Medication)
     RETURN p,
            collect(DISTINCT c.name) AS conditions,
            collect(DISTINCT m.name) AS medications`,
    { id }
  );

  const record = result.records[0];
  if (!record) return null;

  const patientNode = recordValue(record, "p") as { properties: Record<string, unknown> } | null;
  if (!patientNode?.properties) return null;
  const patient = patientNode.properties;
  const conditions = (recordValue(record, "conditions") as string[]).filter(Boolean);
  const medications = (recordValue(record, "medications") as string[]).filter(Boolean);
  const riskFactorsRaw = patient.riskFactors;
  const riskFactors = Array.isArray(riskFactorsRaw)
    ? riskFactorsRaw.map(String)
    : typeof riskFactorsRaw === "string"
      ? riskFactorsRaw.split("|").map((s) => s.trim()).filter(Boolean)
      : [];

  const vitals =
    patient.bloodPressure && patient.heartRate !== undefined && patient.heartRate !== null
      ? {
          bloodPressure: asString(patient.bloodPressure),
          heartRate: asNumber(patient.heartRate),
          temperature: asNumber(patient.temperature),
          spo2: asNumber(patient.spo2),
          respiratoryRate: asNumber(patient.respiratoryRate),
          recordedAt: asString(patient.vitalsRecordedAt),
        }
      : null;

  return {
    id: asString(patient.id, id),
    name: asString(patient.name),
    nhsNumber: asString(patient.nhsNumber),
    dob: asString(patient.dob),
    age: asNumber(patient.age),
    postcode: asString(patient.postcode),
    oracleScore: asNumber(patient.oracleScore),
    oracleRisk: asString(patient.oracleRisk, "Low") as OracleRisk,
    conditions,
    medications,
    riskFactors,
    admissionRisk14Days: asNumber(patient.admissionRisk14Days),
    vitals,
  };
}

export async function fetchGuardianFromGraph(patientId: string): Promise<Neo4jGuardianResponse | null> {
  // Require the Patient node. Empty interaction lists are fine; inventing neo4j for a
  // missing patient is not (smoke previously saw guardian=neo4j + patient=mock on empty Aura).
  const present = await runQuery(`MATCH (p:Patient {id: $id}) RETURN p.id AS id LIMIT 1`, {
    id: patientId,
  });
  if (!present.records[0]) return null;

  const result = await runQuery(
    `MATCH (p:Patient {id: $id})-[:TAKES_MEDICATION]->(m1:Medication)
     MATCH (m1)-[i:INTERACTS_WITH]->(m2:Medication)
     WHERE EXISTS { MATCH (p)-[:TAKES_MEDICATION]->(m2) }
     RETURN m1.name AS drugA,
            m2.name AS drugB,
            i.severity AS severity,
            i.bnfRef AS bnfRef,
            i.recommendation AS recommendation`,
    { id: patientId }
  );

  const interactions: Neo4jGuardianInteraction[] = result.records.map((record) => ({
    drugA: asString(recordValue(record, "drugA")),
    drugB: asString(recordValue(record, "drugB")),
    severity: mapGraphSeverity(asString(recordValue(record, "severity"), "Low")),
    bnfRef: asString(recordValue(record, "bnfRef")),
    recommendation: asString(recordValue(record, "recommendation")),
  }));

  return {
    patientId,
    interactions,
    overallStatus: overallGuardianStatus(interactions),
  };
}

export async function fetchIcsPopulationFromGraph(): Promise<Neo4jIcsPopulationResponse> {
  const icsResult = await runQuery(
    `MATCH (ics:Organization {type: 'ICS'})
     RETURN ics.name AS icsName,
            ics.totalPatients AS totalPatients,
            ics.practices AS practices,
            ics.aiActionsThisMonth AS aiActionsThisMonth,
            ics.synthesisApprovalRate AS synthesisApprovalRate,
            ics.guardianAlertsGenerated AS guardianAlertsGenerated,
            ics.equityFlags AS equityFlags,
            ics.riskLow AS riskLow,
            ics.riskMedium AS riskMedium,
            ics.riskHigh AS riskHigh,
            ics.riskVeryHigh AS riskVeryHigh`
  );

  const icsRecord = icsResult.records[0];
  if (!icsRecord) {
    throw new Error("regional organization node not found in graph");
  }

  const imdResult = await runQuery(
    `MATCH (imd:ImdQuintile)
     RETURN imd.quintile AS quintile,
            imd.t2d AS t2d,
            imd.hypertension AS hypertension,
            imd.copd AS copd,
            imd.depression AS depression
     ORDER BY imd.quintile`
  );

  const practiceResult = await runQuery(
    `MATCH (org:Organization {type: 'Practice'})
     RETURN org.name AS name,
            org.listSize AS listSize,
            org.aiAdoption AS aiAdoption,
            org.queueClearance AS queueClearance,
            org.guardianAlerts AS guardianAlerts,
            org.equityFlags AS equityFlags,
            org.overallScore AS overallScore
     ORDER BY org.overallScore DESC`
  );

  const forecastResult = await runQuery(
    `MATCH (f:AdmissionForecast)
     RETURN f.day AS day,
            f.predicted AS predicted,
            f.historical AS historical,
            f.upper AS upper,
            f.lower AS lower
     ORDER BY f.day`
  );

  const equityResult = await runQuery(
    `MATCH (e:EquityFlag)
     RETURN e.category AS category,
            e.flagCount AS flagCount,
            e.practice AS practice,
            e.recommendedAction AS recommendedAction,
            e.status AS status
     ORDER BY e.flagCount DESC`
  );

  return {
    icsName: asString(recordValue(icsRecord, "icsName")),
    totalPatients: asNumber(recordValue(icsRecord, "totalPatients")),
    practices: asNumber(recordValue(icsRecord, "practices")),
    aiActionsThisMonth: asNumber(recordValue(icsRecord, "aiActionsThisMonth")),
    synthesisApprovalRate: asNumber(recordValue(icsRecord, "synthesisApprovalRate")),
    guardianAlertsGenerated: asNumber(recordValue(icsRecord, "guardianAlertsGenerated")),
    equityFlags: asNumber(recordValue(icsRecord, "equityFlags")),
    riskDistribution: {
      low: asNumber(recordValue(icsRecord, "riskLow")),
      medium: asNumber(recordValue(icsRecord, "riskMedium")),
      high: asNumber(recordValue(icsRecord, "riskHigh")),
      veryHigh: asNumber(recordValue(icsRecord, "riskVeryHigh")),
    },
    conditionPrevalenceByIMD: imdResult.records.map((record) => ({
      quintile: asString(recordValue(record, "quintile")),
      t2d: asNumber(recordValue(record, "t2d")),
      hypertension: asNumber(recordValue(record, "hypertension")),
      copd: asNumber(recordValue(record, "copd")),
      depression: asNumber(recordValue(record, "depression")),
    })),
    benchmarkByPractice: practiceResult.records.map((record) => ({
      name: asString(recordValue(record, "name")),
      listSize: asNumber(recordValue(record, "listSize")),
      aiAdoption: asNumber(recordValue(record, "aiAdoption")),
      queueClearance: asNumber(recordValue(record, "queueClearance")),
      guardianAlerts: asNumber(recordValue(record, "guardianAlerts")),
      equityFlags: asNumber(recordValue(record, "equityFlags")),
      overallScore: asNumber(recordValue(record, "overallScore")),
    })),
    admissionForecast: forecastResult.records.map((record) => ({
      day: asString(recordValue(record, "day")),
      predicted: asNumber(recordValue(record, "predicted")),
      historical: asNumber(recordValue(record, "historical")),
      upper: asNumber(recordValue(record, "upper")),
      lower: asNumber(recordValue(record, "lower")),
    })),
    equityDeepDive: equityResult.records.map((record) => ({
      category: asString(recordValue(record, "category")),
      flagCount: asNumber(recordValue(record, "flagCount")),
      practice: asString(recordValue(record, "practice")),
      recommendedAction: asString(recordValue(record, "recommendedAction")),
      status: asString(recordValue(record, "status")),
    })),
  };
}
