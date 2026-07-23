export * from "./types";
export { patients, getPatientById, searchPatients, todaysAppointments } from "./patients";
export { DEFAULT_GP_PREFERENCES, GP_PREFERENCE_LABELS } from "./gp-preferences";
export type { GpPreferences } from "./gp-preferences";
export { reviewQueueItems } from "./review-queue";
export { carePathways, getPathwaysForPatient, countAwaitingApproval } from "./care-pathways";
export { auditEvents } from "./audit-events";
export { commonDrugs, medications, bnfEntries, checkInteractions, searchDrugs } from "./medications";
export { hospitalData, wardStaffing } from "./hospital";
export { populationData, metricSparklines } from "./population";
export {
  generateDemoCohortUsers,
  generateExtendedDemoPatients,
  DEMO_COHORT_DEFAULT_PASSWORD,
  DEMO_COHORT_EMAIL_DOMAIN,
} from "./demo-cohort-generator";

import type { AdminUser, IntegrationService } from "./types";
import { generateDemoCohortUsers } from "./demo-cohort-generator";

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

const ROLE_LABEL: Record<string, string> = {
  gp: "GP",
  nurse: "Nurse",
  "clinical-pharmacist": "Pharmacist",
  "practice-manager": "Admin",
  "ics-lead": "ICS Lead",
  "hospital-executive": "Hospital Exec",
  patient: "Patient",
  researcher: "Researcher",
};

/** Legacy Riverside mock roster (kept for compatibility). */
const legacyAdminUsers: AdminUser[] = [
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
  { id: "U011", name: "Pharmacist Ahmed", role: "Pharmacist", email: "ahmed@oakwood.nhs.uk", status: "Invited", lastActive: "Not set", mfa: false },
  { id: "U012", name: "Dr Chen", role: "GP", email: "chen@valleyview.nhs.uk", status: "Active", lastActive: "2026-07-05 11:00", mfa: true },
];

/** 100 synthetic demo-cohort users (profiles also seedable into Neon). */
const demoCohortAdminUsers: AdminUser[] = generateDemoCohortUsers().map((u, idx) => ({
  id: `DC${String(idx + 1).padStart(3, "0")}`,
  name: u.fullName,
  role: ROLE_LABEL[u.role] ?? u.role,
  email: u.email,
  status: "Active" as const,
  lastActive: "2026-07-20 09:00",
  mfa: idx % 3 !== 0,
}));

export const adminUsers: AdminUser[] = [...legacyAdminUsers, ...demoCohortAdminUsers];

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
  // Renamed labels (July 2026 naming reference) — same colours as legacy ids
  HORIZON: "#E67E22",
  COMPASS: "#0D9488",
  PATHWAY: "#7C3AED",
  CANVAS: "#2B6CB0",
  BRIDGE: "#B7791F",
  NEXUS: "#2C7A7B",
  CONDUCTOR: "#1A202C",
};

export const RISK_COLORS: Record<string, string> = {
  Low: "#00A86B",
  Medium: "#E67E22",
  High: "#E53E3E",
  VeryHigh: "#7B2D8B",
};

export const CURRENT_GP = "Dr Morgan";
export const PRACTICE_NAME = "Riverside Medical Centre";
