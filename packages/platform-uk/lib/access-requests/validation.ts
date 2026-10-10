import { z } from "zod";

export const ORG_TYPES = [
  "Primary care / clinic network",
  "Specialist diabetes centre",
  "Hospital / health system",
  "Regional or integrated care network",
  "Pharmacy group",
  "Payer / insurer",
  "Private healthcare provider",
  "Employer or digital health programme",
] as const;

/** Where the organisation operates. Aksh is not tied to one health system. (Name kept for API compatibility.) */
export const ICS_REGIONS = [
  "Europe",
  "North America",
  "Latin America",
  "Middle East",
  "Africa",
  "South Asia",
  "East & Southeast Asia",
  "Oceania",
  "Other",
] as const;

export const EHR_SYSTEMS = ["Epic", "Oracle Health (Cerner)", "athenahealth", "eClinicalWorks", "Other EHR", "Practice management system only", "No EHR yet"] as const;

export const LIST_SIZES = [
  "Under 5,000",
  "5,000–15,000",
  "15,000–50,000",
  "50,000–200,000",
  "Over 200,000",
] as const;

export const ORGANISATION_COMMITMENTS = [
  "We will sign a Data Processing Agreement (DPA) before go-live",
  "We will nominate a Clinical Safety Officer or lead clinician for deployment",
  "We will provide access for integration with our EHR system",
  "We will make clinicians available for onboarding and training",
  "We will participate in agreed clinical outcome reporting",
] as const;

export const accessRequestSchema = z.object({
  orgType: z.enum(ORG_TYPES),
  orgName: z.string().trim().min(2).max(200),
  odsCode: z.string().trim().max(32).optional().or(z.literal("")),
  region: z.enum(ICS_REGIONS),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  ehrSystems: z.array(z.enum(EHR_SYSTEMS)).min(1),
  listSize: z.enum(LIST_SIZES),
  itContact: z.string().trim().max(200).optional().or(z.literal("")),
  commitments: z.array(z.enum(ORGANISATION_COMMITMENTS)).min(1),
});

export type AccessRequestInput = z.infer<typeof accessRequestSchema>;
