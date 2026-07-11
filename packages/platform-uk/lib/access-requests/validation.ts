import { z } from "zod";

export const ORG_TYPES = [
  "NHS ICS",
  "GP Network / PCN",
  "NHS Hospital Trust",
  "Private Healthcare Provider",
] as const;

export const ICS_REGIONS = [
  "London",
  "South East",
  "South West",
  "Midlands",
  "East of England",
  "North West",
  "North East & Yorkshire",
] as const;

export const EHR_SYSTEMS = ["EMIS Web", "SystmOne", "Epic", "Oracle Health", "Other"] as const;

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
  odsCode: z.string().trim().min(1).max(32),
  region: z.enum(ICS_REGIONS),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  ehrSystems: z.array(z.enum(EHR_SYSTEMS)).min(1),
  listSize: z.enum(LIST_SIZES),
  itContact: z.string().trim().max(200).optional().or(z.literal("")),
  commitments: z.array(z.enum(ORGANISATION_COMMITMENTS)).min(1),
});

export type AccessRequestInput = z.infer<typeof accessRequestSchema>;
