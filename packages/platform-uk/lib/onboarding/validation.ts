import { z } from "zod";

import type { OnboardingStepId, UserRole } from "./roles";
import { validateNhsNumber } from "./nhs-number";

const gmcSchema = z
  .string()
  .regex(/^\d{7}$/, "GMC number must be exactly 7 digits");

const nmcSchema = z
  .string()
  .regex(/^[0-9]{2}[A-Z][0-9]{4}[A-Z]$/i, "NMC number format: e.g. 12A3456B");

const gphcSchema = z
  .string()
  .regex(/^\d{7}$/, "GPhC number must be exactly 7 digits");

const emailSchema = z.string().email("Enter a valid email address");
const mobileSchema = z
  .string()
  .min(10, "Enter a valid UK mobile number")
  .regex(/^(\+44|0)[0-9\s]{9,14}$/, "Enter a valid UK mobile number");

export const gpIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  gmcNumber: gmcSchema,
  nhsEmail: emailSchema,
  mobile: mobileSchema,
});

export const nurseIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  nmcNumber: nmcSchema,
  nhsEmail: emailSchema,
  mobile: mobileSchema,
});

export const pharmacistIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  gphcNumber: gphcSchema,
  nhsEmail: emailSchema,
  mobile: mobileSchema,
});

export const practiceManagerIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  workEmail: emailSchema,
  jobTitle: z.string().min(2, "Job title is required"),
  mobile: mobileSchema,
});

export const icsLeadIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  orgEmail: emailSchema,
  jobTitle: z.string().min(2, "Job title is required"),
  icsName: z.string().min(2, "ICS name is required"),
  nhsDigitalRef: z.string().optional(),
});

export const hospitalExecutiveIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  workEmail: emailSchema,
  jobTitle: z.enum(["CEO", "COO", "CMO", "CFO", "CIO", "Other"]),
  mobile: mobileSchema,
  trustName: z.string().min(2, "Hospital trust name is required"),
});

export const patientIdentitySchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    nhsNumber: z
      .string()
      .regex(/^\d{10}$/, "NHS number must be 10 digits")
      .refine(validateNhsNumber, "Invalid NHS number checksum"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.email?.trim() || data.phone?.trim()), {
    message: "Provide at least an email or phone number",
    path: ["email"],
  });

export const researcherIdentitySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  institutionalEmail: emailSchema,
  institutionName: z.string().min(2, "Institution name is required"),
  orcid: z.string().optional(),
});

export const gpOrgSchema = z.object({
  odsCode: z.string().min(3, "ODS code is required"),
  listSize: z.string().min(1, "List size is required"),
  ehrSystem: z.enum(["EMIS Web", "SystmOne", "Other"]),
  icsRegion: z.string().min(1, "ICS region is required"),
});

export const nurseOrgSchema = z.object({
  odsCode: z.string().min(3, "ODS code is required"),
  supervisingGp: z.string().min(2, "Supervising GP name is required"),
  wardTeam: z.string().min(1, "Ward/team is required"),
});

export const pharmacistOrgSchema = z.object({
  odsCode: z.string().min(3, "ODS code is required"),
  pcnAffiliation: z.string().min(1, "PCN affiliation is required"),
  ehrSystem: z.enum(["EMIS Web", "SystmOne", "Other"]),
});

export const practiceManagerOrgSchema = z.object({
  odsCode: z.string().min(3, "ODS code is required"),
  practiceName: z.string().min(2, "Practice name is required"),
  icsRegion: z.string().min(1, "ICS region is required"),
  numberOfGps: z.coerce.number().min(1, "Enter number of GPs"),
});

export const icsLeadOrgSchema = z.object({
  icsOdsCode: z.string().min(2, "ICS ODS code is required"),
  practicesInScope: z.coerce.number().min(1, "Enter number of practices"),
  ehrMix: z
    .array(z.enum(["EMIS Web", "SystmOne", "Mixed", "Other"]))
    .min(1, "Select at least one EHR"),
  pilotCohort: z.enum(["Phase 1", "Phase 2", "Observer"]),
});

export const hospitalExecutiveOrgSchema = z.object({
  trustOdsCode: z.string().min(2, "Trust ODS code is required"),
  numberOfBeds: z.coerce.number().min(1, "Enter number of beds"),
  hospitalType: z.enum(["Acute", "Mental Health", "Community", "Private"]),
  ehrSystem: z.enum(["Epic", "Oracle Health", "EMIS", "Other"]),
});

export const researcherOrgSchema = z.object({
  researchInstitution: z.string().min(2, "Research institution is required"),
  ethicsBoardRef: z.string().optional(),
  affiliatedTrust: z.string().optional(),
});

export const gpPreferencesSchema = z.object({
  synthesisLength: z.enum(["Brief", "Standard", "Detailed"]),
  oracleAlerts: z.enum(["All patients", "High risk only", "Off"]),
  guardianSensitivity: z.enum(["All interactions", "Severe only"]),
  voiceAgent: z.enum(["On", "Off"]),
  equityReports: z.enum(["Monthly", "Quarterly", "Off"]),
  dailyDigest: z.enum(["7am", "8am", "9am", "Off"]),
});

export const nursePreferencesSchema = z.object({
  guardianAlerts: z.enum(["All", "Drug interactions only", "Off"]),
  voiceDictation: z.enum(["On", "Off"]),
  handoverSummary: z.enum(["Auto at shift end", "Manual"]),
  equityFlags: z.enum(["Show", "Hide"]),
});

export const pharmacistPreferencesSchema = z.object({
  bnfAlerts: z.enum(["All", "Severe only", "Off"]),
  medReconciliation: z.enum(["Auto-flag", "Manual"]),
  guardianSensitivity: z.enum(["High", "Standard"]),
  interactionDisplay: z.enum(["Inline", "Separate panel"]),
});

export const practiceManagerPreferencesSchema = z.object({
  equityReports: z.enum(["Monthly", "Quarterly", "Off"]),
  extractionAlerts: z.enum(["Email on failure", "None"]),
  billingContact: z.enum(["Same as me", "Different person"]),
  billingContactName: z.string().optional(),
  billingContactEmail: z.string().email().optional().or(z.literal("")),
  newUserInvitations: z.enum(["Require admin approval", "Auto-approve"]),
});

export const icsLeadPreferencesSchema = z.object({
  imdOverlay: z.enum(["On", "Off"]),
  frailtyCohort: z.enum(["On", "Off"]),
  crossPracticeBenchmarking: z.enum(["On", "Off"]),
  digitalTwinHospital: z.enum(["On", "Off"]),
  reportCadence: z.enum(["Monthly board pack", "Quarterly", "Manual"]),
  aiAdoptionAlert: z.enum(["On", "Off"]),
});

export const hospitalExecutivePreferencesSchema = z.object({
  bedManagementAlerts: z.enum(["On", "Off"]),
  staffingAlerts: z.enum(["On", "Off"]),
  edWaitingThreshold: z.coerce.number().min(1).max(24),
  digitalTwinWinter: z.enum(["On", "Off"]),
  theatreOptimisation: z.enum(["On", "Off"]),
  reportCadence: z.enum(["Daily executive briefing", "Weekly", "Monthly"]),
});

export const researcherPreferencesSchema = z.object({
  dataAccessLevel: z.enum([
    "Aggregate (anonymised) only",
    "Individual (requires ethics)",
  ]),
  reportFormat: z.enum(["CSV", "API", "Dashboard"]),
});

const requiredConsent = z.literal(true, { message: "Required consent" });

export const gpConsentSchema = z.object({
  aiDocumentation: requiredConsent,
  hitlApproval: requiredConsent,
  dcb0129: requiredConsent,
  anonymisedOutcomes: z.boolean().optional(),
});

export const nurseConsentSchema = gpConsentSchema;

export const pharmacistConsentSchema = gpConsentSchema;

export const practiceManagerConsentSchema = z.object({
  dpa: requiredConsent,
  dspt: requiredConsent,
  ehrIntegration: requiredConsent,
});

export const icsLeadConsentSchema = z.object({
  dataSharing: requiredConsent,
  pseudonymised: requiredConsent,
  pilotEvaluation: requiredConsent,
});

export const hospitalExecutiveConsentSchema = z.object({
  enterpriseDpa: requiredConsent,
  gdprController: requiredConsent,
});

export const patientConsentSchema = z.object({
  healthContact: requiredConsent,
  gpApproval: requiredConsent,
  careImprovement: z.boolean().optional(),
  voiceCalls: z.boolean().optional(),
});

export const researcherConsentSchema = z.object({
  dataGovernance: requiredConsent,
  ethicsCompliance: requiredConsent,
});

export function getIdentitySchema(role: UserRole) {
  switch (role) {
    case "gp":
      return gpIdentitySchema;
    case "nurse":
      return nurseIdentitySchema;
    case "clinical-pharmacist":
      return pharmacistIdentitySchema;
    case "practice-manager":
      return practiceManagerIdentitySchema;
    case "ics-lead":
      return icsLeadIdentitySchema;
    case "hospital-executive":
      return hospitalExecutiveIdentitySchema;
    case "patient":
      return patientIdentitySchema;
    case "researcher":
      return researcherIdentitySchema;
  }
}

export function getOrgSchema(role: UserRole) {
  switch (role) {
    case "gp":
      return gpOrgSchema;
    case "nurse":
      return nurseOrgSchema;
    case "clinical-pharmacist":
      return pharmacistOrgSchema;
    case "practice-manager":
      return practiceManagerOrgSchema;
    case "ics-lead":
      return icsLeadOrgSchema;
    case "hospital-executive":
      return hospitalExecutiveOrgSchema;
    case "researcher":
      return researcherOrgSchema;
    default:
      return null;
  }
}

export function getPreferencesSchema(role: UserRole) {
  switch (role) {
    case "gp":
      return gpPreferencesSchema;
    case "nurse":
      return nursePreferencesSchema;
    case "clinical-pharmacist":
      return pharmacistPreferencesSchema;
    case "practice-manager":
      return practiceManagerPreferencesSchema;
    case "ics-lead":
      return icsLeadPreferencesSchema;
    case "hospital-executive":
      return hospitalExecutivePreferencesSchema;
    case "researcher":
      return researcherPreferencesSchema;
    default:
      return null;
  }
}

export function getConsentSchema(role: UserRole) {
  switch (role) {
    case "gp":
      return gpConsentSchema;
    case "nurse":
      return nurseConsentSchema;
    case "clinical-pharmacist":
      return pharmacistConsentSchema;
    case "practice-manager":
      return practiceManagerConsentSchema;
    case "ics-lead":
      return icsLeadConsentSchema;
    case "hospital-executive":
      return hospitalExecutiveConsentSchema;
    case "patient":
      return patientConsentSchema;
    case "researcher":
      return researcherConsentSchema;
  }
}

export function getStepSchema(role: UserRole, step: OnboardingStepId) {
  switch (step) {
    case "identity":
      return getIdentitySchema(role);
    case "organisation":
      return getOrgSchema(role);
    case "preferences":
      return getPreferencesSchema(role);
    case "consent":
      return getConsentSchema(role);
    default:
      return null;
  }
}

export type IdentityData = Record<string, unknown>;
export type OrganisationData = Record<string, unknown>;
export type PreferencesData = Record<string, unknown>;
export type ConsentData = Record<string, boolean>;
