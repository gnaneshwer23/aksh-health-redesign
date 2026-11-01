/**
 * Milestone C3 — multi-role lab / pharmacy HITL draft + review shapes.
 * Synthetic staging only; never live vendor side effects.
 */

import type { ServiceRequestResource } from "@/lib/types";

export type LabPharmacyKind = "lab" | "pharmacy";

export type LabPharmacyDraftStatus =
  | "staged"
  | "pending_review"
  | "accepted"
  | "edited"
  | "rejected";

export type LabPharmacyReviewDecision = "accept" | "edit" | "reject";

export type LabPharmacyAuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: "stage" | LabPharmacyReviewDecision;
  detail: string;
  roleHint: string;
};

export type LabPharmacyDraft = {
  id: string;
  kind: LabPharmacyKind;
  status: LabPharmacyDraftStatus;
  title: string;
  summary: string;
  /** Synthetic patient fixture id only. */
  syntheticPatientId: string;
  careEpisodeId: string | null;
  caseId: string | null;
  organisationId: string | null;
  scopeKey: string;
  /** Lab investigations or pharmacy medication / barrier text. */
  items: string[];
  /** Present for lab drafts after GP stage (P1-LAB ServiceRequest stubs). */
  serviceRequestDrafts?: ServiceRequestResource[];
  stagedBy: string;
  stagedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewDecision?: LabPharmacyReviewDecision;
  reviewNote?: string;
  editedContent?: string;
  auditTrail: LabPharmacyAuditEvent[];
  live: false;
  liveNhsLab: false;
  livePrescribing: false;
  liveEps: false;
  ehrWrite: false;
  hitlRequired: true;
  clinicalValidationClaim: false;
  syntheticOnly: true;
};

export type StageLabPharmacyDraftInput = {
  kind: LabPharmacyKind;
  syntheticPatientId: string;
  items: string[];
  title?: string;
  summary?: string;
  careEpisodeId?: string | null;
  caseId?: string | null;
  organisationId?: string | null;
  scopeKey: string;
  actor: string;
  roleHint?: string;
};

export type ReviewLabPharmacyDraftInput = {
  draftId: string;
  decision: LabPharmacyReviewDecision;
  actor: string;
  roleHint?: string;
  note?: string;
  /** Required when decision is edit — revised investigation / medication text. */
  editedContent?: string;
};
