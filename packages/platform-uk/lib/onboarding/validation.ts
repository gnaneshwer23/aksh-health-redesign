import { z } from "zod";

import type { OnboardingStepId, UserRole } from "./roles";

const emailSchema = z.string().email("Enter a valid email address");
/** International phone: digits, spaces, brackets, dashes, optional leading +. */
const phoneSchema = z
  .string()
  .regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number, with country code if outside your market");
const optionalPhone = phoneSchema.optional().or(z.literal(""));
/** Registration is recorded now and verified before any live patient data; it never blocks the sandbox. */
const registrationSchema = z.string().trim().max(40, "Too long").optional().or(z.literal(""));
const fullName = z.string().min(2, "Full name is required");

export const clinicianIdentitySchema = z.object({
  fullName,
  registrationNumber: registrationSchema,
  registrationBody: z.string().trim().max(120).optional().or(z.literal("")),
  workEmail: emailSchema,
  phone: optionalPhone,
});

export const gpIdentitySchema = clinicianIdentitySchema;
export const nurseIdentitySchema = clinicianIdentitySchema;
export const pharmacistIdentitySchema = clinicianIdentitySchema;

export const practiceManagerIdentitySchema = z.object({
  fullName,
  workEmail: emailSchema,
  jobTitle: z.string().min(2, "Job title is required"),
  phone: optionalPhone,
});

export const icsLeadIdentitySchema = z.object({
  fullName,
  workEmail: emailSchema,
  jobTitle: z.string().min(2, "Job title is required"),
  networkName: z.string().optional().or(z.literal("")),
});

export const hospitalExecutiveIdentitySchema = z.object({
  fullName,
  workEmail: emailSchema,
  jobTitle: z.enum(["CEO", "COO", "CMO", "CFO", "CIO", "Other"]),
  phone: optionalPhone,
});

export const patientIdentitySchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    inviteCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{8,32}$/, "Invite codes look like ABCD-EFGH-JKLM-NPQR")
      .optional()
      .or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    phone: optionalPhone,
  })
  .refine((data) => Boolean(data.email?.trim() || data.phone?.trim()), {
    message: "Provide at least an email or phone number",
    path: ["email"],
  });

export const researcherIdentitySchema = z.object({
  fullName,
  institutionalEmail: emailSchema,
  institutionName: z.string().min(2, "Institution name is required"),
  orcid: z.string().optional(),
});

export const ORG_EHR_OPTIONS = [
  "Epic",
  "Oracle Health (Cerner)",
  "athenahealth",
  "eClinicalWorks",
  "Other EHR",
  "Practice management system only",
  "No EHR yet",
] as const;

/**
 * One organisation step for every professional role. By default the account starts in the sandbox clinic;
 * organisation details are only required when the person chooses to describe their own.
 */
export const organisationSchema = z
  .object({
    useSynthetic: z.boolean().default(true),
    organisationName: z.string().trim().optional().or(z.literal("")),
    organisationId: z.string().trim().max(40).optional().or(z.literal("")),
    ehrSystem: z.enum(ORG_EHR_OPTIONS).optional(),
    region: z.string().optional().or(z.literal("")),
  })
  .refine((d) => d.useSynthetic || Boolean(d.organisationName && d.organisationName.length >= 2), {
    message: "Organisation name is required, or start with the sandbox clinic",
    path: ["organisationName"],
  });

export const gpOrgSchema = organisationSchema;
export const nurseOrgSchema = organisationSchema;
export const pharmacistOrgSchema = organisationSchema;
export const practiceManagerOrgSchema = organisationSchema;
export const icsLeadOrgSchema = organisationSchema;
export const hospitalExecutiveOrgSchema = organisationSchema;
export const researcherOrgSchema = organisationSchema;

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
