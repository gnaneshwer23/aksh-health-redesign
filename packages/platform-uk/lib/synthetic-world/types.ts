/**
 * Synthetic world: a deterministic, multi-market diabetes care network for end-to-end testing.
 * Every person, organisation and identifier is fictional. Aksh is a general diabetes platform
 * (any clinician, any patient), so markets are configuration, not hard-coded assumptions.
 */

export type MarketCode = "GB" | "IN" | "US" | "AE";

export type Market = {
  code: MarketCode;
  name: string;
  currency: string;
  /** Fictional identifier label used for synthetic patient IDs in this market. */
  patientIdLabel: string;
  emergencyNumber: string;
  urgentAdviceLine: string | null;
  crisisLine: string;
  regulator: string;
  dataProtection: string;
  hba1cUnitPrimary: "mmol/mol" | "%";
  timezone: string;
};

export type OrgKind =
  | "primary_care_clinic"
  | "diabetes_centre"
  | "hospital"
  | "community_pharmacy"
  | "laboratory"
  | "payer"
  | "research_institute"
  | "device_partner";

export type Organisation = {
  id: string;
  kind: OrgKind;
  name: string;
  market: MarketCode;
  city: string;
  /** Synthetic contact; never a real number or domain. */
  email: string;
  servicesOffered: string[];
};

export type ProfessionalRole =
  | "family_physician"
  | "endocrinologist"
  | "diabetes_specialist_nurse"
  | "diabetes_educator"
  | "practice_nurse"
  | "clinical_pharmacist"
  | "community_pharmacist"
  | "dietitian"
  | "podiatrist"
  | "eye_specialist"
  | "nephrologist"
  | "cardiologist"
  | "psychologist"
  | "care_coordinator"
  | "practice_manager";

/** Maps to the platform's onboarding role ids (lib/onboarding/roles.ts). */
export type PlatformRole = "gp" | "nurse" | "clinical-pharmacist" | "practice-manager";

export type Professional = {
  id: string;
  title: string;
  givenName: string;
  familyName: string;
  role: ProfessionalRole;
  roleLabel: string;
  platformRole: PlatformRole;
  organisationId: string;
  market: MarketCode;
  /** Fictional registration number; format looks plausible, never valid. */
  registration: string;
  email: string;
  languages: string[];
  caseload: number;
};

export type DiabetesType = "type_2" | "type_1" | "prediabetes" | "gestational" | "lada" | "mody";

export type LabPoint = { date: string; hba1cMmolMol: number; hba1cPercent: number };

export type Medication = { name: string; class: string; dose: string; since: string };

export type CgmSummary = {
  device: string;
  timeInRangePct: number;
  timeBelowRangePct: number;
  timeAboveRangePct: number;
  meanGlucoseMmolL: number;
  wearPct: number;
  lastSync: string;
};

export type WorldPatient = {
  id: string;
  marketId: string;
  title: string;
  givenName: string;
  familyName: string;
  sex: "female" | "male";
  dob: string;
  age: number;
  market: MarketCode;
  city: string;
  language: string;
  phone: string;
  contactPreference: "phone" | "sms" | "app" | "email" | "whatsapp";
  diabetesType: DiabetesType;
  diagnosedYear: number;
  hba1c: LabPoint[];
  medications: Medication[];
  comorbidities: string[];
  bmi: number;
  bloodPressure: { systolic: number; diastolic: number };
  egfr: number;
  uacr: number;
  ldl: number;
  lastEyeScreening: string | null;
  footRisk: "low" | "moderate" | "high";
  hypoEvents90d: number;
  cgm: CgmSummary | null;
  careTeam: { role: ProfessionalRole; professionalId: string }[];
  primaryOrganisationId: string;
  pharmacyId: string;
  payerId: string;
  appUser: boolean;
  risk: { score: number; band: "Low" | "Medium" | "High" | "VeryHigh"; drivers: string[] };
  openCareGaps: string[];
  nextAppointment: string | null;
};

export type SyntheticWorld = {
  seed: number;
  generatedFor: string;
  markets: Market[];
  organisations: Organisation[];
  professionals: Professional[];
  patients: WorldPatient[];
  honesty: { synthetic: true; realPatientData: false; realOrganisations: false };
};
