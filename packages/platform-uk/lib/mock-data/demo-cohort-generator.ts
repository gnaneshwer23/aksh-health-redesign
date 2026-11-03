/**
 * Deterministic synthetic demo cohort generator (stakeholder scale).
 * Patients: P001–P026 hand fixtures + P027–P200 generated (200 total).
 * Users: role-spread @demo.akshhealth.com accounts with lab / front-desk personas.
 * Never real PII — all names / NHS numbers / ODS codes are synthetic.
 * liveEmis:false · ehrWrite:false · productionRbacEnforced stays false.
 */

import type { ClinicalProfileId, OracleRisk, Patient, ReviewQueueItem } from "./types";
import type { UserRole } from "../onboarding/roles";
import { getLongitudinalBundle } from "./longitudinal-bundles";
import {
  assertDemoTerminologyInvariants,
  attachPatientTerminology,
  codeLabItems,
  codePharmacyHitlItems,
  type DemoCodedConcept,
} from "./demo-terminology";

/** Stable tag for seed + purge. Never reuse for non-demo rows. */
export const DEMO_COHORT_ID = "demo-cohort-v2-stakeholder";

export const DEMO_COHORT_META = {
  syntheticDemo: true as const,
  removable: true as const,
  demoCohortId: DEMO_COHORT_ID,
  liveEmis: false as const,
  ehrWrite: false as const,
  productionRbacEnforced: false as const,
};

export const DEMO_COHORT_PATIENT_TARGET = 200;
export const DEMO_COHORT_CORE_PATIENT_COUNT = 26; // P001–P026 preserved in patients.ts
export const DEMO_COHORT_EXTENDED_START = 27;
export const DEMO_COHORT_EXTENDED_COUNT =
  DEMO_COHORT_PATIENT_TARGET - DEMO_COHORT_CORE_PATIENT_COUNT; // 174 → P027–P200

export const DEMO_COHORT_EMAIL_DOMAIN = "demo.akshhealth.com";

/** Password env keys (never commit values). Prefer DEMO_SEED_PASSWORD; DEMO_COHORT_PASSWORD kept for compat. */
export const DEMO_SEED_PASSWORD_ENV = "DEMO_SEED_PASSWORD";
export const DEMO_COHORT_PASSWORD_ENV = "DEMO_COHORT_PASSWORD";

/** Local-only synthetic default when neither env var is set (never use in production). */
export const DEMO_SEED_PASSWORD_LOCAL_DEFAULT = "AkshLocalSyntheticDemo1!";

export type DemoCohortSubRole =
  | "lab_operator"
  | "organisation_admin"
  | "front_desk"
  | null;

export type DemoCohortUserSpec = {
  id: string;
  email: string;
  role: UserRole;
  /** Persona under practice-manager (lab / admin / reception). */
  subRole: DemoCohortSubRole;
  fullName: string;
  practiceOds: string | null;
  onboardingComplete: true;
  emailVerified: true;
  credentialsHint: string | null;
  syntheticOnly: true;
  syntheticDemo: true;
  removable: true;
  demoCohortId: typeof DEMO_COHORT_ID;
  liveEmis: false;
  ehrWrite: false;
};

export type DemoCohortLearningSeed = {
  id: string;
  patientId: string;
  agentLabel: string;
  predictionId: string;
  predictionSummary: string;
  decision: "accept" | "edit" | "reject" | "defer";
  decisionActor: string;
  outcomeKind:
    | "care_action_completed"
    | "care_action_deferred"
    | "adverse_event_none"
    | "follow_up_scheduled"
    | "unknown";
  outcomeSummary: string;
  practiceId: string;
  linkOutcomeId: string;
  linkOutcomeKind: "care_action_completed" | "follow_up_scheduled" | "adverse_event_none";
  linkOutcomeSummary: string;
};

export type DemoCohortCareEpisodeSeed = {
  id: string;
  publicId: string;
  scopeKey: string;
  organisationId: string;
  practiceId: string;
  patientId: string;
  patientLabel: string;
  status: "in_review" | "lab_pending" | "med_review" | "follow_up" | "draft";
  pathway: string | null;
  createdBy: string;
  idempotencyKey: string;
  metadata: {
    demoCohortId: typeof DEMO_COHORT_ID;
    syntheticDemo: true;
    removable: true;
    ehrWrite: false;
    liveEmis: false;
  };
};

export type DemoCohortHitlDraftSeed = {
  id: string;
  kind: "lab" | "pharmacy";
  status: "pending_review";
  title: string;
  summary: string;
  syntheticPatientId: string;
  careEpisodeId: string | null;
  organisationId: string;
  scopeKey: string;
  items: string[];
  /** LOINC (lab) or ATC (pharmacy) curated demo codes — display items stay strings. */
  codedItems: DemoCodedConcept[];
  stagedBy: string;
  stagedAt: string;
  live: false;
  liveNhsLab: false;
  livePrescribing: false;
  liveEps: false;
  ehrWrite: false;
  hitlRequired: true;
  clinicalValidationClaim: false;
  syntheticOnly: true;
  auditTrail: {
    id: string;
    at: string;
    actor: string;
    action: "stage";
    detail: string;
    roleHint: string;
  }[];
  demoCohortId: typeof DEMO_COHORT_ID;
  removable: true;
  syntheticDemo: true;
};

/** Gender follows the first name so titles never contradict it ("Mr Aisha" was a real defect). */
const FIRST_NAME_GENDER: Record<string, "Female" | "Male" | "Non-binary"> = {
  Aisha: "Female", Benjamin: "Male", Chloe: "Female", Daniel: "Male", Elena: "Female", Farah: "Female",
  George: "Male", Hannah: "Female", Ibrahim: "Male", Jessica: "Female", Kwame: "Male", Layla: "Female",
  Marcus: "Male", Nia: "Female", Oliver: "Male", Priya: "Female", Quinn: "Non-binary", Rosa: "Female",
  Samir: "Male", Tanya: "Female", Umar: "Male", Vera: "Female", William: "Male", Yasmin: "Female",
  Zara: "Female", Amelia: "Female", Callum: "Male", Devi: "Female", Ethan: "Male", Freya: "Female",
  Gita: "Female", Harvey: "Male", Isla: "Female", Jonah: "Male",
};
const FIRST_NAMES = [
  "Aisha", "Benjamin", "Chloe", "Daniel", "Elena", "Farah", "George", "Hannah",
  "Ibrahim", "Jessica", "Kwame", "Layla", "Marcus", "Nia", "Oliver", "Priya",
  "Quinn", "Rosa", "Samir", "Tanya", "Umar", "Vera", "William", "Yasmin", "Zara",
  "Amelia", "Callum", "Devi", "Ethan", "Freya", "Gita", "Harvey", "Isla", "Jonah",
];
const SURNAMES = [
  "Ahmed", "Baker", "Chen", "Davies", "Edwards", "Foster", "Gupta", "Hughes",
  "Iqbal", "Jones", "Khan", "Lewis", "Murphy", "Ng", "Osei", "Patel", "Quinn",
  "Rahman", "Singh", "Taylor", "Uddin", "Vaughan", "Walsh", "Young", "Zimmerman",
  "Campbell", "Fraser", "MacLeod", "Owens", "Price",
];

const ICS_REGIONS = [
  "South East London",
  "West Yorkshire",
  "Birmingham & Solihull",
  "Greater Manchester",
  "North East London",
  "Surrey Heartlands",
  "Cheshire & Merseyside",
  "West Midlands",
] as const;

const IMD_QUINTILES = ["Q1", "Q2", "Q3", "Q4", "Q5"] as const;

const ORGANISATIONS = [
  "Riverside Medical Centre",
  "Oakwood Health Practice",
  "Valley View Surgery",
  "Harrogate Road GP",
  "East Leeds Family Practice",
  "The Oakfield Surgery",
  "Harrogate Medical Centre",
] as const;

const PRACTICE_ODS = ["E81001", "B82005", "RRK"] as const;

const POSTCODES = [
  "SE15", "HG1", "LS8", "BD1", "B15", "M14", "E1", "CR0", "L8", "CV1",
  "NE1", "BS1", "CF10", "EX1", "PL1", "YO1", "N4", "SW11", "W12", "NG1",
];

const PROFILE_BUNDLES: {
  profiles: ClinicalProfileId[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  riskBias: OracleRisk;
}[] = [
  {
    profiles: ["healthy"],
    conditions: [],
    medications: [],
    allergies: ["None known"],
    riskBias: "Low",
  },
  {
    profiles: ["t2d", "hypertension"],
    conditions: ["Type 2 diabetes mellitus", "Essential hypertension"],
    medications: ["Metformin 1g BD", "Ramipril 5mg OD", "Atorvastatin 20mg ON"],
    allergies: ["None known"],
    riskBias: "Medium",
  },
  {
    profiles: ["heart_failure", "high_risk_deterioration"],
    conditions: ["Heart failure with reduced ejection fraction", "CKD Stage 3"],
    medications: ["Furosemide 40mg OD", "Bisoprolol 2.5mg OD", "Ramipril 2.5mg OD"],
    allergies: ["None known"],
    riskBias: "VeryHigh",
  },
  {
    profiles: ["copd", "frailty"],
    conditions: ["COPD", "Frailty syndrome"],
    medications: ["Salbutamol inhaler PRN", "Tiotropium 18mcg OD", "Prednisolone 5mg OD"],
    allergies: ["Sulfonamides"],
    riskBias: "High",
  },
  {
    profiles: ["polypharmacy", "renal_impairment"],
    conditions: ["CKD Stage 4", "Osteoarthritis", "Gout"],
    medications: [
      "Allopurinol 100mg OD",
      "Paracetamol 1g QDS",
      "Omeprazole 20mg OD",
      "Amlodipine 5mg OD",
      "Atorvastatin 40mg ON",
      "Colecalciferol 800 IU OD",
    ],
    allergies: ["None known"],
    riskBias: "High",
  },
  {
    profiles: ["drug_allergy", "dvt_risk"],
    conditions: ["Deep vein thrombosis risk", "Asthma"],
    medications: ["Apixaban 5mg BD", "Salbutamol inhaler PRN"],
    allergies: ["Penicillin", "Aspirin"],
    riskBias: "High",
  },
  {
    profiles: ["mental_health_crisis"],
    conditions: ["Major depressive disorder", "Anxiety disorder"],
    medications: ["Sertraline 100mg OD", "Zopiclone 3.75mg ON PRN"],
    allergies: ["None known"],
    riskBias: "Medium",
  },
  {
    profiles: ["oncology", "liver_impairment"],
    conditions: ["Breast cancer: adjuvant therapy", "NAFLD"],
    medications: ["Letrozole 2.5mg OD", "Ondansetron PRN"],
    allergies: ["None known"],
    riskBias: "High",
  },
  {
    profiles: ["pregnancy"],
    conditions: ["Pregnancy — second trimester", "Gestational diabetes screening"],
    medications: ["Folic acid 400mcg OD", "Aspirin 75mg OD"],
    allergies: ["None known"],
    riskBias: "Low",
  },
  {
    profiles: ["paediatric"],
    conditions: ["Asthma — paediatric"],
    medications: ["Clenil Modulite", "Salbutamol inhaler PRN"],
    allergies: ["None known"],
    riskBias: "Low",
  },
];

/**
 * Stakeholder demo role mix.
 * Lab operators + front desk are practice-manager accounts with subRole (RBAC has no separate UserRole).
 * MDT reviewer is not a signup UserRole — not seeded as a distinct login.
 */
const ROLE_TARGETS: {
  role: UserRole;
  count: number;
  prefix: string;
  title: string;
  subRole: DemoCohortSubRole;
}[] = [
  { role: "gp", count: 50, prefix: "gp", title: "Dr", subRole: null },
  { role: "nurse", count: 50, prefix: "nurse", title: "Nurse", subRole: null },
  { role: "clinical-pharmacist", count: 50, prefix: "pharmacist", title: "Pharmacist", subRole: null },
  {
    role: "practice-manager",
    count: 50,
    prefix: "lab",
    title: "Lab",
    subRole: "lab_operator",
  },
  {
    role: "practice-manager",
    count: 30,
    prefix: "admin",
    title: "Admin",
    subRole: "organisation_admin",
  },
  {
    role: "practice-manager",
    count: 25,
    prefix: "frontdesk",
    title: "Reception",
    subRole: "front_desk",
  },
  { role: "ics-lead", count: 25, prefix: "ics", title: "Population health lead", subRole: null },
  { role: "hospital-executive", count: 25, prefix: "hospital", title: "Exec", subRole: null },
  { role: "patient", count: 50, prefix: "patient", title: "Patient", subRole: null },
  { role: "researcher", count: 20, prefix: "researcher", title: "Researcher", subRole: null },
];

export const DEMO_COHORT_USER_TARGET = ROLE_TARGETS.reduce((sum, r) => sum + r.count, 0);

/** Documented minimums for harness / launch docs. */
export const DEMO_COHORT_MIN_COUNTS = {
  patients: 200,
  gp: 50,
  nurse: 50,
  clinicalPharmacist: 50,
  labOperator: 50,
  organisationAdmin: 20,
  frontDesk: 20,
  icsLead: 20,
  hospitalExecutive: 20,
  patientAccounts: 20,
  researcher: 20,
  careEpisodes: 40,
  labHitlDrafts: 20,
  pharmacyHitlDrafts: 20,
  reviewQueueExtras: 30,
} as const;

const CREDENTIAL_HINTS: Partial<Record<UserRole, (n: number) => string>> = {
  gp: (n) => `professional register ${String(1000000 + n).padStart(7, "0")} (synthetic)`,
  nurse: (n) => `NMC ${String(10 + (n % 90)).padStart(2, "0")}A${String(1000 + n).slice(-4)}B (synthetic)`,
  "clinical-pharmacist": (n) => `pharmacy register ${String(2000000 + n).padStart(7, "0")} (synthetic)`,
};

function padPatientId(n: number): string {
  return `P${String(n).padStart(3, "0")}`;
}

function syntheticNhsNumber(index: number): string {
  // Deterministic 10-digit fake NHS-shaped number (not a real Modulus-11 check).
  const raw = String(7000000000 + index * 137 + 41);
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 10)}`;
}

function riskScore(bias: OracleRisk, salt: number): { score: number; risk: OracleRisk } {
  const bands: Record<OracleRisk, [number, number]> = {
    Low: [5, 28],
    Medium: [29, 55],
    High: [56, 78],
    VeryHigh: [79, 95],
  };
  const [lo, hi] = bands[bias];
  const score = lo + ((salt * 17) % (hi - lo + 1));
  return { score, risk: bias };
}

function ageForProfile(profiles: ClinicalProfileId[], salt: number): { age: number; dob: string } {
  let age: number;
  if (profiles.includes("paediatric")) age = 4 + (salt % 14);
  else if (profiles.includes("pregnancy")) age = 22 + (salt % 18);
  else if (profiles.includes("frailty")) age = 78 + (salt % 12);
  else age = 28 + (salt % 50);

  const year = 2026 - age;
  const month = String(1 + (salt % 12)).padStart(2, "0");
  const day = String(1 + (salt % 27)).padStart(2, "0");
  return { age, dob: `${year}-${month}-${day}` };
}

function firstNameFor(i: number, profiles: ClinicalProfileId[]): string {
  for (let step = 0; step < FIRST_NAMES.length; step++) {
    const name = FIRST_NAMES[(i + step) % FIRST_NAMES.length]!;
    if (!profiles.includes("pregnancy") || FIRST_NAME_GENDER[name] === "Female") return name;
  }
  return FIRST_NAMES[i % FIRST_NAMES.length]!;
}

function titleFor(gender: string, age: number, i: number): string {
  if (age < 16) return gender === "Male" ? "Master" : gender === "Female" ? "Miss" : "Mx";
  if (gender === "Male") return "Mr";
  if (gender === "Female") return i % 3 === 0 ? "Ms" : "Mrs";
  return "Mx";
}

/** Distinct 10-minute slots across morning and afternoon surgery, clear of the hand fixtures' :00/:30 slots. */
function appointmentSlot(ordinal: number): string {
  const minutes = [10, 20, 40, 50];
  const hours = [8, 9, 10, 11, 14, 15, 16, 17];
  const hour = hours[Math.floor(ordinal / minutes.length) % hours.length]!;
  const minute = minutes[ordinal % minutes.length]!;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Extended synthetic patients P027–P200. P001–P026 remain hand-authored fixtures.
 */
export function generateExtendedDemoPatients(
  options: { startId?: number; count?: number } = {}
): Patient[] {
  const startId = options.startId ?? DEMO_COHORT_EXTENDED_START;
  const count = options.count ?? DEMO_COHORT_EXTENDED_COUNT;
  const out: Patient[] = [];

  for (let i = 0; i < count; i++) {
    const idNum = startId + i;
    const bundle = PROFILE_BUNDLES[i % PROFILE_BUNDLES.length]!;
    const { age, dob } = ageForProfile(bundle.profiles, idNum);
    const { score, risk } = riskScore(bundle.riskBias, idNum);
    const first = firstNameFor(i, bundle.profiles);
    const surname = SURNAMES[(i * 3) % SURNAMES.length]!;
    const gender = FIRST_NAME_GENDER[first] ?? "Non-binary";
    const title = titleFor(gender, age, i);
    const imd = IMD_QUINTILES[i % IMD_QUINTILES.length]!;
    const ics = ICS_REGIONS[i % ICS_REGIONS.length]!;
    const org = ORGANISATIONS[i % ORGANISATIONS.length]!;
    const admissionRisk = Math.min(
      85,
      Math.max(1, Math.round(score * 0.7 + (i % 7) - 3))
    );
    const equity = imd === "Q1" || imd === "Q2";

    const patient: Patient = attachPatientTerminology({
      id: padPatientId(idNum),
      name: `${title} ${first} ${surname}`,
      nhsNumber: syntheticNhsNumber(idNum),
      dob,
      age,
      gender,
      postcode: POSTCODES[i % POSTCODES.length]!,
      oracleScore: score,
      oracleRisk: risk,
      activeConditions: [...bundle.conditions],
      activeMedications: [...bundle.medications],
      allergies: [...bundle.allergies],
      lastEncounterDate: `2026-0${1 + (i % 6)}-${String(10 + (i % 18)).padStart(2, "0")}`,
      nextAppointmentDate: `2026-0${7 + (i % 2)}-${String(12 + (i % 16)).padStart(2, "0")}`,
      openAiItems: i % 5 === 0 ? 2 : i % 3,
      carePathways: bundle.profiles.includes("heart_failure")
        ? ["CP002"]
        : bundle.profiles.includes("t2d")
          ? ["CP001"]
          : [],
      digitalTwinPrediction: {
        admissionRisk14Days: admissionRisk,
        deteriorationSignals:
          risk === "Low"
            ? []
            : [
                `Synthetic signal ${idNum}: risk band ${risk}`,
                equity ? "IMD deprivation marker (synthetic)" : "Routine monitoring due",
              ].filter(Boolean),
        recommendedActions:
          risk === "VeryHigh" || risk === "High"
            ? ["Same-week clinical review (synthetic)", "Medication adherence check"]
            : ["Routine follow-up"],
      },
      flags: [
        ...(risk === "VeryHigh" || risk === "High" ? ["GUARDIAN"] : []),
        ...(risk === "VeryHigh" ? ["URGENT"] : []),
        ...(equity ? ["EQUITY"] : []),
      ],
      clinicalProfiles: [...bundle.profiles],
      supervisingGp: i % 2 === 0 ? "Dr Morgan" : "Dr Patel",
      organisation: org,
      imdQuintile: imd,
      icsRegion: ics,
      equityFlag: equity || undefined,
      qaNotes: `Demo cohort synthetic patient ${padPatientId(idNum)} · ${DEMO_COHORT_ID} · liveEmis:false · IMD ${imd} · ${ics}`,
    });

    const long = getLongitudinalBundle(patient.id);
    if (long) {
      const hba1cLatest = [...long.labs].reverse().find((l) => l.name === "HbA1c");
      if (hba1cLatest && bundle.profiles.includes("t2d")) {
        patient.digitalTwinPrediction = {
          ...patient.digitalTwinPrediction,
          deteriorationSignals: [
            ...patient.digitalTwinPrediction.deteriorationSignals.filter((s) => !s.startsWith("Synthetic signal")),
            `HbA1c series latest ${hba1cLatest.value}% (synthetic)`,
            ...(long.missingInformation.includes("ADHERENCE")
              ? ["Adherence not recorded (synthetic gap)"]
              : []),
          ].slice(0, 4),
        };
      }
      if (long.draftSeed) {
        patient.openAiItems = Math.max(patient.openAiItems, 1);
        patient.qaNotes = `${patient.qaNotes} · draftSeed:${long.draftSeed.kind}`;
      }
      const egfr = long.labs.find((l) => l.name === "eGFR");
      if (egfr && !patient.vitals) {
        patient.lastObsTime = egfr.recordedAt.slice(0, 10);
      }
    }

    if (i % 4 === 0) {
      patient.appointmentTime = appointmentSlot(i / 4);
      patient.room = `Consulting Room ${(i % 4) + 1}`;
      patient.lastObsTime = `2026-07-${String(10 + (i % 5)).padStart(2, "0")} ${patient.appointmentTime}`;
      patient.vitals = {
        bloodPressure: `${110 + (i % 30)}/${70 + (i % 15)}`,
        heartRate: 60 + (i % 40),
        temperature: 36.4 + (i % 5) * 0.1,
        spo2: risk === "VeryHigh" ? 92 + (i % 4) : 96 + (i % 3),
        respiratoryRate: 14 + (i % 8),
        recordedAt: patient.lastObsTime,
        recordedBy: "Practice Nurse Adeyemi",
      };
    }

    out.push(patient);
  }

  return out;
}

export function generateDemoCohortUsers(
  options: { count?: number } = {}
): DemoCohortUserSpec[] {
  const target = options.count ?? DEMO_COHORT_USER_TARGET;
  const planned = ROLE_TARGETS.reduce((sum, r) => sum + r.count, 0);
  if (planned !== DEMO_COHORT_USER_TARGET) {
    throw new Error(`Role targets sum to ${planned}, expected ${DEMO_COHORT_USER_TARGET}`);
  }

  const users: DemoCohortUserSpec[] = [];
  let seq = 0;

  for (const bucket of ROLE_TARGETS) {
    for (let n = 1; n <= bucket.count; n++) {
      if (users.length >= target) break;
      seq += 1;
      const email = `${bucket.prefix}${String(n).padStart(2, "0")}@${DEMO_COHORT_EMAIL_DOMAIN}`;
      const first = FIRST_NAMES[(seq * 5) % FIRST_NAMES.length]!;
      const surname = SURNAMES[(seq * 7) % SURNAMES.length]!;
      const fullName =
        bucket.role === "patient"
          ? `${first} ${surname}`
          : `${bucket.title} ${first} ${surname}`;
      const practiceOds =
        bucket.role === "patient" || bucket.role === "researcher"
          ? null
          : PRACTICE_ODS[seq % PRACTICE_ODS.length]!;

      users.push({
        id: `usr_demo_cohort_${String(seq).padStart(4, "0")}`,
        email,
        role: bucket.role,
        subRole: bucket.subRole,
        fullName,
        practiceOds,
        onboardingComplete: true,
        emailVerified: true,
        credentialsHint: CREDENTIAL_HINTS[bucket.role]?.(seq) ?? null,
        syntheticOnly: true,
        syntheticDemo: true,
        removable: true,
        demoCohortId: DEMO_COHORT_ID,
        liveEmis: false,
        ehrWrite: false,
      });
    }
  }

  return users.slice(0, target);
}

/** Modest care-action + linked outcome pairs for outcomes / learning demos. */
export function generateDemoCohortLearningSeeds(count = 40): DemoCohortLearningSeed[] {
  const patients = generateExtendedDemoPatients();
  const actors = ["Dr Morgan", "Nurse Davies", "Pharmacist Lee", "Dr Patel", "Lab Adeyemi"];
  const agents = ["GUARDIAN", "HORIZON", "SYNTHESIS", "PATHWAY"];
  const seeds: DemoCohortLearningSeed[] = [];

  for (let i = 0; i < count; i++) {
    const patient = patients[i % patients.length]!;
    const id = `learn-demo-cohort-${String(i + 1).padStart(3, "0")}`;
    seeds.push({
      id,
      patientId: patient.id,
      agentLabel: agents[i % agents.length]!,
      predictionId: `pred-demo-cohort-${String(i + 1).padStart(3, "0")}`,
      predictionSummary: `Synthetic ${agents[i % agents.length]} draft for ${patient.id}`,
      decision: (["accept", "edit", "accept", "defer"] as const)[i % 4]!,
      decisionActor: actors[i % actors.length]!,
      outcomeKind: "unknown",
      outcomeSummary: "Awaiting eventual outcome (synthetic)",
      practiceId: "practice-demo",
      linkOutcomeId: `${id}-outcome`,
      linkOutcomeKind: (["care_action_completed", "follow_up_scheduled", "adverse_event_none"] as const)[
        i % 3
      ]!,
      linkOutcomeSummary: `Eventual synthetic outcome for ${patient.id} · autoRetrain:false · liveEmis:false · ${DEMO_COHORT_ID}`,
    });
  }

  return seeds;
}

/** Care episodes linked to a subset of patients for populated worklists. */
export function generateDemoCohortCareEpisodes(count = 48): DemoCohortCareEpisodeSeed[] {
  const patients = generateExtendedDemoPatients();
  const statuses = ["in_review", "lab_pending", "med_review", "follow_up", "draft"] as const;
  const out: DemoCohortCareEpisodeSeed[] = [];
  for (let i = 0; i < count; i++) {
    const patient = patients[i % patients.length]!;
    const n = String(i + 1).padStart(3, "0");
    out.push({
      id: `ce-demo-cohort-${n}`,
      publicId: `CE-DEMO-${n}`,
      scopeKey: "shared",
      organisationId: "practice-demo",
      practiceId: "practice-demo",
      patientId: patient.id,
      patientLabel: patient.name,
      status: statuses[i % statuses.length]!,
      pathway: patient.carePathways[0] ?? null,
      createdBy: "seed:demo-cohort",
      idempotencyKey: `demo-cohort-ce-${n}`,
      metadata: {
        demoCohortId: DEMO_COHORT_ID,
        syntheticDemo: true,
        removable: true,
        ehrWrite: false,
        liveEmis: false,
      },
    });
  }
  return out;
}

/** Lab + pharmacy HITL drafts (pending review) for facilitator role switching. */
export function generateDemoCohortHitlDrafts(options?: {
  labCount?: number;
  pharmacyCount?: number;
}): DemoCohortHitlDraftSeed[] {
  const labCount = options?.labCount ?? 24;
  const pharmacyCount = options?.pharmacyCount ?? 24;
  const patients = generateExtendedDemoPatients();
  const episodes = generateDemoCohortCareEpisodes();
  const at = "2026-07-20T09:15:00.000Z";
  const out: DemoCohortHitlDraftSeed[] = [];

  for (let i = 0; i < labCount; i++) {
    const patient = patients[(i * 2) % patients.length]!;
    const episode = episodes[i % episodes.length]!;
    const n = String(i + 1).padStart(3, "0");
    const items = i % 2 === 0 ? ["HbA1c", "U&E"] : ["Full blood count"];
    out.push({
      id: `lph-lab-demo-cohort-${n}`,
      kind: "lab",
      status: "pending_review",
      title: `Lab draft · ${items.length} investigation(s)`,
      summary: `GP-staged lab investigations pending lab-role HITL: ${items.join(", ")}`,
      syntheticPatientId: patient.id,
      careEpisodeId: episode.id,
      organisationId: "practice-demo",
      scopeKey: "shared",
      items,
      codedItems: codeLabItems(items),
      stagedBy: "gp01@demo.akshhealth.com",
      stagedAt: at,
      live: false,
      liveNhsLab: false,
      livePrescribing: false,
      liveEps: false,
      ehrWrite: false,
      hitlRequired: true,
      clinicalValidationClaim: false,
      syntheticOnly: true,
      auditTrail: [
        {
          id: `lph-audit-demo-lab-${n}`,
          at,
          actor: "gp01@demo.akshhealth.com",
          action: "stage",
          detail: `Demo cohort lab draft staged · ${DEMO_COHORT_ID} · ehrWrite:false · LOINC curated`,
          roleHint: "gp",
        },
      ],
      demoCohortId: DEMO_COHORT_ID,
      removable: true,
      syntheticDemo: true,
    });
  }

  for (let i = 0; i < pharmacyCount; i++) {
    const patient = patients[(i * 3 + 1) % patients.length]!;
    const episode = episodes[(i + 5) % episodes.length]!;
    const n = String(i + 1).padStart(3, "0");
    const items =
      i % 2 === 0
        ? ["Metformin adherence check", "Statin counselling"]
        : ["Apixaban counselling (synthetic)"];
    out.push({
      id: `lph-pharmacy-demo-cohort-${n}`,
      kind: "pharmacy",
      status: "pending_review",
      title: `Pharmacy draft · ${items.length} item(s)`,
      summary: `GP-staged pharmacy / adherence draft pending pharmacist HITL: ${items.join(", ")}`,
      syntheticPatientId: patient.id,
      careEpisodeId: episode.id,
      organisationId: "practice-demo",
      scopeKey: "shared",
      items,
      codedItems: codePharmacyHitlItems(items),
      stagedBy: "gp02@demo.akshhealth.com",
      stagedAt: at,
      live: false,
      liveNhsLab: false,
      livePrescribing: false,
      liveEps: false,
      ehrWrite: false,
      hitlRequired: true,
      clinicalValidationClaim: false,
      syntheticOnly: true,
      auditTrail: [
        {
          id: `lph-audit-demo-pharm-${n}`,
          at,
          actor: "gp02@demo.akshhealth.com",
          action: "stage",
          detail: `Demo cohort pharmacy draft staged · ${DEMO_COHORT_ID} · ehrWrite:false · ATC curated`,
          roleHint: "gp",
        },
      ],
      demoCohortId: DEMO_COHORT_ID,
      removable: true,
      syntheticDemo: true,
    });
  }

  return out;
}

/** Extra review-queue rows so GP/nurse worklists are not empty beyond hand fixtures. */
export function generateDemoCohortReviewQueueItems(count = 36): ReviewQueueItem[] {
  const patients = generateExtendedDemoPatients().filter(
    (p) => p.oracleRisk === "High" || p.oracleRisk === "VeryHigh" || p.flags.includes("GUARDIAN")
  );
  const agents = ["GUARDIAN", "SYNTHESIS", "ORACLE", "DrASSIST"] as const;
  const out: ReviewQueueItem[] = [];
  for (let i = 0; i < count; i++) {
    const patient = patients[i % Math.max(patients.length, 1)] ?? generateExtendedDemoPatients()[i]!;
    const n = String(i + 1).padStart(3, "0");
    const agent = agents[i % agents.length]!;
    out.push({
      id: `RQ-demo-cohort-${n}`,
      patientId: patient.id,
      patientName: patient.name,
      patientNhsNumber: patient.nhsNumber,
      agentType: agent,
      title: `Synthetic ${agent} draft · ${patient.id}`,
      content: `Demo cohort (${DEMO_COHORT_ID}) draft for ${patient.name}. liveEmis:false · ehrWrite:false · removable before launch. ${
        patient.digitalTwinPrediction.deteriorationSignals[0] ?? "Routine synthetic review"
      }`,
      confidenceScore: 70 + (i % 25),
      evidenceSources: [
        {
          resourceType: "Patient",
          resourceId: patient.id,
          summary: "Synthetic demo cohort chart",
        },
      ],
      createdAt: `2026-07-20T${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 3) % 60).padStart(2, "0")}:00Z`,
      priority: patient.oracleRisk === "VeryHigh" ? "Urgent" : patient.oracleRisk === "High" ? "High" : "Normal",
      status: "Pending",
      editedContent: null,
      rejectionReason: null,
      auditEventId: null,
    });
  }
  return out;
}

export function summarizeDemoCohortUsers(users: DemoCohortUserSpec[]) {
  const byRole: Record<string, number> = {};
  const bySubRole: Record<string, number> = {};
  const byEmailPrefix: Record<string, number> = {};
  for (const u of users) {
    byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    const sub = u.subRole ?? "(none)";
    bySubRole[sub] = (bySubRole[sub] ?? 0) + 1;
    const prefix = u.email.split("@")[0]?.replace(/\d+$/, "") ?? "?";
    byEmailPrefix[prefix] = (byEmailPrefix[prefix] ?? 0) + 1;
  }
  return {
    total: users.length,
    byRole,
    bySubRole,
    byEmailPrefix,
    rolesRepresented: Object.keys(byRole).sort(),
    emailDomain: DEMO_COHORT_EMAIL_DOMAIN,
    ...DEMO_COHORT_META,
  };
}

/** True when a row id / email / metadata belongs to the removable demo cohort. */
export function isDemoCohortTagged(value: {
  id?: string | null;
  email?: string | null;
  demoCohortId?: string | null;
  metadata?: { demoCohortId?: string | null } | null;
}): boolean {
  if (value.demoCohortId === DEMO_COHORT_ID) return true;
  if (value.metadata?.demoCohortId === DEMO_COHORT_ID) return true;
  if (value.email?.toLowerCase().endsWith(`@${DEMO_COHORT_EMAIL_DOMAIN}`)) return true;
  const id = value.id ?? "";
  return (
    id.startsWith("ce-demo-cohort-") ||
    id.startsWith("lph-lab-demo-cohort-") ||
    id.startsWith("lph-pharmacy-demo-cohort-") ||
    id.startsWith("RQ-demo-cohort-") ||
    id.startsWith("learn-demo-cohort-") ||
    id.startsWith("usr_demo_cohort_")
  );
}

export function purgeDemoCohortTaggedRows<T extends { id: string }>(rows: T[]): {
  retained: T[];
  purged: T[];
} {
  const retained: T[] = [];
  const purged: T[] = [];
  for (const row of rows) {
    if (isDemoCohortTagged(row)) purged.push(row);
    else retained.push(row);
  }
  return { retained, purged };
}

export function assertDemoCohortGeneratorInvariants() {
  const patients = generateExtendedDemoPatients();
  const users = generateDemoCohortUsers();
  const totalPatients = DEMO_COHORT_CORE_PATIENT_COUNT + patients.length;
  const episodes = generateDemoCohortCareEpisodes();
  const hitl = generateDemoCohortHitlDrafts();
  const queue = generateDemoCohortReviewQueueItems();

  if (patients.length !== DEMO_COHORT_EXTENDED_COUNT) {
    throw new Error(`Expected ${DEMO_COHORT_EXTENDED_COUNT} extended patients, got ${patients.length}`);
  }
  if (totalPatients !== DEMO_COHORT_PATIENT_TARGET) {
    throw new Error(`Expected ${DEMO_COHORT_PATIENT_TARGET} total patients, got ${totalPatients}`);
  }
  if (users.length !== DEMO_COHORT_USER_TARGET) {
    throw new Error(`Expected ${DEMO_COHORT_USER_TARGET} users, got ${users.length}`);
  }
  if (patients[0]?.id !== "P027" || patients[patients.length - 1]?.id !== "P200") {
    throw new Error("Extended patient id range must be P027–P200");
  }
  const summary = summarizeDemoCohortUsers(users);
  if (summary.rolesRepresented.length < 8) {
    throw new Error(`Expected all 8 roles, got ${summary.rolesRepresented.join(",")}`);
  }
  if ((summary.byEmailPrefix.gp ?? 0) < DEMO_COHORT_MIN_COUNTS.gp) {
    throw new Error(`Expected ≥${DEMO_COHORT_MIN_COUNTS.gp} GPs`);
  }
  if ((summary.byEmailPrefix.nurse ?? 0) < DEMO_COHORT_MIN_COUNTS.nurse) {
    throw new Error(`Expected ≥${DEMO_COHORT_MIN_COUNTS.nurse} nurses`);
  }
  if ((summary.byEmailPrefix.pharmacist ?? 0) < DEMO_COHORT_MIN_COUNTS.clinicalPharmacist) {
    throw new Error(`Expected ≥${DEMO_COHORT_MIN_COUNTS.clinicalPharmacist} pharmacists`);
  }
  if ((summary.bySubRole.lab_operator ?? 0) < DEMO_COHORT_MIN_COUNTS.labOperator) {
    throw new Error(`Expected ≥${DEMO_COHORT_MIN_COUNTS.labOperator} lab operators`);
  }
  if (episodes.length < DEMO_COHORT_MIN_COUNTS.careEpisodes) {
    throw new Error(`Expected ≥${DEMO_COHORT_MIN_COUNTS.careEpisodes} care episodes`);
  }
  if (hitl.filter((d) => d.kind === "lab").length < DEMO_COHORT_MIN_COUNTS.labHitlDrafts) {
    throw new Error("Insufficient lab HITL drafts");
  }
  if (hitl.filter((d) => d.kind === "pharmacy").length < DEMO_COHORT_MIN_COUNTS.pharmacyHitlDrafts) {
    throw new Error("Insufficient pharmacy HITL drafts");
  }
  if (queue.length < DEMO_COHORT_MIN_COUNTS.reviewQueueExtras) {
    throw new Error("Insufficient review-queue extras");
  }
  const imdSet = new Set(patients.map((p) => p.imdQuintile));
  if (imdSet.size < 5) {
    throw new Error("Expected IMD quintile diversity across Q1–Q5");
  }

  const terminology = assertDemoTerminologyInvariants();
  const codedPatients = patients.filter(
    (p) => (p.codedConditions?.length ?? 0) > 0 || (p.codedMedications?.length ?? 0) > 0
  );
  if (codedPatients.length < 100) {
    throw new Error(`Expected ≥100 patients with SNOMED/ATC coding, got ${codedPatients.length}`);
  }
  const labCoded = hitl.filter((d) => d.kind === "lab" && d.codedItems.length > 0);
  const pharmCoded = hitl.filter((d) => d.kind === "pharmacy" && d.codedItems.length > 0);
  if (labCoded.length < DEMO_COHORT_MIN_COUNTS.labHitlDrafts) {
    throw new Error("Lab HITL drafts missing LOINC codedItems");
  }
  if (pharmCoded.length < DEMO_COHORT_MIN_COUNTS.pharmacyHitlDrafts) {
    throw new Error("Pharmacy HITL drafts missing ATC codedItems");
  }

  return {
    patients: totalPatients,
    users: users.length,
    byRole: summary.byRole,
    bySubRole: summary.bySubRole,
    byEmailPrefix: summary.byEmailPrefix,
    careEpisodes: episodes.length,
    hitlDrafts: hitl.length,
    reviewQueueExtras: queue.length,
    demoCohortId: DEMO_COHORT_ID,
    terminology,
    patientsWithCoding: codedPatients.length,
  };
}
