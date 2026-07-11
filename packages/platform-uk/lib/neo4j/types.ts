import type { OracleRisk, PopulationData } from "@/lib/mock-data/types";

export type GuardianSeverity = "red" | "amber" | "green";

export interface Neo4jPatientVitals {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  spo2: number;
  respiratoryRate: number;
  recordedAt: string;
}

export interface Neo4jPatientResponse {
  id: string;
  name: string;
  nhsNumber: string;
  dob: string;
  age: number;
  postcode: string;
  oracleScore: number;
  oracleRisk: OracleRisk;
  conditions: string[];
  medications: string[];
  riskFactors: string[];
  admissionRisk14Days: number;
  vitals: Neo4jPatientVitals | null;
}

export interface Neo4jGuardianInteraction {
  drugA: string;
  drugB: string;
  severity: GuardianSeverity;
  bnfRef: string;
  recommendation: string;
}

export interface Neo4jGuardianResponse {
  patientId: string;
  interactions: Neo4jGuardianInteraction[];
  overallStatus: GuardianSeverity;
}

export type Neo4jIcsPopulationResponse = Pick<
  PopulationData,
  | "icsName"
  | "totalPatients"
  | "practices"
  | "aiActionsThisMonth"
  | "synthesisApprovalRate"
  | "guardianAlertsGenerated"
  | "conditionPrevalenceByIMD"
  | "riskDistribution"
  | "equityFlags"
  | "benchmarkByPractice"
  | "admissionForecast"
  | "equityDeepDive"
>;
