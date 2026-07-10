export * from "./types";
export { patients, getPatientById, searchPatients, todaysAppointments } from "./patients";
export { reviewQueueItems } from "./review-queue";
export { carePathways, getPathwaysForPatient, countAwaitingApproval } from "./care-pathways";
export { auditEvents } from "./audit-events";
export { commonDrugs, medications, bnfEntries, checkInteractions, searchDrugs } from "./medications";
export { hospitalData, wardStaffing } from "./hospital";
export { populationData, metricSparklines } from "./population";

import type { AdminUser, IntegrationService } from "./types";

export const integrationServices: IntegrationService[] = [
  { name: "EMIS Web", status: "Healthy", lastSync: "2026-07-10 00:00 UTC", latencyMs: 120 },
  { name: "SystmOne", status: "Healthy", lastSync: "2026-07-10 00:00 UTC", latencyMs: 95 },
  { name: "Mirth Connect", status: "Healthy", lastSync: "2026-07-10 00:00 UTC", latencyMs: 45 },
  { name: "Medplum FHIR", status: "Healthy", lastSync: "2026-07-10 00:05 UTC", latencyMs: 78 },
  { name: "Neo4j", status: "Healthy", lastSync: "2026-07-10 00:10 UTC", latencyMs: 32 },
  { name: "Weaviate", status: "Healthy", lastSync: "2026-07-10 00:10 UTC", latencyMs: 55 },
  { name: "Kafka", status: "Healthy", lastSync: "2026-07-10 00:00 UTC", latencyMs: 12 },
  { name: "AWS EKS", status: "Healthy", lastSync: "2026-07-10 00:00 UTC", latencyMs: 8 },
];

export const adminUsers: AdminUser[] = [
  { id: "U001", name: "Dr Morgan", role: "GP", email: "morgan@riverside.nhs.uk", status: "Active", lastActive: "2026-07-10 09:42", mfa: true },
  { id: "U002", name: "Dr Patel", role: "GP", email: "patel@riverside.nhs.uk", status: "Active", lastActive: "2026-07-10 08:30", mfa: true },
  { id: "U003", name: "Dr Williams", role: "GP", email: "williams@riverside.nhs.uk", status: "Active", lastActive: "2026-07-09 16:00", mfa: true },
  { id: "U004", name: "Nurse Davies", role: "Nurse", email: "davies@riverside.nhs.uk", status: "Active", lastActive: "2026-07-10 08:30", mfa: true },
  { id: "U005", name: "Nurse Khan", role: "Nurse", email: "khan@riverside.nhs.uk", status: "Active", lastActive: "2026-07-09 14:00", mfa: false },
  { id: "U006", name: "Pharmacist Lee", role: "Pharmacist", email: "lee@riverside.nhs.uk", status: "Active", lastActive: "2026-07-09 11:00", mfa: true },
  { id: "U007", name: "Admin Singh", role: "Admin", email: "singh@riverside.nhs.uk", status: "Active", lastActive: "2026-07-09 16:45", mfa: true },
  { id: "U008", name: "ICS Lead Thompson", role: "ICS Lead", email: "thompson@wyhcp.nhs.uk", status: "Active", lastActive: "2026-07-08 10:00", mfa: true },
  { id: "U009", name: "Dr Foster", role: "GP", email: "foster@oakwood.nhs.uk", status: "Active", lastActive: "2026-07-07 15:00", mfa: true },
  { id: "U010", name: "Nurse Roberts", role: "Nurse", email: "roberts@oakwood.nhs.uk", status: "Active", lastActive: "2026-07-06 09:00", mfa: false },
  { id: "U011", name: "Pharmacist Ahmed", role: "Pharmacist", email: "ahmed@oakwood.nhs.uk", status: "Invited", lastActive: "—", mfa: false },
  { id: "U012", name: "Dr Chen", role: "GP", email: "chen@valleyview.nhs.uk", status: "Active", lastActive: "2026-07-05 11:00", mfa: true },
];

export const AGENT_COLORS: Record<string, string> = {
  SYNTHESIS: "#003D7A",
  DrASSIST: "#6B46C1",
  GUARDIAN: "#E53E3E",
  ORACLE: "#E67E22",
  EQUITY: "#0D9488",
  SHIELD: "#4A5568",
  VOICE: "#0078D4",
  HEALTH_COMPANION: "#00A86B",
  REFERRAL: "#7C3AED",
  COMMAND: "#1A202C",
};

export const RISK_COLORS: Record<string, string> = {
  Low: "#00A86B",
  Medium: "#E67E22",
  High: "#E53E3E",
  VeryHigh: "#7B2D8B",
};

export const CURRENT_GP = "Dr Morgan";
export const PRACTICE_NAME = "Riverside Medical Centre";
