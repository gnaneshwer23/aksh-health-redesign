/**
 * Deterministic synthetic demo cohort generator.
 * Produces extended patients (P027–P100) and 100 role-spread users.
 * Never real PII — all names / NHS numbers / ODS codes are synthetic.
 * liveEmis:false always for any seeded learning / outcomes.
 */

import type { ClinicalProfileId, OracleRisk, Patient } from "./types";
import type { UserRole } from "../onboarding/roles";

export const DEMO_COHORT_PATIENT_TARGET = 100;
export const DEMO_COHORT_USER_TARGET = 100;
export const DEMO_COHORT_CORE_PATIENT_COUNT = 26; // P001–P026 preserved in patients.ts
export const DEMO_COHORT_EXTENDED_START = 27;
export const DEMO_COHORT_EXTENDED_COUNT =
  DEMO_COHORT_PATIENT_TARGET - DEMO_COHORT_CORE_PATIENT_COUNT;

export const DEMO_COHORT_EMAIL_DOMAIN = "demo.akshhealth.com";

/** Shared synthetic password for @demo.akshhealth.com cohort only — not a production secret. */
export const DEMO_COHORT_DEFAULT_PASSWORD = "AkshDemoCohort!2026";

export type DemoCohortUserSpec = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  practiceOds: string | null;
  onboardingComplete: true;
  emailVerified: true;
  credentialsHint: string | null;
  syntheticOnly: true;
  liveEmis: false;
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

const TITLES = ["Mr", "Mrs", "Ms", "Mx"] as const;
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

const GENDERS = ["Female", "Male", "Non-binary"] as const;

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

const ROLE_TARGETS: { role: UserRole; count: number; prefix: string; title: string }[] = [
  { role: "gp", count: 20, prefix: "gp", title: "Dr" },
  { role: "nurse", count: 15, prefix: "nurse", title: "Nurse" },
  { role: "clinical-pharmacist", count: 12, prefix: "pharmacist", title: "Pharmacist" },
  { role: "practice-manager", count: 12, prefix: "admin", title: "Admin" },
  { role: "ics-lead", count: 10, prefix: "ics", title: "ICS Lead" },
  { role: "hospital-executive", count: 10, prefix: "hospital", title: "Exec" },
  { role: "patient", count: 15, prefix: "patient", title: "Patient" },
  { role: "researcher", count: 6, prefix: "researcher", title: "Researcher" },
];

const CREDENTIAL_HINTS: Partial<Record<UserRole, (n: number) => string>> = {
  gp: (n) => `GMC ${String(1000000 + n).padStart(7, "0")} (synthetic)`,
  nurse: (n) => `NMC ${String(10 + (n % 90)).padStart(2, "0")}A${String(1000 + n).slice(-4)}B (synthetic)`,
  "clinical-pharmacist": (n) => `GPhC ${String(2000000 + n).padStart(7, "0")} (synthetic)`,
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

function genderForIndex(i: number, profiles: ClinicalProfileId[]): string {
  if (profiles.includes("pregnancy")) return "Female";
  return GENDERS[i % GENDERS.length]!;
}

/**
 * Extended synthetic patients P027–P100. P001–P026 remain hand-authored fixtures.
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
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const surname = SURNAMES[(i * 3) % SURNAMES.length]!;
    const title =
      bundle.profiles.includes("paediatric")
        ? age < 16
          ? "Master"
          : "Ms"
        : TITLES[i % TITLES.length]!;
    const imd = IMD_QUINTILES[i % IMD_QUINTILES.length]!;
    const ics = ICS_REGIONS[i % ICS_REGIONS.length]!;
    const org = ORGANISATIONS[i % ORGANISATIONS.length]!;
    const admissionRisk = Math.min(
      85,
      Math.max(1, Math.round(score * 0.7 + (i % 7) - 3))
    );
    const equity = imd === "Q1" || imd === "Q2";

    const patient: Patient = {
      id: padPatientId(idNum),
      name: `${title} ${first} ${surname}`,
      nhsNumber: syntheticNhsNumber(idNum),
      dob,
      age,
      gender: genderForIndex(i, bundle.profiles),
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
      qaNotes: `Demo cohort synthetic patient ${padPatientId(idNum)} · liveEmis:false · IMD ${imd} · ${ics}`,
    };

    if (i % 4 === 0) {
      patient.appointmentTime = `${String(9 + (i % 8)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`;
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
        id: `usr_demo_cohort_${String(seq).padStart(3, "0")}`,
        email,
        role: bucket.role,
        fullName,
        practiceOds,
        onboardingComplete: true,
        emailVerified: true,
        credentialsHint: CREDENTIAL_HINTS[bucket.role]?.(seq) ?? null,
        syntheticOnly: true,
        liveEmis: false,
      });
    }
  }

  return users.slice(0, target);
}

/** Modest care-action + linked outcome pairs for outcomes / learning demos. */
export function generateDemoCohortLearningSeeds(count = 20): DemoCohortLearningSeed[] {
  const patients = generateExtendedDemoPatients();
  const actors = ["Dr Morgan", "Nurse Davies", "Pharmacist Lee", "Dr Patel"];
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
      linkOutcomeSummary: `Eventual synthetic outcome for ${patient.id} · autoRetrain:false · liveEmis:false`,
    });
  }

  return seeds;
}

export function summarizeDemoCohortUsers(users: DemoCohortUserSpec[]) {
  const byRole: Record<string, number> = {};
  for (const u of users) {
    byRole[u.role] = (byRole[u.role] ?? 0) + 1;
  }
  return {
    total: users.length,
    byRole,
    rolesRepresented: Object.keys(byRole).sort(),
    emailDomain: DEMO_COHORT_EMAIL_DOMAIN,
  };
}

export function assertDemoCohortGeneratorInvariants() {
  const patients = generateExtendedDemoPatients();
  const users = generateDemoCohortUsers();
  const totalPatients = DEMO_COHORT_CORE_PATIENT_COUNT + patients.length;

  if (patients.length !== DEMO_COHORT_EXTENDED_COUNT) {
    throw new Error(`Expected ${DEMO_COHORT_EXTENDED_COUNT} extended patients, got ${patients.length}`);
  }
  if (totalPatients !== DEMO_COHORT_PATIENT_TARGET) {
    throw new Error(`Expected ${DEMO_COHORT_PATIENT_TARGET} total patients, got ${totalPatients}`);
  }
  if (users.length !== DEMO_COHORT_USER_TARGET) {
    throw new Error(`Expected ${DEMO_COHORT_USER_TARGET} users, got ${users.length}`);
  }
  if (patients[0]?.id !== "P027" || patients[patients.length - 1]?.id !== "P100") {
    throw new Error("Extended patient id range must be P027–P100");
  }
  const summary = summarizeDemoCohortUsers(users);
  if (summary.rolesRepresented.length < 8) {
    throw new Error(`Expected all 8 roles, got ${summary.rolesRepresented.join(",")}`);
  }
  const imdSet = new Set(patients.map((p) => p.imdQuintile));
  if (imdSet.size < 5) {
    throw new Error("Expected IMD quintile diversity across Q1–Q5");
  }
  return { patients: totalPatients, users: users.length, byRole: summary.byRole };
}
