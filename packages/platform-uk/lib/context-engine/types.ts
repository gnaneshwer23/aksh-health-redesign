export const CONTEXT_ENGINE_VERSION = "aksh-context-1.0" as const;

export type ContextPurpose =
  | "clinical_decision_support"
  | "documentation"
  | "medication_safety"
  | "patient_self";

export type ContextProvenance = {
  field: string;
  source: string;
  timestamp: string;
  reference?: string;
};

export type ContextEvidenceItem = {
  id: string;
  title: string;
  kind: "guideline" | "fact" | "synthesis";
  citation: string;
  provenance: string;
};

export type ClinicalContextPackage = {
  schemaVersion: typeof CONTEXT_ENGINE_VERSION;
  contextId: string;
  assembledAt: string;
  purpose: ContextPurpose;
  liveEmis: false;
  patient_context: {
    patientId: string;
    label: string;
    age?: number;
    gender?: string;
    organisation?: string;
  };
  encounter_context: {
    lastEncounterDate: string | null;
    nextAppointmentDate: string | null;
  };
  clinical_history: {
    conditions: string[];
    flags: string[];
  };
  conditions: string[];
  medications: string[];
  allergies: string[];
  observations: Array<{ name: string; value: string; recordedAt?: string }>;
  laboratory_results: Array<{ name: string; value: string; recordedAt?: string }>;
  procedures: string[];
  relevant_guidelines: ContextEvidenceItem[];
  evidence: ContextEvidenceItem[];
  risk_factors: string[];
  missing_information: string[];
  uncertainties: string[];
  provenance: ContextProvenance[];
  dataSource: "neo4j" | "patient_state" | "mock" | "hybrid";
};

export type ContextAssemblyInput = {
  patientId: string;
  purpose: ContextPurpose;
  actorRole?: string;
  boundPatientId?: string | null;
};
