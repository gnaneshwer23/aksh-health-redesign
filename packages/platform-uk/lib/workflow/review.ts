import {
  buildGenerationTrace,
  buildInputSummary,
  extractPatientLabel,
  inferDraftFromInput,
  inferSafetyContext,
  inferTranscriptConfidence
} from "../intake-generation";
import { inferSyntheticSourceProfile } from "../synthetic-source-profiles";
import type { IntakeGenerationOptions } from "../intake-generation";
import { formatCaseTimestamp } from "../time-format";
import type {
  AuditEvent,
  ConsultationInput,
  CoordinationRiskTriage,
  FieldChange,
  FhirBundleDraft,
  ReviewCase
} from "../types";
import {
  deriveAcceptanceBlockers,
  deriveReviewerChecklist,
  deriveSafetyFlags
} from "./safety";

function parseCaseTimestamp(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function durationMinutes(start: string | undefined, end: string | undefined) {
  const startDate = parseCaseTimestamp(start);
  const endDate = parseCaseTimestamp(end);

  if (!startDate || !endDate) {
    return null;
  }

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

function categorizeBlocker(blocker: string) {
  const normalized = blocker.toLowerCase();

  if (normalized.includes("allergy") || normalized.includes("intolerance") || normalized.includes("medication")) {
    return "Medication safety";
  }

  if (normalized.includes("blood pressure") || normalized.includes("observation") || normalized.includes("vital")) {
    return "Missing vitals";
  }

  if (normalized.includes("value")) {
    return "Missing structured data";
  }

  if (normalized.includes("checklist") || normalized.includes("confirm")) {
    return "Reviewer governance";
  }

  if (normalized.includes("confidence") || normalized.includes("source")) {
    return "Source confidence";
  }

  return "Clinical review";
}

export function deriveReviewAnalytics(cases: ReviewCase[]) {
  const blockerCounts = new Map<string, number>();
  const safetyCounts = new Map<string, number>();
  const decisionCounts = {
    accept: 0,
    reject: 0,
    defer: 0,
    pending: 0
  };
  const decisionDurations: number[] = [];

  for (const item of cases) {
    const blockers = deriveAcceptanceBlockers(item);
    for (const blocker of blockers) {
      const category = categorizeBlocker(blocker);
      blockerCounts.set(category, (blockerCounts.get(category) ?? 0) + 1);
    }

    const flags = deriveSafetyFlags(item);
    for (const flag of flags) {
      safetyCounts.set(flag.label, (safetyCounts.get(flag.label) ?? 0) + 1);
    }

    const decision = item.reviewSummary?.lastDecision;
    if (!decision) {
      decisionCounts.pending += 1;
    } else {
      decisionCounts[decision] += 1;
      const minutes = durationMinutes(item.input.capturedAt, item.reviewSummary?.lastDecisionAt);
      if (minutes !== null) {
        decisionDurations.push(minutes);
      }
    }
  }

  const decidedCount = decisionCounts.accept + decisionCounts.reject + decisionCounts.defer;
  const acceptanceRate = decidedCount ? Math.round((decisionCounts.accept / decidedCount) * 100) : 0;
  const averageDecisionMinutes = decisionDurations.length
    ? Math.round(decisionDurations.reduce((total, value) => total + value, 0) / decisionDurations.length)
    : 0;

  return {
    blockerCategories: [...blockerCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3),
    safetyCategories: [...safetyCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 4),
    decisionCounts,
    acceptanceRate,
    averageDecisionMinutes
  };
}

export function createCoordinationRiskTriage(input: {
  status: CoordinationRiskTriage["status"];
  owner: string;
  note?: string;
  updatedBy: string;
}): CoordinationRiskTriage {
  return {
    status: input.status,
    owner: input.owner,
    note: input.note?.trim() || undefined,
    updatedAt: formatCaseTimestamp(),
    updatedBy: input.updatedBy
  };
}

export function createAuditEvent(label: string, actor: string): AuditEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    category: "system",
    label,
    actor,
    timestamp: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

export function createReviewerEvent(
  category: AuditEvent["category"],
  label: string,
  actor: string,
  detail?: string
): AuditEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    category,
    label,
    actor,
    detail,
    timestamp: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

export function createFieldChange(
  sectionId: string,
  fieldKey: string,
  fieldLabel: string,
  oldValue: string,
  newValue: string,
  actor: string
): FieldChange {
  return {
    id: `chg-${Math.random().toString(36).slice(2, 10)}`,
    sectionId,
    fieldKey,
    fieldLabel,
    oldValue,
    newValue,
    actor,
    timestamp: formatCaseTimestamp()
  };
}

export function deriveChecklistAcceptanceBlockers(reviewCase: ReviewCase) {
  return deriveReviewerChecklist(reviewCase)
    .flatMap((item) => {
      if (item.category !== "must_confirm" && item.category !== "override") {
        return [];
      }

      if (!item.completed) {
        return [`Reviewer checklist is incomplete: ${item.title}.`];
      }

      if (!item.confirmationNote?.trim()) {
        return [`Reviewer checklist note is missing: ${item.title}.`];
      }

      return [];
    });
}

export function draftSectionsFromBundle(draft: FhirBundleDraft) {
  return [
    {
      id: "encounter",
      title: "Encounter",
      fields: [
        { key: "className", label: "Class", value: draft.encounter.className },
        { key: "reason", label: "Reason", value: draft.encounter.reason },
        { key: "clinicianSummary", label: "Clinician Summary", value: draft.encounter.clinicianSummary }
      ]
    },
    {
      id: "condition",
      title: "Condition",
      fields: [
        { key: "codeText", label: "Condition", value: draft.condition.codeText },
        { key: "clinicalStatus", label: "Clinical Status", value: draft.condition.clinicalStatus },
        { key: "evidence", label: "Evidence", value: draft.condition.evidence }
      ]
    },
    {
      id: "medicationRequest",
      title: "MedicationRequest",
      fields: draft.medicationRequest
        ? [
            { key: "medicationText", label: "Medication", value: draft.medicationRequest.medicationText },
            { key: "dosageInstruction", label: "Dosage", value: draft.medicationRequest.dosageInstruction },
            { key: "reason", label: "Reason", value: draft.medicationRequest.reason },
            { key: "confidence", label: "Confidence", value: `${Math.round(draft.medicationRequest.confidence * 100)}%` }
          ]
        : [{ key: "none", label: "Medication", value: "No medication request drafted" }]
    },
    ...draft.observations.map((observation) => ({
      id: observation.id,
      title: `Observation: ${observation.codeText}`,
      fields: [
        { key: "valueText", label: "Value", value: observation.valueText || "Missing value" },
        { key: "status", label: "Status", value: observation.status }
      ]
    }))
  ];
}

export function activityGroupLabel(category: AuditEvent["category"]) {
  if (category === "system") return "System";
  if (category === "reviewer_edit") return "Reviewer Edit";
  if (category === "reviewer_decision") return "Reviewer Decision";
  if (category === "reviewer_note") return "Reviewer Note";
  return "Override";
}

function buildCaseId() {
  return `case-${Math.random().toString(36).slice(2, 8)}`;
}

export function createReviewCaseFromIntake({
  options,
  patientLabel,
  rawInput,
  sourceType
}: {
  options?: IntakeGenerationOptions;
  patientLabel: string;
  rawInput: string;
  sourceType: ConsultationInput["sourceType"];
}): ReviewCase {
  const createdAt = formatCaseTimestamp();
  const resolvedPatientLabel = extractPatientLabel(patientLabel);
  const inputSummary = buildInputSummary(rawInput);
  const draft = inferDraftFromInput(rawInput, options);
  const safetyContext = inferSafetyContext(rawInput, options?.inferredContextOverrides);
  const sourceProfile = inferSyntheticSourceProfile(rawInput, sourceType, options?.sourceProfile);
  const reviewCase: ReviewCase = {
    id: buildCaseId(),
    userId: "anonymous", // Set by createReviewCase repository when user context is available
    patientLabel: resolvedPatientLabel,
    status: "pending_review",
    updatedAt: createdAt,
    summary: `${draft.encounter.reason} generated from ${sourceType} intake.`,
    input: {
      sourceType,
      sourceProfile,
      capturedAt: createdAt,
      summary: inputSummary,
      transcriptConfidence: inferTranscriptConfidence(sourceType, rawInput, options?.confidenceMode)
    },
    safetyContext,
    draft,
    generationTrace: buildGenerationTrace(rawInput, draft, safetyContext),
    auditEvents: [
      createAuditEvent("Input received", "system"),
      createAuditEvent("Draft generated", "system"),
      createAuditEvent("Safety checks completed", "system")
    ],
    reviewSummary: {},
    fieldChanges: []
  };

  return reviewCase;
}
