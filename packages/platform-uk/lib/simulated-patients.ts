import { reviewCases } from "./mock-data";

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
  syntheticOnly: true;
};

export const simulatedPatientProfiles: SimulatedPatientProfile[] = [
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
    syntheticOnly: true
  }
];

export function getSimulatedPatientCohortSummary() {
  const linkedCaseIds = new Set(simulatedPatientProfiles.flatMap((profile) => profile.linkedCaseIds));
  const seededCaseIds = new Set(reviewCases.map((item) => item.id));
  const coveredSeedCases = [...linkedCaseIds].filter((id) => seededCaseIds.has(id)).length;

  return {
    artifactType: "aksh-uk-eu-simulated-patient-cohort",
    syntheticOnly: true as const,
    realPatientData: false,
    generatedFrom: "curated synthetic patient profiles linked to seeded review scenarios",
    totalProfiles: simulatedPatientProfiles.length,
    linkedReviewCases: linkedCaseIds.size,
    coveredSeedCases,
    riskMix: {
      low: simulatedPatientProfiles.filter((item) => item.riskProfile === "low").length,
      moderate: simulatedPatientProfiles.filter((item) => item.riskProfile === "moderate").length,
      high: simulatedPatientProfiles.filter((item) => item.riskProfile === "high").length
    },
    scenarioClasses: [...new Set(simulatedPatientProfiles.map((item) => item.scenarioClass))]
  };
}
