export type AgentCategory = "patient" | "clinical" | "operational";

export type Agent = {
  name: string;
  category: AgentCategory;
  description: string;
  fhirOutput: string;
  hitlGate: "Yes" | "Supervised";
};

export const agents: Agent[] = [
  {
    name: "Health Companion",
    category: "patient",
    description:
      "24/7 check-ins, symptom tracking, medication reminders, lifestyle coaching, appointment management",
    fhirOutput: "Observation, CarePlan",
    hitlGate: "Supervised",
  },
  {
    name: "Voice Care Agent",
    category: "patient",
    description:
      "AI calls patients post-discharge, collects symptoms, updates FHIR, escalates when needed",
    fhirOutput: "Encounter, Task",
    hitlGate: "Yes",
  },
  {
    name: "Clinical Copilot",
    category: "clinical",
    description: "Pre/during/post consultation support",
    fhirOutput: "ClinicalImpression",
    hitlGate: "Yes",
  },
  {
    name: "Documentation Agent",
    category: "clinical",
    description:
      "Ambient note generation, task creation, care plan updates",
    fhirOutput: "DocumentReference",
    hitlGate: "Yes",
  },
  {
    name: "Diagnostic Support",
    category: "clinical",
    description: "Differential diagnosis, investigation suggestions",
    fhirOutput: "Condition",
    hitlGate: "Yes",
  },
  {
    name: "Medication Intelligence",
    category: "clinical",
    description:
      "Interactions, adherence, contraindication monitoring",
    fhirOutput: "MedicationRequest",
    hitlGate: "Yes",
  },
  {
    name: "Referral Agent",
    category: "clinical",
    description:
      "Automated referral package creation, urgency prediction",
    fhirOutput: "ServiceRequest",
    hitlGate: "Yes",
  },
  {
    name: "SYNTHESIS",
    category: "clinical",
    description: "Encounter summarisation → SOAP notes",
    fhirOutput: "DocumentReference",
    hitlGate: "Yes",
  },
  {
    name: "GUARDIAN",
    category: "clinical",
    description: "Drug + allergy + contraindication real-time checking",
    fhirOutput: "DetectedIssue",
    hitlGate: "Yes",
  },
  {
    name: "ORACLE",
    category: "clinical",
    description: "CVD, T2D, frailty risk prediction",
    fhirOutput: "RiskAssessment",
    hitlGate: "Supervised",
  },
  {
    name: "Hospital Command",
    category: "operational",
    description:
      "Capacity, staffing, waiting times, AI recommendations",
    fhirOutput: "MeasureReport",
    hitlGate: "Supervised",
  },
  {
    name: "Capacity Prediction",
    category: "operational",
    description: "Bed demand, admission forecasts, winter planning",
    fhirOutput: "MeasureReport",
    hitlGate: "Supervised",
  },
];

export type ComparisonRow = {
  feature: string;
  epic: number;
  nuance: number;
  microsoft: number;
  aksh: number;
};

export const comparisonData: ComparisonRow[] = [
  { feature: "EHR Depth", epic: 5, nuance: 1, microsoft: 3, aksh: 3 },
  { feature: "AI Documentation", epic: 2, nuance: 5, microsoft: 4, aksh: 5 },
  { feature: "Patient AI", epic: 1, nuance: 1, microsoft: 2, aksh: 5 },
  { feature: "Voice Agents", epic: 1, nuance: 2, microsoft: 3, aksh: 5 },
  {
    feature: "Autonomous Workflows",
    epic: 2,
    nuance: 1,
    microsoft: 3,
    aksh: 5,
  },
  {
    feature: "Interoperability Intelligence",
    epic: 4,
    nuance: 1,
    microsoft: 4,
    aksh: 5,
  },
  { feature: "Digital Twin", epic: 1, nuance: 1, microsoft: 2, aksh: 5 },
  { feature: "Multi-Agent AI", epic: 1, nuance: 1, microsoft: 3, aksh: 5 },
  {
    feature: "Care Pathway Automation",
    epic: 2,
    nuance: 1,
    microsoft: 2,
    aksh: 5,
  },
];

export const signupRoles = [
  { id: "gp", label: "GP", description: "General practice clinician" },
  { id: "nurse", label: "Nurse", description: "Practice or community nurse" },
  { id: "pharmacist", label: "Pharmacist", description: "Clinical pharmacist" },
  {
    id: "hospital-admin",
    label: "Hospital Admin",
    description: "Hospital operations administrator",
  },
  {
    id: "practice-manager",
    label: "Practice Manager",
    description: "GP practice manager",
  },
  { id: "ics-lead", label: "ICS Lead", description: "Integrated care system lead" },
  { id: "patient", label: "Patient", description: "Patient invited by practice" },
  {
    id: "hospital-executive",
    label: "Hospital Executive",
    description: "CEO, COO, or medical director",
  },
] as const;

export type SignupRoleId = (typeof signupRoles)[number]["id"];
