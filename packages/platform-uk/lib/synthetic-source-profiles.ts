import type { IntakeGenerationOptions } from "./intake-generation";
import type { ConsultationInput } from "./types";

type SyntheticSourceProfileId = NonNullable<ConsultationInput["sourceProfile"]>;

export type SyntheticSourceProfilePreset = {
  id: SyntheticSourceProfileId;
  label: string;
  description: string;
  patientLabel: string;
  sourceType: ConsultationInput["sourceType"];
  pathwayHint: IntakeGenerationOptions["pathwayHint"];
  confidenceMode: IntakeGenerationOptions["confidenceMode"];
  includeMedicationDraft: boolean;
  text: string;
};

export const syntheticSourceProfiles: SyntheticSourceProfilePreset[] = [
  {
    id: "voice_note_intake",
    label: "Voice / Notes",
    description: "Synthetic consultation voice or note intake for the baseline review workflow.",
    patientLabel: "Synthetic Voice Intake Patient",
    sourceType: "transcript",
    pathwayHint: "respiratory",
    confidenceMode: "auto",
    includeMedicationDraft: true,
    text: "Patient reports cough and fever for 3 days with wheeze overnight. Possible amoxicillin was discussed after prior medication review. History of penicillin allergy. Currently taking clarithromycin. No chest pain reported."
  },
  {
    id: "public_health_sdoh",
    label: "Public Health / SDOH",
    description: "Synthetic intake including smoking, housing, or access factors without claiming live public-health ingestion.",
    patientLabel: "Synthetic SDOH Patient",
    sourceType: "note",
    pathwayHint: "hypertension",
    confidenceMode: "conservative",
    includeMedicationDraft: false,
    text: "Community follow-up note. Blood pressure today 154/96. Patient reports missed amlodipine doses because of unstable housing and inconsistent food access. Smokes 10 cigarettes daily and needs primary-care follow-up."
  },
  {
    id: "wearable_monitoring",
    label: "Wearable Monitoring",
    description: "Synthetic home-monitoring or wearable summary routed into the existing review workflow.",
    patientLabel: "Synthetic Wearable Patient",
    sourceType: "note",
    pathwayHint: "hypertension",
    confidenceMode: "standard",
    includeMedicationDraft: false,
    text: "Home monitoring summary from smartwatch and BP cuff. Blood pressure this week 148/94 and 146/92. Patient notes dizziness and occasionally misses ramipril. Heart rate elevated during morning readings."
  },
  {
    id: "imaging_lab_result",
    label: "Imaging / Lab Results",
    description: "Synthetic lab or imaging handoff packaged as source material for clinician review.",
    patientLabel: "Synthetic Lab Result Patient",
    sourceType: "note",
    pathwayHint: "lipid",
    confidenceMode: "standard",
    includeMedicationDraft: true,
    text: "Lab review message. LDL 5.8 mmol/L on recent bloods. Cholesterol management review needed and atorvastatin restart discussed. Follow-up note includes prior statin intolerance concern for clinician confirmation."
  },
  {
    id: "genomics_family_history",
    label: "Genomics / Family History",
    description: "Synthetic family-history or genomics-style prompt kept inside the current proof boundary.",
    patientLabel: "Synthetic Family History Patient",
    sourceType: "note",
    pathwayHint: "lipid",
    confidenceMode: "auto",
    includeMedicationDraft: true,
    text: "Family history review. Strong family history of premature MI and possible familial hypercholesterolaemia discussed. LDL pending. Considering atorvastatin 20mg after clinician review despite prior uncertainty about tolerance."
  },
  {
    id: "ehr_handoff_placeholder",
    label: "EMIS / SystmOne Placeholder",
    description: "Synthetic EHR handoff placeholder showing how imported review context could be staged without live integration.",
    patientLabel: "Synthetic EHR Handoff Patient",
    sourceType: "note",
    pathwayHint: "hypertension",
    confidenceMode: "auto",
    includeMedicationDraft: false,
    text: "Synthetic EMIS handoff summary. Hypertension annual review due. Blood pressure recorded as 142/88. Current medications include amlodipine and ramipril. No real EHR connection is active; clinician must confirm imported summary before finalization."
  }
];

export function buildSyntheticSourceFixtureCatalog() {
  return {
    artifactType: "aksh-uk-eu-l1-synthetic-source-fixture-catalog" as const,
    layer: "L1 synthetic source ingestion" as const,
    syntheticOnly: true,
    liveIntegration: false,
    realPatientData: false,
    categoryCount: syntheticSourceProfiles.length,
    categories: syntheticSourceProfiles.map((profile) => ({
      id: profile.id,
      label: profile.label,
      sourceType: profile.sourceType,
      pathwayHint: profile.pathwayHint,
      confidenceMode: profile.confidenceMode,
      includesMedicationDraft: profile.includeMedicationDraft,
      patientLabel: profile.patientLabel,
      description: profile.description
    })),
    boundary:
      "These fixtures simulate six source categories from the architecture map without connecting to live NHS, EHR, wearable, genomics, imaging, or public-health systems."
  };
}

const sourceProfileLabels: Record<SyntheticSourceProfileId, string> = Object.fromEntries(
  syntheticSourceProfiles.map((profile) => [profile.id, profile.label])
) as Record<SyntheticSourceProfileId, string>;

export function sourceProfileLabel(profile: ConsultationInput["sourceProfile"] | undefined) {
  if (!profile) {
    return "Synthetic intake";
  }

  return sourceProfileLabels[profile] ?? "Synthetic intake";
}

export function inferSyntheticSourceProfile(
  rawInput: string,
  sourceType: ConsultationInput["sourceType"],
  preferredProfile?: ConsultationInput["sourceProfile"]
): SyntheticSourceProfileId {
  if (preferredProfile) {
    return preferredProfile;
  }

  const lower = rawInput.trim().toLowerCase();

  if (lower.includes("emis") || lower.includes("systmone") || lower.includes("handoff") || lower.includes("ehr")) {
    return "ehr_handoff_placeholder";
  }

  if (lower.includes("family history") || lower.includes("genetic") || lower.includes("familial")) {
    return "genomics_family_history";
  }

  if (lower.includes("smartwatch") || lower.includes("wearable") || lower.includes("home monitoring") || lower.includes("bp cuff")) {
    return "wearable_monitoring";
  }

  if (lower.includes("ldl") || lower.includes("bloods") || lower.includes("lab") || lower.includes("x-ray") || lower.includes("ultrasound")) {
    return "imaging_lab_result";
  }

  if (lower.includes("housing") || lower.includes("food access") || lower.includes("deprivation") || lower.includes("smokes") || lower.includes("community follow-up")) {
    return "public_health_sdoh";
  }

  if (sourceType === "transcript" || sourceType === "note") {
    return "voice_note_intake";
  }

  return "voice_note_intake";
}
