import { buildValidationIssues } from "../export-mapping";
import type {
  ChecklistItem,
  ClinicalConcern,
  ClinicalRuleResult,
  FinalizationState,
  MedicationRequestResource,
  ReviewerDraftAction,
  ReviewerGuidance,
  ReviewCase,
  SafetyFlag,
  Severity
} from "../types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function deriveMedicationFlags(medicationRequest: MedicationRequestResource | undefined, reviewCase: ReviewCase): SafetyFlag[] {
  if (!medicationRequest) return [];

  const medication = normalize(medicationRequest.medicationText);
  const allergyFlags =
    reviewCase.safetyContext.allergies.some((allergy) => medication.includes(normalize(allergy)) || normalize(allergy).includes("penicillin") && medication.includes("amoxicillin"))
      ? [
          {
            id: `${reviewCase.id}-allergy`,
            label: "Possible allergy conflict",
            severity: "high" as const,
            detail: `Draft medication "${medicationRequest.medicationText}" may conflict with allergy list: ${reviewCase.safetyContext.allergies.join(", ")}.`
          }
        ]
      : [];

  const intoleranceFlags =
    reviewCase.safetyContext.allergies.some(
      (allergy) => normalize(allergy).includes("intolerance") && medication.includes(normalize(allergy).replace(" intolerance", ""))
    )
      ? [
          {
            id: `${reviewCase.id}-intolerance`,
            label: "Prior intolerance needs review",
            severity: "high" as const,
            detail: `Draft medication "${medicationRequest.medicationText}" overlaps with documented intolerance: ${reviewCase.safetyContext.allergies.join(", ")}.`
          }
        ]
      : [];

  const ddiFlags =
    reviewCase.safetyContext.currentMedications.some(
      (current) =>
        normalize(current).includes("clarithromycin") &&
        (medication.includes("amoxicillin") || medication.includes("macrolide"))
    )
      ? [
          {
            id: `${reviewCase.id}-ddi`,
            label: "Medication interaction review needed",
            severity: "medium" as const,
            detail: `Current medications (${reviewCase.safetyContext.currentMedications.join(", ")}) require clinician review before finalizing "${medicationRequest.medicationText}".`
          }
        ]
      : [];

  const confidenceFlags =
    medicationRequest.confidence < 0.7
      ? [
          {
            id: `${reviewCase.id}-confidence`,
            label: "Low-confidence medication extraction",
            severity: "medium" as const,
            detail: `Medication draft confidence is ${Math.round(medicationRequest.confidence * 100)}%, which requires explicit clinician confirmation.`
          }
        ]
      : [];

  return [...allergyFlags, ...intoleranceFlags, ...ddiFlags, ...confidenceFlags];
}

export function deriveSafetyFlags(reviewCase: ReviewCase): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const { draft } = reviewCase;
  const inputSummary = normalize(reviewCase.input.summary);

  flags.push(...deriveMedicationFlags(draft.medicationRequest, reviewCase));

  if (reviewCase.input.transcriptConfidence < 0.7) {
    flags.push({
      id: `${reviewCase.id}-transcript`,
      label: "Low-confidence source input",
      severity: "medium",
      detail: `Source ${reviewCase.input.sourceType} confidence is ${Math.round(reviewCase.input.transcriptConfidence * 100)}%, so clinician review should verify extracted details.`
    });
  }

  const missingObservation = draft.observations.find(
    (observation) => normalize(observation.codeText) === "blood pressure" && !normalize(observation.valueText)
  );

  if (missingObservation) {
    flags.push({
      id: `${reviewCase.id}-observation`,
      label: "Missing required observation field",
      severity: "medium",
      detail: "Blood pressure observation is present but has no structured value."
    });
  }

  if (!normalize(draft.encounter.reason) || !normalize(draft.condition.codeText)) {
    flags.push({
      id: `${reviewCase.id}-required-fields`,
      label: "Required structured field missing",
      severity: "high",
      detail: "Encounter reason and condition code text must both be populated before acceptance."
    });
  }

  const hasPositiveBreathingConcern =
    inputSummary.includes("wheeze") ||
    (inputSummary.includes("shortness of breath") && !inputSummary.includes("no shortness of breath")) ||
    (inputSummary.includes("breathlessness") && !inputSummary.includes("no breathlessness"));
  const hasPositiveFever =
    (inputSummary.includes("fever") && !inputSummary.includes("no fever")) || /\b3[8-9](?:\.\d)?\b/.test(inputSummary);

  if (hasPositiveBreathingConcern && hasPositiveFever) {
    flags.push({
      id: `${reviewCase.id}-respiratory-escalation`,
      label: "Respiratory escalation review needed",
      severity: "high",
      detail:
        "Breathlessness or wheeze appears alongside fever in the source input. Finalization should include explicit clinician confirmation of the escalation decision."
    });
  }

  const temperatureObservation = draft.observations.find((observation) => normalize(observation.codeText) === "temperature");
  const temperatureValue = normalize(temperatureObservation?.valueText ?? "");
  if (
    inputSummary.includes("no fever") &&
    (temperatureValue.includes("fever") || /\b3[8-9](?:\.\d)?\b/.test(temperatureValue))
  ) {
    flags.push({
      id: `${reviewCase.id}-source-conflict`,
      label: "Conflicting source evidence",
      severity: "medium",
      detail: "The source says fever was absent, but the structured temperature observation suggests fever or an elevated value."
    });
  }

  return flags;
}

function ruleCategoryForSafetyFlag(flag: SafetyFlag): ClinicalRuleResult["category"] {
  if (flag.id.endsWith("-allergy") || flag.id.endsWith("-intolerance") || flag.id.endsWith("-ddi")) return "medication_risk";
  if (flag.id.endsWith("-observation") || flag.id.endsWith("-required-fields")) return "missing_data";
  if (flag.id.endsWith("-transcript") || flag.id.endsWith("-confidence") || flag.id.endsWith("-source-conflict")) return "source_quality";
  if (flag.id.endsWith("-respiratory-escalation")) return "escalation";
  return "review_governance";
}

function reviewerActionForSafetyFlag(flag: SafetyFlag) {
  if (flag.id.endsWith("-allergy") || flag.id.endsWith("-intolerance")) {
    return "Confirm medication appropriateness against allergy or intolerance history and record an override before acceptance.";
  }
  if (flag.id.endsWith("-ddi")) {
    return "Review the current medication list for interaction risk and document the decision rationale.";
  }
  if (flag.id.endsWith("-observation")) {
    return "Add the missing blood pressure value or defer the case until the value is available.";
  }
  if (flag.id.endsWith("-required-fields")) {
    return "Populate encounter reason and condition text before attempting finalization.";
  }
  if (flag.id.endsWith("-respiratory-escalation")) {
    return "Document the respiratory escalation decision and whether urgent review has been ruled in or out.";
  }
  return "Verify the extracted value against the source input and document reviewer confidence.";
}

export function deriveClinicalRuleResults(reviewCase: ReviewCase): ClinicalRuleResult[] {
  const safetyResults = deriveSafetyFlags(reviewCase).map((flag) => ({
    id: flag.id,
    ruleId: flag.id.replace(`${reviewCase.id}-`, ""),
    label: flag.label,
    severity: flag.severity,
    category: ruleCategoryForSafetyFlag(flag),
    finalizationImpact: flag.severity === "high" ? "cannot_finalize" as const : "warning" as const,
    source: "safety" as const,
    detail: flag.detail,
    requiredReviewerAction: reviewerActionForSafetyFlag(flag)
  }));
  const validationResults = buildValidationIssues(reviewCase.draft).map((issue) => ({
    id: issue.id,
    ruleId: issue.id.replace(`${reviewCase.id}-`, ""),
    label: issue.label,
    severity: issue.severity,
    category: issue.category === "blocking" ? "missing_data" as const : "export_validation" as const,
    finalizationImpact: issue.category === "blocking" ? "cannot_finalize" as const : "warning" as const,
    source: "validation" as const,
    detail: issue.detail,
    requiredReviewerAction:
      issue.category === "blocking"
        ? "Complete the missing structured field before acceptance."
        : "Review and strengthen the export evidence before external sharing.",
    fieldPath: issue.fieldPath
  }));

  return [...safetyResults, ...validationResults];
}

export function deriveAcceptanceBlockers(reviewCase: ReviewCase) {
  const blockers: string[] = [];
  const safetyFlags = deriveSafetyFlags(reviewCase);
  const validationIssues = buildValidationIssues(reviewCase.draft);
  const hasHighSeverity = safetyFlags.some((flag) => flag.severity === "high");
  const hasRequiredFieldIssue = validationIssues.some(
    (issue) => issue.category === "blocking" && (issue.id.endsWith("-reason") || issue.id.endsWith("-condition"))
  );

  if (hasRequiredFieldIssue) {
    blockers.push("Required structured fields are still missing.");
  }

  if (
    validationIssues.some(
      (issue) =>
        issue.category === "blocking" &&
        issue.label === "Blood pressure value missing"
    )
  ) {
    blockers.push("Blood pressure observation is incomplete and must be filled before acceptance.");
  }

  if (hasHighSeverity && !reviewCase.reviewSummary?.overrideReason?.trim()) {
    blockers.push("A high-severity issue is present and requires an override reason before acceptance.");
  }

  return blockers;
}

export function deriveFinalizationState(reviewCase: ReviewCase): FinalizationState {
  if (deriveAcceptanceBlockers(reviewCase).length) {
    return "blocked";
  }

  const safetyFlags = deriveSafetyFlags(reviewCase);
  const validationIssues = buildValidationIssues(reviewCase.draft);

  if (safetyFlags.length || validationIssues.some((issue) => issue.category === "warning")) {
    return "warn";
  }

  return "ready";
}

export function deriveClinicalConcerns(reviewCase: ReviewCase): ClinicalConcern[] {
  const blockers = deriveAcceptanceBlockers(reviewCase).map((detail, index) => ({
    id: `blocker-${reviewCase.id}-${index}`,
    label: "Finalization blocker",
    detail,
    severity: "high" as const,
    source: "blocker" as const
  }));
  const safetyFlags = deriveSafetyFlags(reviewCase).map((flag) => ({
    id: flag.id,
    label: flag.label,
    detail: flag.detail,
    severity: flag.severity,
    source: "safety" as const
  }));
  const validationIssues = buildValidationIssues(reviewCase.draft).map((issue) => ({
    id: issue.id,
    label: issue.label,
    detail: issue.detail,
    severity: issue.severity,
    source: "validation" as const
  }));

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sourceOrder = { blocker: 0, safety: 1, validation: 2 };

  return [...blockers, ...safetyFlags, ...validationIssues].sort((left, right) => {
    const severityDelta = severityOrder[left.severity] - severityOrder[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return sourceOrder[left.source] - sourceOrder[right.source];
  });
}

export function deriveReviewerGuidance(reviewCase: ReviewCase): ReviewerGuidance[] {
  const safetyFlags = deriveSafetyFlags(reviewCase);
  const validationIssues = buildValidationIssues(reviewCase.draft);

  const guidance: ReviewerGuidance[] = [];

  if (
    validationIssues.some(
      (issue) => issue.category === "blocking" && (issue.id.endsWith("-reason") || issue.id.endsWith("-condition"))
    )
  ) {
    guidance.push({
      id: `${reviewCase.id}-confirm-structured-fields`,
      title: "Confirm the core diagnosis and encounter reason",
      instruction: "Populate and verify the encounter reason and condition text before attempting acceptance.",
      category: "must_confirm",
      severity: "high"
    });
  }

  if (validationIssues.some((issue) => issue.label === "Blood pressure value missing")) {
    guidance.push({
      id: `${reviewCase.id}-confirm-bp`,
      title: "Confirm the missing blood pressure value",
      instruction: "Add the exact blood pressure reading or defer the case until the vital is available.",
      category: "must_confirm",
      severity: "high"
    });
  }

  if (safetyFlags.some((flag) => flag.id.endsWith("-allergy") || flag.id.endsWith("-intolerance"))) {
    guidance.push({
      id: `${reviewCase.id}-override-medication-risk`,
      title: "Resolve medication safety risk before acceptance",
      instruction: "Confirm whether the drafted medication is clinically appropriate against the documented allergy or intolerance. If proceeding, record a specific override reason.",
      category: "override",
      severity: "high"
    });
  }

  if (safetyFlags.some((flag) => flag.id.endsWith("-ddi"))) {
    guidance.push({
      id: `${reviewCase.id}-confirm-ddi`,
      title: "Review potential drug interaction",
      instruction: "Check the current medication list against the drafted medication and document why the interaction risk is acceptable or update the draft.",
      category: "must_confirm",
      severity: "medium"
    });
  }

  if (safetyFlags.some((flag) => flag.id.endsWith("-transcript") || flag.id.endsWith("-confidence"))) {
    guidance.push({
      id: `${reviewCase.id}-confirm-low-confidence`,
      title: "Confirm low-confidence extracted details",
      instruction: "Re-check the generated medication and structured details against the source note or transcript before acceptance.",
      category: "must_confirm",
      severity: "medium"
    });
  }

  if (safetyFlags.some((flag) => flag.id.endsWith("-respiratory-escalation"))) {
    guidance.push({
      id: `${reviewCase.id}-confirm-escalation`,
      title: "Confirm respiratory escalation decision",
      instruction: "Document whether escalation symptoms are present and whether urgent review or escalation has been ruled in or out.",
      category: "must_confirm",
      severity: "high"
    });
  }

  if (
    validationIssues.some(
      (issue) =>
        issue.category === "warning" &&
        (issue.fieldPath === "Encounter.note.text" || issue.fieldPath?.includes("valueString") || issue.fieldPath?.includes("dosageInstruction"))
    )
  ) {
    guidance.push({
      id: `${reviewCase.id}-missing-evidence`,
      title: "Strengthen missing review evidence",
      instruction: "Fill in missing supporting details such as clinician summary, dosage instruction, or non-critical observation values before external sharing.",
      category: "missing_evidence",
      severity: "medium"
    });
  }

  const seen = new Set<string>();
  return guidance.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function deriveReviewerChecklist(reviewCase: ReviewCase): ChecklistItem[] {
  const savedChecklist = reviewCase.reviewSummary?.guidanceChecklist ?? [];
  const savedById = new Map(savedChecklist.map((item) => [item.id, item]));

  return deriveReviewerGuidance(reviewCase).map((item) => {
    const saved = savedById.get(item.id);

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      completed: saved?.completed ?? false,
      confirmationNote: saved?.confirmationNote ?? "",
      completedAt: saved?.completedAt,
      completedBy: saved?.completedBy
    };
  });
}

function actionLabelForGuidanceCategory(category: ReviewerGuidance["category"]) {
  if (category === "override") {
    return "Record explicit override decision";
  }

  if (category === "missing_evidence") {
    return "Add supporting evidence before sharing";
  }

  return "Confirm reviewer action";
}

export function deriveReviewerDraftActions(reviewCase: ReviewCase): ReviewerDraftAction[] {
  const guidance = deriveReviewerGuidance(reviewCase);
  const checklistById = new Map(deriveReviewerChecklist(reviewCase).map((item) => [item.id, item]));

  return guidance.map((item) => {
    const checklistItem = checklistById.get(item.id);

    return {
      id: item.id,
      title: item.title,
      actionLabel: actionLabelForGuidanceCategory(item.category),
      instruction: item.instruction,
      category: item.category,
      severity: item.severity,
      status: checklistItem?.completed ? "confirmed" : "open",
      confirmationNote: checklistItem?.confirmationNote,
      completedAt: checklistItem?.completedAt,
      completedBy: checklistItem?.completedBy
    };
  });
}
