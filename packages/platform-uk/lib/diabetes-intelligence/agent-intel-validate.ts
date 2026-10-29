/**
 * Structured model-output validation for Phase 5 drafts.
 */

import { AGENT_INTEL_SCHEMA_VERSION } from "./agent-intel-versions";
import type {
  AgentIntelDraftKind,
  AgentIntelValidationIssue,
  AgentIntelValidationResult,
  StructuredDraftPayload,
} from "./agent-intel-types";

const REQUIRED_KINDS: AgentIntelDraftKind[] = [
  "history_summary",
  "clinical_documentation",
  "missing_information",
  "evidence_retrieval",
  "follow_up_draft",
];

export function validateStructuredDraft(
  payload: StructuredDraftPayload,
  options?: { now?: string }
): AgentIntelValidationResult {
  const issues: AgentIntelValidationIssue[] = [];
  const checkedAt = options?.now ?? new Date().toISOString();

  if (!REQUIRED_KINDS.includes(payload.kind)) {
    issues.push({
      code: "unknown_kind",
      path: "kind",
      message: `Unknown draft kind: ${payload.kind}`,
      severity: "error",
    });
  }
  if (!payload.title?.trim()) {
    issues.push({
      code: "title_required",
      path: "title",
      message: "title is required",
      severity: "error",
    });
  }
  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    issues.push({
      code: "sections_required",
      path: "sections",
      message: "at least one section is required",
      severity: "error",
    });
  } else {
    for (const [i, s] of payload.sections.entries()) {
      if (!s.id?.trim() || !s.heading?.trim() || !s.body?.trim()) {
        issues.push({
          code: "section_incomplete",
          path: `sections[${i}]`,
          message: "section requires id, heading, and body",
          severity: "error",
        });
      }
    }
  }

  if (payload.kind === "clinical_documentation") {
    if (!payload.soap) {
      issues.push({
        code: "soap_required",
        path: "soap",
        message: "clinical_documentation requires soap fields",
        severity: "error",
      });
    } else {
      for (const key of ["subjective", "objective", "assessment", "plan"] as const) {
        if (!payload.soap[key]?.trim()) {
          issues.push({
            code: "soap_field_empty",
            path: `soap.${key}`,
            message: `SOAP ${key} required`,
            severity: "error",
          });
        }
      }
    }
  }

  if (payload.kind === "missing_information") {
    if (!payload.missingFields || payload.missingFields.length === 0) {
      issues.push({
        code: "missing_fields_required",
        path: "missingFields",
        message: "missing_information draft must list missingFields",
        severity: "error",
      });
    }
  }

  if (payload.kind === "evidence_retrieval") {
    if (!payload.citations || payload.citations.length === 0) {
      issues.push({
        code: "citations_required",
        path: "citations",
        message: "evidence_retrieval requires citations",
        severity: "error",
      });
    }
  }

  if (payload.kind === "follow_up_draft") {
    if (!payload.followUpSuggestion?.title?.trim() || !payload.followUpSuggestion.ownerRole) {
      issues.push({
        code: "follow_up_required",
        path: "followUpSuggestion",
        message: "follow_up_draft requires title and ownerRole",
        severity: "error",
      });
    }
  }

  // Hard safety: refuse prescribe/treatment language as verified content
  const blob = JSON.stringify(payload).toLowerCase();
  if (/\b(auto[- ]?prescrib|autonomous treatment|write to ehr|emis write)\b/.test(blob)) {
    issues.push({
      code: "prohibited_claim",
      path: "payload",
      message: "Draft must not claim autonomous prescribe/treatment or EHR write",
      severity: "error",
    });
  }

  return {
    valid: !issues.some((i) => i.severity === "error"),
    schemaVersion: AGENT_INTEL_SCHEMA_VERSION,
    issues,
    checkedAt,
  };
}
