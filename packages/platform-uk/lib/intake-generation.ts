import type { ConsultationInput, FhirBundleDraft, GenerationTraceItem, ReviewCase } from "./types";

export type IntakeGenerationOptions = {
  pathwayHint?: "auto" | "respiratory" | "hypertension" | "eczema" | "lipid" | "general";
  confidenceMode?: "auto" | "conservative" | "standard";
  includeMedicationDraft?: boolean;
  sourceProfile?: ConsultationInput["sourceProfile"];
  inferredContextOverrides?: {
    allergies?: string[];
    currentMedications?: string[];
    medicationMention?: string;
    bloodPressure?: string;
    temperature?: string;
  };
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function buildResourceId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function extractPatientLabel(rawPatientLabel: string) {
  return rawPatientLabel.trim() ? rawPatientLabel.trim() : "Synthetic Intake Patient";
}

export function buildInputSummary(rawInput: string) {
  const compact = rawInput.trim().replace(/\s+/g, " ");
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

function createGenerationTraceItem(
  fieldLabel: string,
  fieldPath: string,
  section: GenerationTraceItem["section"],
  sourceSnippet: string,
  inferredValue: string,
  rationale: string
): GenerationTraceItem {
  return {
    id: `trace-${Math.random().toString(36).slice(2, 10)}`,
    fieldLabel,
    fieldPath,
    section,
    sourceSnippet: sourceSnippet || "No direct phrase match",
    inferredValue,
    rationale
  };
}

function extractSymptoms(rawInput: string) {
  const lower = normalizeText(rawInput);
  const symptoms = [
    "cough",
    "fever",
    "rash",
    "itching",
    "wheeze",
    "breathlessness",
    "shortness of breath",
    "headache",
    "dizziness",
    "muscle aches",
    "sore throat",
    "fatigue",
    "chest tightness"
  ].filter((symptom) => lower.includes(symptom));

  return symptoms.length ? symptoms.map(titleCase) : [];
}

function extractMedicationMention(rawInput: string) {
  const lower = normalizeText(rawInput);
  const matchedMedication =
    rawInput.match(/\b(amoxicillin|doxycycline|clarithromycin|atorvastatin|ramipril|amlodipine|losartan|hydrocortisone)\b(?:\s+\d+(?:\.\d+)?\s?mg)?/i)?.[0] ??
    "";

  if (matchedMedication) {
    const normalizedMatch = matchedMedication.trim();
    if (/hydrocortisone/i.test(normalizedMatch) && !/cream/i.test(normalizedMatch)) {
      return "Hydrocortisone 1% cream";
    }

    if (/atorvastatin/i.test(normalizedMatch) && !/\d/.test(normalizedMatch)) {
      return "Atorvastatin 20mg";
    }

    return normalizedMatch
      .split(/\s+/)
      .map((part) => (/\d/.test(part) ? part.toLowerCase() : titleCase(part)))
      .join(" ");
  }

  if (lower.includes("hydrocortisone")) return "Hydrocortisone 1% cream";
  if (lower.includes("emollient")) return "Emollient cream";
  if (lower.includes("amoxicillin")) return "Amoxicillin";
  if (lower.includes("doxycycline")) return "Doxycycline";
  if (lower.includes("atorvastatin")) return "Atorvastatin 20mg";
  if (lower.includes("ramipril")) return "Ramipril";
  if (lower.includes("amlodipine")) return "Amlodipine";
  if (lower.includes("losartan")) return "Losartan";

  return "";
}

function extractBloodPressure(rawInput: string) {
  const slashMatch = rawInput.match(/\b(?:bp|blood pressure)?\s*:?\s*(\d{2,3})\s*\/\s*(\d{2,3})\b/i);
  if (slashMatch) {
    return `${slashMatch[1]}/${slashMatch[2]}`;
  }

  const overMatch = rawInput.match(/\b(?:bp|blood pressure)?\s*:?\s*(\d{2,3})\s+over\s+(\d{2,3})\b/i);
  if (overMatch) {
    return `${overMatch[1]}/${overMatch[2]}`;
  }

  return "";
}

function extractTemperature(rawInput: string) {
  const celsiusMatch = rawInput.match(/\b(\d{2}(?:\.\d)?)\s?(?:c|celsius)\b/i);
  if (celsiusMatch) {
    return `${celsiusMatch[1]} C`;
  }

  const tempMatch = rawInput.match(/\b(?:temp|temperature)\s*:?\s*(\d{2}(?:\.\d)?)\b/i);
  if (tempMatch) {
    return `${tempMatch[1]} C`;
  }

  return "";
}

function extractLdlValue(rawInput: string) {
  const numericMatch = rawInput.match(/\bldl\b[:\s-]*(\d+(?:\.\d+)?)/i);
  if (numericMatch) {
    return `${numericMatch[1]} mmol/L`;
  }

  if (normalizeText(rawInput).includes("ldl pending")) {
    return "Pending";
  }

  return "";
}

function inferConditionEvidence(rawInput: string) {
  const symptoms = extractSymptoms(rawInput);
  const bpValue = extractBloodPressure(rawInput);
  const temperatureValue = extractTemperature(rawInput);
  const medication = extractMedicationMention(rawInput);
  const evidenceParts: string[] = [];

  if (symptoms.length) {
    evidenceParts.push(`${symptoms.join(", ")} described in source intake.`);
  }

  if (bpValue) {
    evidenceParts.push(`Blood pressure ${bpValue} documented in source intake.`);
  }

  if (temperatureValue) {
    evidenceParts.push(`Temperature ${temperatureValue} documented in source intake.`);
  }

  if (medication) {
    evidenceParts.push(`Medication context includes ${medication}.`);
  }

  return evidenceParts.length ? evidenceParts.join(" ") : "Source intake requires clinician confirmation for detailed evidence.";
}

function inferRedFlags(rawInput: string) {
  const lower = normalizeText(rawInput);
  const positives: string[] = [];
  const negatives: string[] = [];

  if (lower.includes("no chest pain")) negatives.push("no chest pain");
  else if (lower.includes("chest pain")) positives.push("chest pain");

  if (
    lower.includes("no sob") ||
    lower.includes("no shortness of breath") ||
    lower.includes("no breathlessness") ||
    /no [a-z\s]{0,24}shortness of breath/.test(lower)
  ) {
    negatives.push("no breathlessness");
  } else if (lower.includes("shortness of breath") || lower.includes("breathlessness")) {
    positives.push("breathlessness");
  }

  if (lower.includes("wheeze")) positives.push("wheeze");
  if (lower.includes("hypoxia") || lower.includes("low oxygen")) positives.push("possible hypoxia");
  if (lower.includes("confusion")) positives.push("confusion");
  if (lower.includes("collapse") || lower.includes("collapsed")) positives.push("collapse");

  if (!positives.length && !negatives.length) {
    return "Escalation symptoms not clearly stated in source input.";
  }

  return [...positives, ...negatives].join(", ");
}

export function buildGenerationTrace(rawInput: string, draft: FhirBundleDraft, safetyContext: ReviewCase["safetyContext"]) {
  const symptoms = extractSymptoms(rawInput);
  const medication = extractMedicationMention(rawInput);
  const bpValue = extractBloodPressure(rawInput);
  const temperatureValue = extractTemperature(rawInput);

  const trace: GenerationTraceItem[] = [
    createGenerationTraceItem(
      "Encounter Reason",
      "Encounter.reasonCode.text",
      "encounter",
      symptoms.length ? symptoms.join(", ") : buildInputSummary(rawInput),
      draft.encounter.reason,
      "Reason inferred from the dominant clinical topic in the source intake."
    ),
    createGenerationTraceItem(
      "Condition",
      "Condition.code.text",
      "condition",
      symptoms.length ? symptoms.join(", ") : buildInputSummary(rawInput),
      draft.condition.codeText,
      "Condition selected from the strongest symptom or review context in the source text."
    )
  ];

  if (medication && draft.medicationRequest) {
    trace.push(
      createGenerationTraceItem(
        "Medication Request",
        "MedicationRequest.medicationCodeableConcept.text",
        "medicationRequest",
        medication,
        draft.medicationRequest.medicationText,
        "Medication request drafted because a medication phrase appeared in the intake text."
      )
    );
  }

  if (bpValue) {
    trace.push(
      createGenerationTraceItem(
        "Blood Pressure Observation",
        "Observation(Blood pressure).valueString",
        "observation",
        bpValue,
        bpValue,
        "Observed blood pressure value carried directly into the draft."
      )
    );
  }

  if (temperatureValue) {
    trace.push(
      createGenerationTraceItem(
        "Temperature Observation",
        "Observation(Temperature).valueString",
        "observation",
        temperatureValue,
        temperatureValue,
        "Observed temperature value carried directly into the draft."
      )
    );
  }

  if (safetyContext.allergies.length) {
    trace.push(
      createGenerationTraceItem(
        "Allergy Context",
        "SafetyContext.allergies",
        "safetyContext",
        safetyContext.allergies.join(", "),
        safetyContext.allergies.join(", "),
        "Safety context inferred from explicit allergy or intolerance phrases in the source input."
      )
    );
  }

  if (safetyContext.currentMedications.length) {
    trace.push(
      createGenerationTraceItem(
        "Current Medication Context",
        "SafetyContext.currentMedications",
        "safetyContext",
        safetyContext.currentMedications.join(", "),
        safetyContext.currentMedications.join(", "),
        "Current medication context inferred from explicit medication mentions in the source input."
      )
    );
  }

  if (draft.encounter.clinicianSummary) {
    trace.push(
      createGenerationTraceItem(
        "Clinician Summary",
        "Encounter.note.text",
        "encounter",
        buildInputSummary(rawInput),
        draft.encounter.clinicianSummary,
        "Encounter summary drafted from the most clinically relevant phrases in the intake text."
      )
    );
  }

  return trace;
}

export function inferTranscriptConfidence(
  sourceType: ConsultationInput["sourceType"],
  rawInput: string,
  confidenceMode: IntakeGenerationOptions["confidenceMode"] = "auto"
) {
  const lower = normalizeText(rawInput);
  if (confidenceMode === "conservative") {
    return sourceType === "note" ? 0.82 : 0.61;
  }
  if (confidenceMode === "standard") {
    return sourceType === "note" ? 0.94 : 0.84;
  }
  if (sourceType === "note") {
    return 0.92;
  }
  if (lower.includes("unclear") || lower.includes("inaudible")) {
    return 0.58;
  }
  if (lower.includes("possible") || lower.includes("maybe") || lower.includes("unsure")) {
    return 0.64;
  }
  if (lower.length < 80) {
    return 0.69;
  }
  return 0.81;
}

export function inferSafetyContext(rawInput: string, overrides?: IntakeGenerationOptions["inferredContextOverrides"]) {
  const lower = normalizeText(rawInput);
  const allergies: string[] = [];
  const currentMedications: string[] = [];

  if (lower.includes("penicillin")) allergies.push("penicillin");
  if (lower.includes("atorvastatin intolerance")) allergies.push("atorvastatin intolerance");
  if (lower.includes("allergy to amoxicillin")) allergies.push("amoxicillin");
  if (lower.includes("clarithromycin")) currentMedications.push("clarithromycin");
  if (lower.includes("ramipril")) currentMedications.push("ramipril");
  if (lower.includes("amlodipine")) currentMedications.push("amlodipine");
  if (lower.includes("emollient")) currentMedications.push("emollient cream");

  const normalizedAllergies = overrides?.allergies?.map((item) => item.trim()).filter(Boolean);
  const normalizedCurrentMedications = overrides?.currentMedications?.map((item) => item.trim()).filter(Boolean);

  return {
    allergies: normalizedAllergies?.length ? normalizedAllergies : allergies,
    currentMedications: normalizedCurrentMedications?.length ? normalizedCurrentMedications : currentMedications
  };
}

export function inferDraftFromInput(rawInput: string, options: IntakeGenerationOptions = {}): FhirBundleDraft {
  const lower = normalizeText(rawInput);
  const pathwayHint = options.pathwayHint ?? "auto";
  const includeMedicationDraft = options.includeMedicationDraft ?? true;
  const symptoms = extractSymptoms(rawInput);
  const mentionedMedication = options.inferredContextOverrides?.medicationMention?.trim() || extractMedicationMention(rawInput);
  const bpValue = options.inferredContextOverrides?.bloodPressure?.trim() || extractBloodPressure(rawInput);
  const temperatureValue = options.inferredContextOverrides?.temperature?.trim() || extractTemperature(rawInput);
  const ldlValue = extractLdlValue(rawInput);
  const mentionsMissedDoses = lower.includes("missed") || lower.includes("non-compliant") || lower.includes("occasionally misses");
  const mentionsInfectionConcern = lower.includes("infection") || lower.includes("oozing") || lower.includes("crusting");
  const mentionsStatinIntolerance = lower.includes("muscle ache") || lower.includes("muscle aches") || lower.includes("intolerance");
  const possibleBacterialPattern =
    (lower.includes("amoxicillin") || lower.includes("doxycycline") || lower.includes("antibiotic")) &&
    (lower.includes("fever") || Boolean(temperatureValue));
  const hasDraftableMedicationIntent =
    Boolean(mentionedMedication) &&
    (lower.includes("amoxicillin") ||
      lower.includes("doxycycline") ||
      lower.includes("possible") ||
      lower.includes("discuss") ||
      lower.includes("start") ||
      lower.includes("consider"));

  if (pathwayHint === "eczema" || (pathwayHint === "auto" && lower.includes("eczema"))) {
    return {
      encounter: {
        resourceType: "Encounter",
        id: buildResourceId("encounter"),
        className: "primary-care",
        reason: "Eczema follow-up",
        clinicianSummary: `Source input indicates eczema review${symptoms.length ? ` with ${symptoms.join(", ").toLowerCase()}` : ""}${mentionedMedication ? ` and ${mentionedMedication.toLowerCase()} discussion` : ""}.`
      },
      condition: {
        resourceType: "Condition",
        id: buildResourceId("condition"),
        codeText: "Eczema",
        clinicalStatus: "active",
        evidence: inferConditionEvidence(rawInput)
      },
      medicationRequest: includeMedicationDraft && (lower.includes("hydrocortisone") || lower.includes("cream"))
        ? {
            resourceType: "MedicationRequest",
            id: buildResourceId("medreq"),
            medicationText: mentionedMedication || "Topical emollient cream",
            dosageInstruction: "Apply twice daily for 7 days",
            reason: "Drafted from intake note for clinician review",
            confidence: 0.9
          }
        : undefined,
      observations: [
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Skin review",
          valueText: symptoms.length ? `${symptoms.join(", ")} referenced in source input.` : "Localized rash symptoms referenced in source input.",
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Infection red flags",
          valueText: lower.includes("no infection")
            ? "No infection concerns described."
            : mentionsInfectionConcern
              ? "Possible infection concern described and needs clinician confirmation."
              : "Infection red flags not clearly documented.",
          status: "preliminary"
        }
      ]
    };
  }

  if (pathwayHint === "hypertension" || (pathwayHint === "auto" && (lower.includes("blood pressure") || lower.includes("hypertension")))) {
    return {
      encounter: {
        resourceType: "Encounter",
        id: buildResourceId("encounter"),
        className: "primary-care",
        reason: "Hypertension follow-up",
        clinicianSummary: `Intake describes a chronic disease review focused on blood pressure management${mentionsMissedDoses ? " with adherence concerns noted" : ""}.`
      },
      condition: {
        resourceType: "Condition",
        id: buildResourceId("condition"),
        codeText: "Hypertension",
        clinicalStatus: "active",
        evidence: inferConditionEvidence(rawInput)
      },
      observations: [
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Blood pressure",
          valueText: bpValue,
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Medication adherence",
          valueText: mentionsMissedDoses ? "Possible adherence issue mentioned in source input." : "Adherence not clearly documented in source input.",
          status: "preliminary"
        }
      ]
    };
  }

  if (pathwayHint === "respiratory" || (pathwayHint === "auto" && (lower.includes("cough") || lower.includes("fever") || lower.includes("amoxicillin")))) {
    return {
      encounter: {
        resourceType: "Encounter",
        id: buildResourceId("encounter"),
        className: "primary-care",
        reason: "Acute respiratory complaint",
        clinicianSummary: symptoms.length
          ? `Intake suggests ${symptoms.join(", ").toLowerCase()} symptoms requiring clinician review.`
          : "Intake suggests acute respiratory symptoms requiring clinician review."
      },
      condition: {
        resourceType: "Condition",
        id: buildResourceId("condition"),
        codeText: possibleBacterialPattern ? "Possible bacterial respiratory infection" : "Viral upper respiratory infection",
        clinicalStatus: "provisional",
        evidence: inferConditionEvidence(rawInput)
      },
      medicationRequest: includeMedicationDraft && hasDraftableMedicationIntent
        ? {
            resourceType: "MedicationRequest",
            id: buildResourceId("medreq"),
            medicationText: mentionedMedication || "Amoxicillin",
            dosageInstruction: "500mg three times daily",
            reason: "Mentioned in source input and drafted for clinician confirmation",
            confidence: 0.62
          }
        : undefined,
      observations: [
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Temperature",
          valueText: temperatureValue || (lower.includes("fever") ? "Fever mentioned without exact value." : ""),
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Red flag symptoms",
          valueText: inferRedFlags(rawInput),
          status: "preliminary"
        }
      ]
    };
  }

  if (pathwayHint === "lipid" || (pathwayHint === "auto" && (lower.includes("cholesterol") || lower.includes("lipid") || lower.includes("statin")))) {
    return {
      encounter: {
        resourceType: "Encounter",
        id: buildResourceId("encounter"),
        className: "primary-care",
        reason: "Lipid management review",
        clinicianSummary: `Source input suggests cholesterol or statin review${mentionsStatinIntolerance ? " with prior intolerance concerns" : ""} needing clinician confirmation.`
      },
      condition: {
        resourceType: "Condition",
        id: buildResourceId("condition"),
        codeText: "Hyperlipidaemia",
        clinicalStatus: "active",
        evidence: inferConditionEvidence(rawInput)
      },
      medicationRequest: includeMedicationDraft && mentionedMedication
        ? {
            resourceType: "MedicationRequest",
            id: buildResourceId("medreq"),
            medicationText: mentionedMedication,
            dosageInstruction: "One tablet nightly",
            reason: "Medication mentioned in source input for clinician review",
            confidence: lower.includes("possible") ? 0.64 : 0.72
          }
        : undefined,
      observations: [
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "LDL cholesterol",
          valueText: ldlValue,
          status: "preliminary"
        },
        {
          resourceType: "Observation",
          id: buildResourceId("obs"),
          codeText: "Medication intolerance history",
          valueText: mentionsStatinIntolerance
            ? "Possible prior statin intolerance described in source input."
            : "Intolerance history not clearly documented.",
          status: "preliminary"
        }
      ]
    };
  }

  return {
    encounter: {
      resourceType: "Encounter",
      id: buildResourceId("encounter"),
      className: "primary-care",
      reason: pathwayHint !== "auto" && pathwayHint !== "general" ? `${titleCase(pathwayHint)} review` : "General primary care review",
      clinicianSummary: "Generated from intake text for initial clinician review."
    },
    condition: {
      resourceType: "Condition",
      id: buildResourceId("condition"),
      codeText: "Primary care follow-up",
      clinicalStatus: "provisional",
      evidence: "General clinical concerns described in the intake text."
    },
    observations: [
      {
        resourceType: "Observation",
        id: buildResourceId("obs"),
        codeText: "Source summary",
        valueText: buildInputSummary(rawInput),
        status: "preliminary"
      },
      {
        resourceType: "Observation",
        id: buildResourceId("obs"),
        codeText: "Missing structured detail",
        valueText: "Reason, condition, and review details require clinician confirmation.",
        status: "preliminary"
      }
    ]
  };
}
