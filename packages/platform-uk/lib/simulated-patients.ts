import { reviewCases } from "./mock-data";
import { patients } from "./mock-data/patients";
import { getClinicalProofCohortSummary } from "./clinical-proof/cohort";

export type SimulatedPatientProfile = {
  id: string;
  displayName: string;
  ageBand: string;
  sex: "female" | "male" | "not_specified";
  locality: string;
  scenarioClass: string;
  longitudinalSummary: string;
  activeProblems: string[];
  medications: string[];
  allergies: string[];
  recentObservations: string[];
  socialContext: string;
  riskProfile: "low" | "moderate" | "high";
  linkedCaseIds: string[];
  clinicalProfiles?: string[];
  syntheticOnly: true;
};

function ageBandFromAge(age: number): string {
  if (age < 1) return "0-1";
  if (age < 18) return "1-17";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  if (age < 65) return "55-64";
  if (age < 75) return "65-74";
  return "75+";
}

function riskFromOracle(risk: string): "low" | "moderate" | "high" {
  if (risk === "Low") return "low";
  if (risk === "Medium") return "moderate";
  return "high";
}

/** Legacy review-case linked profiles (workflow evidence). */
const legacySimulatedProfiles: SimulatedPatientProfile[] = [
  {
    id: "sim-patient-a",
    displayName: "Synthetic Patient A",
    ageBand: "45-54",
    sex: "female",
    locality: "Urban GP practice",
    scenarioClass: "respiratory antibiotic allergy risk",
    longitudinalSummary: "Recurring respiratory presentations with a documented penicillin allergy and macrolide exposure.",
    activeProblems: ["Acute cough", "Penicillin allergy", "Medication interaction risk"],
    medications: ["Clarithromycin"],
    allergies: ["Penicillin"],
    recentObservations: ["Fever reported", "No chest pain", "No oxygen concern recorded"],
    socialContext: "Lives independently; calls practice early when symptoms worsen.",
    riskProfile: "high",
    linkedCaseIds: ["case-001", "case-006", "case-007"],
    clinicalProfiles: ["drug_allergy"],
    syntheticOnly: true
  },
  {
    id: "sim-patient-b",
    displayName: "Synthetic Patient B",
    ageBand: "55-64",
    sex: "male",
    locality: "Suburban chronic disease clinic",
    scenarioClass: "hypertension missing observation",
    longitudinalSummary: "Routine hypertension monitoring where the note omits exact blood pressure values.",
    activeProblems: ["Hypertension", "Missing vital sign evidence"],
    medications: ["Amlodipine"],
    allergies: [],
    recentObservations: ["Blood pressure referenced but value absent"],
    socialContext: "Works full-time; prefers short follow-up appointments.",
    riskProfile: "moderate",
    linkedCaseIds: ["case-002"],
    clinicalProfiles: ["hypertension", "missing_clinical_info"],
    syntheticOnly: true
  },
  {
    id: "sim-patient-c",
    displayName: "Synthetic Patient C",
    ageBand: "25-34",
    sex: "female",
    locality: "Community dermatology follow-up",
    scenarioClass: "straightforward eczema renewal",
    longitudinalSummary: "Stable eczema pattern with complete documentation and low safety concern.",
    activeProblems: ["Eczema"],
    medications: ["Emollient cream", "Hydrocortisone 1% cream"],
    allergies: [],
    recentObservations: ["Localized rash", "No infection signs"],
    socialContext: "Self-manages mild flares with clear safety-netting.",
    riskProfile: "low",
    linkedCaseIds: ["case-003"],
    clinicalProfiles: ["healthy"],
    syntheticOnly: true
  },
  {
    id: "sim-patient-d",
    displayName: "Synthetic Patient D",
    ageBand: "65-74",
    sex: "male",
    locality: "Lipid review clinic",
    scenarioClass: "statin intolerance override",
    longitudinalSummary: "Medication review where a statin draft conflicts with documented previous intolerance.",
    activeProblems: ["Hyperlipidaemia", "Previous statin intolerance", "Incomplete monitoring observation"],
    medications: ["Atorvastatin draft"],
    allergies: [],
    recentObservations: ["LDL referenced", "Muscle pain history documented"],
    socialContext: "Concerned about side effects and prefers shared decision-making.",
    riskProfile: "high",
    linkedCaseIds: ["case-004"],
    clinicalProfiles: ["drug_allergy"],
    syntheticOnly: true
  },
  {
    id: "sim-patient-e",
    displayName: "Synthetic Patient E",
    ageBand: "35-44",
    sex: "not_specified",
    locality: "General primary care",
    scenarioClass: "accepted clean review",
    longitudinalSummary: "Complete synthetic review flow used to prove frozen artifact and evidence output behavior.",
    activeProblems: ["Resolved minor illness follow-up"],
    medications: [],
    allergies: [],
    recentObservations: ["Complete review observations", "Reviewer accepted artifact"],
    socialContext: "Stable follow-up context with no unresolved concerns.",
    riskProfile: "low",
    linkedCaseIds: ["case-005"],
    clinicalProfiles: ["healthy"],
    syntheticOnly: true
  }
];

/** Dashboard / Neo4j seed patients projected into the simulated cohort view. */
const dashboardSimulatedProfiles: SimulatedPatientProfile[] = patients.map((patient) => ({
  id: `dash-${patient.id.toLowerCase()}`,
  displayName: patient.name,
  ageBand: ageBandFromAge(patient.age),
  sex:
    patient.gender.toLowerCase() === "female"
      ? "female"
      : patient.gender.toLowerCase() === "male"
        ? "male"
        : "not_specified",
  locality: patient.organisation ?? patient.postcode,
  scenarioClass: (patient.clinicalProfiles ?? ["general"]).join("+"),
  longitudinalSummary:
    patient.qaNotes ??
    `${patient.activeConditions.join("; ") || "No active conditions"} · ORACLE ${patient.oracleRisk}`,
  activeProblems: patient.activeConditions,
  medications: patient.activeMedications,
  allergies: patient.allergies.filter((a) => a.toLowerCase() !== "none known"),
  recentObservations: patient.digitalTwinPrediction.deteriorationSignals.slice(0, 3),
  socialContext: patient.qaNotes ?? "Synthetic clinical-proof fixture · realPatientData:false",
  riskProfile: riskFromOracle(patient.oracleRisk),
  linkedCaseIds: patient.id === "P002" ? ["patel-golden-path"] : [],
  clinicalProfiles: patient.clinicalProfiles,
  syntheticOnly: true as const
}));

export const simulatedPatientProfiles: SimulatedPatientProfile[] = [
  ...legacySimulatedProfiles,
  ...dashboardSimulatedProfiles
];

export function getSimulatedPatientCohortSummary() {
  const linkedCaseIds = new Set(simulatedPatientProfiles.flatMap((profile) => profile.linkedCaseIds));
  const seededCaseIds = new Set(reviewCases.map((item) => item.id));
  const coveredSeedCases = [...linkedCaseIds].filter((id) => seededCaseIds.has(id)).length;
  const clinicalProof = getClinicalProofCohortSummary();

  return {
    artifactType: "aksh-uk-eu-simulated-patient-cohort",
    syntheticOnly: true as const,
    realPatientData: false,
    liveEmis: false as const,
    generatedFrom:
      "legacy review-case profiles + lib/mock-data/patients + longitudinal-bundles (Neo4j seed shared)",
    totalProfiles: simulatedPatientProfiles.length,
    dashboardPatients: patients.length,
    linkedReviewCases: linkedCaseIds.size,
    coveredSeedCases,
    clinicalProof,
    riskMix: {
      low: simulatedPatientProfiles.filter((item) => item.riskProfile === "low").length,
      moderate: simulatedPatientProfiles.filter((item) => item.riskProfile === "moderate").length,
      high: simulatedPatientProfiles.filter((item) => item.riskProfile === "high").length
    },
    scenarioClasses: [...new Set(simulatedPatientProfiles.map((item) => item.scenarioClass))]
  };
}
