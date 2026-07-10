import type { AuditEvent } from "./types";

export const auditEvents: AuditEvent[] = [
  { id: "AE001", timestamp: "2026-07-10T09:42:00Z", user: "Dr Morgan", agent: "SYNTHESIS", action: "Accepted SOAP note", resource: "RQ001 / Mr James Patel" },
  { id: "AE002", timestamp: "2026-07-10T09:15:00Z", user: "Dr Morgan", agent: "DrASSIST", action: "Rejected clinical code", resource: "E11.9 → reason: use E11.65" },
  { id: "AE003", timestamp: "2026-07-10T08:30:00Z", user: "Nurse Davies", agent: "Nurse", action: "Saved vital signs", resource: "Mrs Sarah Johnson — BP 142/88" },
  { id: "AE004", timestamp: "2026-07-10T08:12:00Z", user: "System", agent: "VOICE", action: "Voice transcript generated", resource: "Mrs Sarah Johnson — Day 3 check-in" },
  { id: "AE005", timestamp: "2026-07-09T16:45:00Z", user: "Admin Singh", agent: "Admin", action: "Invited user", resource: "pharmacist@riverside.nhs.uk — Pharmacist" },
  { id: "AE006", timestamp: "2026-07-09T14:30:00Z", user: "Dr Patel", agent: "SYNTHESIS", action: "Edited multimorbidity summary", resource: "RQ008 / Mrs Margaret Williams" },
  { id: "AE007", timestamp: "2026-07-09T11:20:00Z", user: "Dr Williams", agent: "GUARDIAN", action: "Acknowledged drug alert", resource: "Mr Thomas Green — Warfarin + Ibuprofen" },
  { id: "AE008", timestamp: "2026-07-09T10:00:00Z", user: "Nurse Davies", agent: "SYNTHESIS", action: "Approved handover summary", resource: "Night shift handover — Ward 3A" },
  { id: "AE009", timestamp: "2026-07-08T15:30:00Z", user: "Dr Morgan", agent: "ORACLE", action: "Accepted risk update", resource: "Mr Daniel Chen — score 52→58" },
  { id: "AE010", timestamp: "2026-07-08T11:05:00Z", user: "Dr Morgan", agent: "DrASSIST", action: "Accepted coding proposal", resource: "RQ006 / Mr Daniel Chen" },
  { id: "AE011", timestamp: "2026-07-07T09:00:00Z", user: "System", agent: "System", action: "Nightly extraction completed", resource: "1,171 records — 0 errors" },
  { id: "AE012", timestamp: "2026-07-06T14:20:00Z", user: "Pharmacist Lee", agent: "GUARDIAN", action: "Medication review completed", resource: "Mr Thomas Green — polypharmacy" },
  { id: "AE013", timestamp: "2026-07-05T12:20:00Z", user: "Dr Patel", agent: "REFERRAL", action: "Generated referral package", resource: "RQ009 / Mr William Brown" },
  { id: "AE014", timestamp: "2026-07-04T16:00:00Z", user: "Mrs Emma Clarke", agent: "Patient", action: "Completed check-in", resource: "Antenatal wellbeing check" },
  { id: "AE015", timestamp: "2026-07-03T10:30:00Z", user: "ICS Lead Thompson", agent: "EQUITY", action: "Flagged disparity", resource: "Mrs Margaret Williams — IMD Q1" },
  { id: "AE016", timestamp: "2026-07-02T08:00:00Z", user: "Hospital Ops", agent: "COMMAND", action: "Accepted AI recommendation", resource: "Accelerate discharge reviews — Ward 3A" },
  { id: "AE017", timestamp: "2026-07-01T15:10:00Z", user: "System", agent: "GUARDIAN", action: "Polypharmacy alert generated", resource: "RQ007 / Mr Thomas Green" },
  { id: "AE018", timestamp: "2026-06-30T17:00:00Z", user: "Dr Morgan", agent: "SYNTHESIS", action: "Rejected draft note", resource: "Reason: missing examination findings" },
  { id: "AE019", timestamp: "2026-06-29T12:00:00Z", user: "Admin Singh", agent: "Admin", action: "Deactivated user", resource: "temp.locum@riverside.nhs.uk" },
  { id: "AE020", timestamp: "2026-06-28T09:30:00Z", user: "Dr Williams", agent: "SHIELD", action: "Audit log export initiated", resource: "Full audit trail — June 2026" },
];
