/**
 * Deterministic synthetic healthcare ecosystem generator for Aksh E2E validation.
 * Produces cohorts A–H, longitudinal observations, labs, pharmacies, care teams.
 */

import {
  FLAGSHIP_CANONICAL_PATIENT_ID,
  FLAGSHIP_GENERATOR_COHORT,
  FLAGSHIP_LEGACY_GENERATOR_ID,
} from "./patient-identity";
import { createSeededRng } from "./rng";
import {
  E2E_COHORTS,
  E2E_DEFAULT_SEED,
  E2E_EMAIL_DOMAIN,
  E2E_SOURCE,
  type E2EBatchManifest,
  type E2ECohortId,
  type E2EGeneratedDataset,
  type E2EGeneratorOptions,
  type E2ELabEvent,
  type E2EOrganisation,
  type E2EOrganisationKind,
  type E2EObservationPoint,
  type E2EPatientProfile,
  type E2EPatientStateFactSeed,
  type E2EPharmacyEvent,
  type E2ESyntheticMetadata,
  type E2EUserSpec,
  type E2EUserSubRole,
} from "./types";

const FIRST_NAMES = [
  "Aisha", "Benjamin", "Chloe", "Daniel", "Elena", "Farah", "George", "Hannah",
  "Ibrahim", "Jessica", "Kwame", "Layla", "Marcus", "Nia", "Oliver", "Priya",
  "Quinn", "Rosa", "Samir", "Tanya", "Umar", "Vera", "William", "Yasmin", "Zara",
];
const SURNAMES = [
  "Ahmed", "Baker", "Chen", "Davies", "Edwards", "Foster", "Gupta", "Hughes",
  "Iqbal", "Jones", "Khan", "Lewis", "Murphy", "Ng", "Osei", "Patel", "Quinn",
  "Rahman", "Singh", "Taylor", "Uddin", "Vaughan", "Walsh", "Young",
];
const ETHNICITIES = [
  "White British", "Black African", "Asian British", "Mixed heritage",
  "White Other", "Black Caribbean", "Indian", "Pakistani", "Bangladeshi",
];
const ICS_REGIONS = [
  "South East London", "West Yorkshire", "Greater Manchester", "Birmingham & Solihull",
  "North East London", "Surrey Heartlands", "Cheshire & Merseyside", "West Midlands",
];

function padId(prefix: string, n: number, width = 3): string {
  return `${prefix}${String(n).padStart(width, "0")}`;
}

function syntheticNhs(n: number): string {
  const raw = String(8000000000 + n * 149 + 17);
  return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 10)}`;
}

function baseMetadata(batchId: string, generatedAt: string, cohortId?: E2ECohortId): E2ESyntheticMetadata {
  return {
    isSynthetic: true,
    source: E2E_SOURCE,
    batchId,
    generatedAt,
    cohortId,
    liveEmis: false,
  };
}

function monthOffsets(count: number, monthsBack: number): string[] {
  const out: string[] = [];
  const now = new Date("2026-08-12T12:00:00.000Z");
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() - Math.round((monthsBack * i) / Math.max(count - 1, 1)));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function buildHba1cSeries(
  cohortId: E2ECohortId,
  dates: string[]
): E2EObservationPoint[] {
  const templates: Record<E2ECohortId, number[]> = {
    A: [6.6, 6.7, 6.6, 6.8, 6.7, 6.9],
    B: [6.8, 7.1, 7.6, 8.0, 8.2, 8.4],
    C: [9.1, 9.4, 9.6, 9.8, 10.0, 10.2],
    D: [7.2, 7.0, 6.9, 7.1, 7.0, 6.8],
    E: [8.0, 8.3, 8.6, 8.9, 9.1, 9.3],
    F: [7.4, 7.4, 7.4, 7.4, 7.4, 7.4],
    G: [8.2, 8.5, 8.7, 8.9, 9.0, 9.2],
    H: [9.0, 8.6, 8.2, 7.8, 7.4, 7.0],
  };
  const values = templates[cohortId];
  return dates.map((effectiveAt, i) => ({
    effectiveAt,
    value: values[Math.min(i, values.length - 1)]!,
    unit: "mmol/mol",
    label: "HbA1c",
  }));
}

function buildWeightSeries(cohortId: E2ECohortId, base: number, dates: string[]): E2EObservationPoint[] {
  const deltas: Record<E2ECohortId, number[]> = {
    A: [0, 0, -0.2, 0.1, 0, 0],
    B: [0, 0.8, 1.5, 2.5, 3.5, 5.0],
    C: [0, 0.5, 1.0, 1.2, 1.5, 2.0],
    D: [0, -0.5, -0.3, 0, 0.2, 0],
    E: [0, 0.3, 0.5, 0.4, 0.6, 0.8],
    F: [0, 0, 0, 0, 0, 0],
    G: [0, 0.4, 0.8, 1.0, 1.2, 1.5],
    H: [0, -1.0, -2.0, -3.0, -4.0, -5.0],
  };
  return dates.map((effectiveAt, i) => ({
    effectiveAt,
    value: Math.round((base + deltas[cohortId][Math.min(i, deltas[cohortId].length - 1)]!) * 10) / 10,
    unit: "kg",
    label: "Weight",
  }));
}

function buildEgfrSeries(cohortId: E2ECohortId, dates: string[]): E2EObservationPoint[] {
  const start = cohortId === "C" || cohortId === "G" ? 58 : cohortId === "F" ? 0 : 82;
  if (start === 0) return [];
  const decline = cohortId === "B" || cohortId === "C" || cohortId === "G" ? 3 : 0;
  return dates.map((effectiveAt, i) => ({
    effectiveAt,
    value: Math.max(25, start - decline * i),
    unit: "mL/min/1.73m²",
    label: "eGFR",
  }));
}

function generateOrganisations(
  batchId: string,
  generatedAt: string,
  orgCount: number,
  labCount: number,
  pharmacyCount: number,
  rng: ReturnType<typeof createSeededRng>
): E2EOrganisation[] {
  const kinds: { kind: E2EOrganisationKind; prefix: string; names: string[] }[] = [
    { kind: "primary_care", prefix: "org-pc", names: ["Riverside Medical Centre", "Oakwood Health Practice", "Valley View Surgery"] },
    { kind: "diabetes_clinic", prefix: "org-dc", names: ["Metabolic Care Clinic", "Diabetes Excellence Centre"] },
    { kind: "specialist_centre", prefix: "org-sc", names: ["Regional Endocrine Centre", "Cardio-Renal Institute"] },
    { kind: "hospital", prefix: "org-hosp", names: ["St Helens University Hospital", "Northbridge NHS Trust"] },
    { kind: "community", prefix: "org-com", names: ["Community Diabetes Service", "Home Care Outreach"] },
    { kind: "laboratory", prefix: "lab", names: ["SynLab Diagnostics", "PathCore UK", "BioTrace Labs", "NorthStar Pathology"] },
    { kind: "pharmacy", prefix: "pharm", names: ["WellCare Pharmacy", "GreenCross Chemist", "City Health Pharmacy"] },
    { kind: "virtual_care", prefix: "org-vc", names: ["Aksh Virtual Care (synthetic)"] },
  ];

  const orgs: E2EOrganisation[] = [];
  let seq = 0;

  for (const bucket of kinds) {
    const limit =
      bucket.kind === "laboratory"
        ? labCount
        : bucket.kind === "pharmacy"
          ? pharmacyCount
          : Math.max(1, Math.floor(orgCount / 5));
    for (let i = 0; i < limit && orgs.length < orgCount + labCount + pharmacyCount; i += 1) {
      seq += 1;
      orgs.push({
        id: `${bucket.prefix}-${padId("", seq, 2).slice(1)}`,
        name: `${bucket.names[i % bucket.names.length]!} (E2E synthetic)`,
        kind: bucket.kind,
        odsCode: `E2E${String(10000 + seq).slice(-5)}`,
        icsRegion: rng.pick(ICS_REGIONS),
        metadata: baseMetadata(batchId, generatedAt),
      });
    }
  }

  return orgs.slice(0, orgCount + labCount + pharmacyCount);
}

type UserBucket = {
  subRole: E2EUserSubRole;
  role: E2EUserSpec["role"];
  count: number;
  prefix: string;
  title: string;
  specialty?: E2EUserSpec["specialty"];
};

function generateUsers(
  batchId: string,
  generatedAt: string,
  organisations: E2EOrganisation[],
  options: Required<Pick<E2EGeneratorOptions, "numberOfDoctors" | "numberOfNurses">>,
  rng: ReturnType<typeof createSeededRng>
): E2EUserSpec[] {
  const clinicalOrgs = organisations.filter((o) => o.kind !== "laboratory" && o.kind !== "pharmacy");

  const buckets: UserBucket[] = [
    { subRole: "gp", role: "gp", count: 20, prefix: "gp", title: "Dr", specialty: "general_practice" },
    { subRole: "endocrinologist", role: "gp", count: 8, prefix: "endo", title: "Dr", specialty: "endocrinology" },
    { subRole: "diabetologist", role: "gp", count: 8, prefix: "diab", title: "Dr", specialty: "diabetology" },
    { subRole: "cardiologist", role: "gp", count: 5, prefix: "card", title: "Dr", specialty: "cardiology" },
    { subRole: "nephrologist", role: "gp", count: 4, prefix: "neph", title: "Dr", specialty: "nephrology" },
    { subRole: "internal_medicine", role: "gp", count: 3, prefix: "im", title: "Dr", specialty: "internal_medicine" },
    { subRole: "emergency_medicine", role: "gp", count: 2, prefix: "ed", title: "Dr", specialty: "emergency_medicine" },
    { subRole: "ophthalmologist", role: "gp", count: 2, prefix: "ophth", title: "Dr", specialty: "ophthalmology" },
    { subRole: "podiatrist", role: "gp", count: 2, prefix: "pod", title: "Dr", specialty: "podiatry" },
    { subRole: "diabetes_specialist_nurse", role: "nurse", count: 10, prefix: "dsn", title: "DSN" },
    { subRole: "practice_nurse", role: "nurse", count: 10, prefix: "nurse", title: "Nurse" },
    { subRole: "care_coordinator", role: "nurse", count: 10, prefix: "cco", title: "Coordinator" },
    { subRole: "community_nurse", role: "nurse", count: 5, prefix: "cn", title: "Community Nurse" },
    { subRole: "dietitian", role: "nurse", count: 10, prefix: "diet", title: "Dietitian" },
    { subRole: "diabetes_educator", role: "nurse", count: 5, prefix: "ded", title: "Educator" },
    { subRole: "pharmacist", role: "clinical-pharmacist", count: 10, prefix: "pharm", title: "Pharmacist" },
    { subRole: "clinical_safety_officer", role: "practice-manager", count: 3, prefix: "cso", title: "CSO" },
    { subRole: "organisation_admin", role: "practice-manager", count: 5, prefix: "admin", title: "Admin" },
  ];

  // Trim doctor bucket to requested count
  let doctorTotal = buckets.filter((b) => b.role === "gp").reduce((s, b) => s + b.count, 0);
  if (doctorTotal > options.numberOfDoctors) {
    let toRemove = doctorTotal - options.numberOfDoctors;
    for (let i = buckets.length - 1; i >= 0 && toRemove > 0; i -= 1) {
      if (buckets[i]!.role !== "gp") continue;
      const take = Math.min(buckets[i]!.count, toRemove);
      buckets[i]!.count -= take;
      toRemove -= take;
    }
  }

  let nurseTotal = buckets.filter((b) => b.role === "nurse").reduce((s, b) => s + b.count, 0);
  if (nurseTotal > options.numberOfNurses) {
    let toRemove = nurseTotal - options.numberOfNurses;
    for (let i = buckets.length - 1; i >= 0 && toRemove > 0; i -= 1) {
      if (buckets[i]!.role !== "nurse") continue;
      const take = Math.min(buckets[i]!.count, toRemove);
      buckets[i]!.count -= take;
      toRemove -= take;
    }
  }

  const users: E2EUserSpec[] = [];
  let seq = 0;

  for (const bucket of buckets) {
    for (let n = 1; n <= bucket.count; n += 1) {
      seq += 1;
      const first = rng.pick(FIRST_NAMES);
      const surname = rng.pick(SURNAMES);
      const org = rng.pick(clinicalOrgs.length ? clinicalOrgs : organisations);
      users.push({
        id: `usr_e2e_${String(seq).padStart(4, "0")}`,
        email: `${bucket.prefix}${String(n).padStart(2, "0")}@${E2E_EMAIL_DOMAIN}`,
        role: bucket.role,
        subRole: bucket.subRole,
        specialty: bucket.specialty,
        fullName: `${bucket.title} ${first} ${surname}`,
        organisationId: org?.id ?? null,
        providerId: `PROV-E2E-${String(10000 + seq)}`,
        practiceOds: org?.odsCode ?? null,
        credentialsHint: bucket.role === "gp"
          ? `GMC ${String(2000000 + seq).padStart(7, "0")} (synthetic)`
          : bucket.role === "clinical-pharmacist"
            ? `GPhC ${String(3000000 + seq).padStart(7, "0")} (synthetic)`
            : bucket.role === "nurse"
              ? `NMC synthetic ${seq}`
              : null,
        workingHours: rng.pick(["Mon–Fri 08:00–18:00", "Mon–Fri 09:00–17:00", "Mon–Sat 08:00–20:00"]),
        caseloadHint: bucket.role === "gp" ? `${rng.int(80, 220)} patients (synthetic)` : null,
        metadata: baseMetadata(batchId, generatedAt),
      });
    }
  }

  return users;
}

function cohortMissingFlags(cohortId: E2ECohortId): string[] {
  if (cohortId !== "F") return [];
  return ["no_recent_renal_function", "no_recent_hba1c_lab", "unknown_adherence", "missing_bp", "unknown_allergy_status"];
}

function generatePatients(
  batchId: string,
  generatedAt: string,
  count: number,
  monthsOfHistory: number,
  organisations: E2EOrganisation[],
  doctors: E2EUserSpec[],
  nurses: E2EUserSpec[],
  rng: ReturnType<typeof createSeededRng>
): E2EPatientProfile[] {
  const primaryCare = organisations.filter((o) => o.kind === "primary_care" || o.kind === "diabetes_clinic");
  const dates = monthOffsets(6, monthsOfHistory);
  const patients: E2EPatientProfile[] = [];

  let patientIndex = 0;
  let flagshipCohortBAssigned = false;
  for (const cohort of E2E_COHORTS) {
    for (let c = 0; c < cohort.targetCount && patientIndex < count; c += 1) {
      patientIndex += 1;
      const i = patientIndex;
      const cohortId = cohort.id;
      const sex = rng.pick(["Female", "Male", "Non-binary"] as const);
      const age = rng.int(22, 84);
      const year = 2026 - age;
      const heightCm = rng.int(150, 190);
      const weightBase = rng.float(58, 115);
      const weightSeries = buildWeightSeries(cohortId, weightBase, dates);
      const latestWeight = weightSeries[weightSeries.length - 1]!.value;
      const bmi = Math.round((latestWeight / ((heightCm / 100) ** 2)) * 10) / 10;
      const doctor = rng.pick(doctors.filter((d) => d.role === "gp").length ? doctors.filter((d) => d.role === "gp") : doctors);
      const careTeam = rng.shuffle(nurses.filter((n) => n.role === "nurse")).slice(0, 3).map((n) => n.id);

      const hba1cSeries = cohortId === "F" ? [] : buildHba1cSeries(cohortId, dates);
      const egfrSeries = buildEgfrSeries(cohortId, dates);

      const conditions =
        cohortId === "G"
          ? ["Type 2 diabetes mellitus", "Essential hypertension", "CKD Stage 3", "Obesity", "Ischaemic heart disease"]
          : ["Type 2 diabetes mellitus"];

      // P1-ID-001: first cohort B patient shares clinical-proof / Neo4j / review-queue id P002.
      const legacyGeneratorId = padId("E2P", i);
      const isFlagship =
        cohortId === FLAGSHIP_GENERATOR_COHORT && !flagshipCohortBAssigned;
      if (isFlagship) flagshipCohortBAssigned = true;
      const patientId = isFlagship ? FLAGSHIP_CANONICAL_PATIENT_ID : legacyGeneratorId;

      patients.push({
        id: patientId,
        ...(isFlagship
          ? { legacyIds: [FLAGSHIP_LEGACY_GENERATOR_ID, legacyGeneratorId].filter((v, idx, arr) => arr.indexOf(v) === idx) }
          : {}),
        name: `${rng.pick(["Mr", "Mrs", "Ms", "Mx"])} ${rng.pick(FIRST_NAMES)} ${rng.pick(SURNAMES)}`,
        nhsNumber: syntheticNhs(i),
        dob: `${year}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`,
        age,
        sex,
        ethnicity: rng.pick(ETHNICITIES),
        bmi,
        weightKg: latestWeight,
        heightCm,
        cohortId,
        organisationId: rng.pick(primaryCare.length ? primaryCare : organisations).id,
        primaryDoctorId: doctor.id,
        careTeamIds: careTeam,
        conditions,
        medications:
          cohortId === "G"
            ? ["Metformin 1g BD", "Ramipril 5mg OD", "Atorvastatin 20mg ON", "Empagliflozin 10mg OD", "Insulin glargine 18u ON"]
            : ["Metformin 1g BD", "Ramipril 5mg OD"],
        allergies: cohortId === "G" ? ["Penicillin"] : ["None known"],
        comorbidities: conditions.slice(1),
        socialFactors: rng.bool(0.3) ? ["Transport barrier (synthetic)"] : [],
        careGoals: ["Improve glycaemic control", "Reduce cardiovascular risk"],
        preferences: [rng.pick(["Prefers phone contact", "Prefers app messages", "Prefers morning appointments"])],
        cgmAvailable: cohortId === "D" || rng.bool(0.35),
        smokingStatus: rng.pick(["never", "former", "current"] as const),
        activityLevel:
          cohortId === "B" ? "low" : cohortId === "H" ? "high" : rng.pick(["low", "moderate", "high"] as const),
        adherenceScore: cohortId === "E" ? rng.int(35, 55) : cohortId === "F" ? null : rng.int(70, 98),
        riskLevel:
          cohortId === "C" || cohortId === "D"
            ? "very_high"
            : cohortId === "B" || cohortId === "E" || cohortId === "G"
              ? "high"
              : cohortId === "A"
                ? "low"
                : "moderate",
        hba1cSeries,
        weightSeries,
        bloodPressureSeries: dates.map((effectiveAt, idx) => ({
          effectiveAt,
          systolic: cohortId === "C" ? 145 + idx : 118 + idx * 2,
          diastolic: cohortId === "C" ? 92 + idx : 74 + idx,
        })),
        egfrSeries,
        glucoseSeries: dates.map((effectiveAt, idx) => ({
          effectiveAt,
          value: cohortId === "D" ? rng.float(3.2, 4.8) : rng.float(5.5, 9.5),
          unit: "mmol/L",
          label: "Fasting glucose",
        })),
        lipidSeries: dates.slice(-2).map((effectiveAt) => ({
          effectiveAt,
          value: rng.float(3.8, 6.2),
          unit: "mmol/L",
          label: "Total cholesterol",
        })),
        cgmSummary:
          cohortId === "D"
            ? {
                timeInRangePct: rng.int(42, 58),
                hypoEvents7d: rng.int(3, 9),
                effectiveAt: dates[dates.length - 1]!,
              }
            : undefined,
        missingDataFlags: cohortMissingFlags(cohortId),
        metadata: baseMetadata(batchId, generatedAt, cohortId),
      });
    }
  }

  return patients.slice(0, count);
}

function factsFromPatient(patient: E2EPatientProfile, batchId: string): E2EPatientStateFactSeed[] {
  const facts: E2EPatientStateFactSeed[] = [];
  let seq = 0;

  const pushSeries = (factType: string, series: E2EObservationPoint[]) => {
    for (const point of series) {
      seq += 1;
      facts.push({
        id: `e2e-pfact-${patient.id}-${factType}-${seq}`,
        patientId: patient.id,
        factType,
        value: {
          ...point,
          isSynthetic: true,
          batchId,
          cohortId: patient.cohortId,
        },
        sourceSystem: E2E_SOURCE,
        sourceReference: `${batchId}:${patient.id}:${factType}`,
        confidence: 1,
        effectiveAt: `${point.effectiveAt}T09:00:00.000Z`,
        recordedAt: `${point.effectiveAt}T10:00:00.000Z`,
      });
    }
  };

  pushSeries("hba1c", patient.hba1cSeries);
  pushSeries("weight", patient.weightSeries);
  pushSeries("egfr", patient.egfrSeries);
  pushSeries("glucose", patient.glucoseSeries);
  pushSeries("lipid", patient.lipidSeries);

  for (const bp of patient.bloodPressureSeries) {
    seq += 1;
    facts.push({
      id: `e2e-pfact-${patient.id}-bp-${seq}`,
      patientId: patient.id,
      factType: "blood_pressure",
      value: { ...bp, unit: "mmHg", isSynthetic: true, batchId, cohortId: patient.cohortId },
      sourceSystem: E2E_SOURCE,
      sourceReference: `${batchId}:${patient.id}:blood_pressure`,
      confidence: 1,
      effectiveAt: `${bp.effectiveAt}T09:00:00.000Z`,
      recordedAt: `${bp.effectiveAt}T10:00:00.000Z`,
    });
  }

  if (patient.cgmSummary) {
    facts.push({
      id: `e2e-pfact-${patient.id}-cgm-summary`,
      patientId: patient.id,
      factType: "cgm_summary",
      value: { ...patient.cgmSummary, isSynthetic: true, batchId, cohortId: patient.cohortId },
      sourceSystem: E2E_SOURCE,
      sourceReference: `${batchId}:${patient.id}:cgm_summary`,
      confidence: 0.95,
      effectiveAt: `${patient.cgmSummary.effectiveAt}T09:00:00.000Z`,
      recordedAt: `${patient.cgmSummary.effectiveAt}T10:00:00.000Z`,
    });
  }

  facts.push({
    id: `e2e-pfact-${patient.id}-cohort`,
    patientId: patient.id,
    factType: "e2e_cohort",
    value: {
      cohortId: patient.cohortId,
      riskLevel: patient.riskLevel,
      missingDataFlags: patient.missingDataFlags,
      isSynthetic: true,
      batchId,
    },
    sourceSystem: E2E_SOURCE,
    sourceReference: `${batchId}:${patient.id}:cohort`,
    confidence: 1,
    effectiveAt: patient.metadata.generatedAt,
    recordedAt: patient.metadata.generatedAt,
  });

  return facts;
}

function generateLabEvents(
  batchId: string,
  generatedAt: string,
  patients: E2EPatientProfile[],
  labs: E2EOrganisation[],
  rng: ReturnType<typeof createSeededRng>
): E2ELabEvent[] {
  const tests = [
    { code: "4548-4", name: "HbA1c" },
    { code: "2160-0", name: "Creatinine" },
    { code: "33914-3", name: "eGFR" },
    { code: "57698-3", name: "Lipid profile" },
    { code: "2345-7", name: "Glucose" },
  ];
  const events: E2ELabEvent[] = [];
  let seq = 0;

  for (const patient of patients) {
    const lab = rng.pick(labs);
    for (const test of rng.shuffle(tests).slice(0, 2)) {
      seq += 1;
      const flag: E2ELabEvent["resultFlag"] =
        patient.cohortId === "C" && test.name === "HbA1c"
          ? "critical"
          : patient.cohortId === "F" && test.name === "eGFR"
            ? "missing"
            : patient.cohortId === "B" && test.name === "HbA1c"
              ? "abnormal"
              : "normal";
      events.push({
        id: `e2e-lab-${seq}`,
        orderId: `e2e-order-${seq}`,
        laboratoryId: lab.id,
        patientId: patient.id,
        testCode: test.code,
        testName: test.name,
        status: flag === "missing" ? "delayed" : "completed",
        resultFlag: flag,
        value: flag === "missing" ? null : rng.float(4, 11),
        unit: test.name === "HbA1c" ? "mmol/mol" : test.name === "eGFR" ? "mL/min/1.73m²" : "mmol/L",
        orderedAt: "2026-07-01T08:00:00.000Z",
        resultedAt: flag === "missing" ? null : "2026-07-03T14:00:00.000Z",
        metadata: baseMetadata(batchId, generatedAt, patient.cohortId),
      });
    }

    // Stage 9 / AKSH-E2E-0013: every cohort F patient must have a delayed eGFR order.
    if (
      patient.cohortId === "F" &&
      !events.some((e) => e.patientId === patient.id && e.testName === "eGFR" && e.status === "delayed")
    ) {
      seq += 1;
      events.push({
        id: `e2e-lab-${seq}`,
        orderId: `e2e-order-${seq}`,
        laboratoryId: lab.id,
        patientId: patient.id,
        testCode: "33914-3",
        testName: "eGFR",
        status: "delayed",
        resultFlag: "missing",
        value: null,
        unit: "mL/min/1.73m²",
        orderedAt: "2026-07-01T08:00:00.000Z",
        resultedAt: null,
        metadata: baseMetadata(batchId, generatedAt, patient.cohortId),
      });
    }
  }

  return events;
}

function generatePharmacyEvents(
  batchId: string,
  generatedAt: string,
  patients: E2EPatientProfile[],
  pharmacies: E2EOrganisation[],
  rng: ReturnType<typeof createSeededRng>
): E2EPharmacyEvent[] {
  const events: E2EPharmacyEvent[] = [];
  let seq = 0;

  for (const patient of patients) {
    if (patient.cohortId !== "E" && !rng.bool(0.25)) continue;
    seq += 1;
    const pharm = rng.pick(pharmacies);
    events.push({
      id: `e2e-pharm-${seq}`,
      pharmacyId: pharm.id,
      patientId: patient.id,
      kind: patient.cohortId === "E" ? "adherence_issue" : "dispensed",
      medication: patient.medications[0] ?? "Metformin 1g BD",
      status: patient.cohortId === "E" ? "failed" : "completed",
      occurredAt: "2026-07-15T11:00:00.000Z",
      metadata: baseMetadata(batchId, generatedAt, patient.cohortId),
    });
  }

  return events;
}

export function generateE2EDataset(options: E2EGeneratorOptions = {}): E2EGeneratedDataset {
  const seed = options.seed ?? E2E_DEFAULT_SEED;
  const rng = createSeededRng(seed);
  const generatedAt = new Date().toISOString();
  const batchId = options.batchId ?? `e2e-${seed}`;

  const numberOfPatients = options.numberOfPatients ?? 100;
  const numberOfDoctors = options.numberOfDoctors ?? 54;
  const numberOfNurses = options.numberOfNurses ?? 40;
  const numberOfLabs = options.numberOfLabs ?? 10;
  const numberOfPharmacies = options.numberOfPharmacies ?? 10;
  const monthsOfHistory = options.monthsOfHistory ?? 18;
  const organisationCount = options.organisationCount ?? 12;

  const organisations = generateOrganisations(
    batchId,
    generatedAt,
    organisationCount,
    numberOfLabs,
    numberOfPharmacies,
    rng
  );
  const users = generateUsers(
    batchId,
    generatedAt,
    organisations,
    { numberOfDoctors, numberOfNurses },
    rng
  );
  const doctors = users.filter((u) => u.role === "gp");
  const nurses = users.filter((u) => u.role === "nurse");
  const patients = generatePatients(
    batchId,
    generatedAt,
    numberOfPatients,
    monthsOfHistory,
    organisations,
    doctors,
    nurses,
    rng
  );
  const patientStateFacts = patients.flatMap((p) => factsFromPatient(p, batchId));
  const labs = organisations.filter((o) => o.kind === "laboratory");
  const pharmacies = organisations.filter((o) => o.kind === "pharmacy");
  const labEvents = generateLabEvents(batchId, generatedAt, patients, labs, rng);
  const pharmacyEvents = generatePharmacyEvents(batchId, generatedAt, patients, pharmacies, rng);

  const scenarioDistribution = E2E_COHORTS.reduce(
    (acc, c) => {
      acc[c.id] = patients.filter((p) => p.cohortId === c.id).length;
      return acc;
    },
    {} as Record<E2ECohortId, number>
  );

  const manifest: E2EBatchManifest = {
    isSynthetic: true,
    source: E2E_SOURCE,
    batchId,
    generatedAt,
    seed,
    liveEmis: false,
    patientCount: patients.length,
    userCount: users.length,
    organisationCount: organisations.length,
    labCount: labs.length,
    pharmacyCount: pharmacies.length,
    patientStateFactCount: patientStateFacts.length,
    labEventCount: labEvents.length,
    pharmacyEventCount: pharmacyEvents.length,
    scenarioDistribution,
  };

  return {
    manifest,
    organisations,
    users,
    patients,
    patientStateFacts,
    labEvents,
    pharmacyEvents,
  };
}

export function assertE2EGeneratorInvariants(dataset: E2EGeneratedDataset) {
  const { manifest, patients, users } = dataset;
  if (patients.length < 100) {
    throw new Error(`Expected ≥100 patients, got ${patients.length}`);
  }
  const doctors = users.filter((u) => u.role === "gp");
  const nurses = users.filter((u) => u.role === "nurse");
  const pharmacists = users.filter((u) => u.role === "clinical-pharmacist");
  if (doctors.length < 50) throw new Error(`Expected ≥50 doctors, got ${doctors.length}`);
  if (nurses.length < 30) throw new Error(`Expected ≥30 nurses, got ${nurses.length}`);
  if (pharmacists.length < 10) throw new Error(`Expected ≥10 pharmacists, got ${pharmacists.length}`);
  const cohortTotal = Object.values(manifest.scenarioDistribution).reduce((a, b) => a + b, 0);
  if (cohortTotal !== patients.length) {
    throw new Error("Scenario distribution must sum to patient count");
  }
  return {
    batchId: manifest.batchId,
    patients: patients.length,
    users: users.length,
    doctors: doctors.length,
    nurses: nurses.length,
    scenarioDistribution: manifest.scenarioDistribution,
  };
}

/** Reproduce same batchId prefix from seed for idempotent tooling. */
export function batchIdFromSeed(seed: number, dateIso = new Date().toISOString()): string {
  return `e2e-${seed}-${dateIso.slice(0, 10).replace(/-/g, "")}`;
}
