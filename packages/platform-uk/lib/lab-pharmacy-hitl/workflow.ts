/**
 * Milestone C3 — pure stage / review transitions for lab & pharmacy HITL.
 * Reuses P1-LAB ServiceRequest stub builder; never touches live connectors.
 */

import { randomUUID } from "crypto";

import { buildLabServiceRequestStubs } from "@/lib/lab-order-agent";
import type { ClinicalPersona } from "@/lib/user-scope";
import type { AppRole } from "@/lib/permission-matrix";
import type { ReviewCase } from "@/lib/types";

import { LAB_PHARMACY_HITL_HONESTY } from "./honesty";
import type {
  LabPharmacyAuditEvent,
  LabPharmacyDraft,
  LabPharmacyKind,
  LabPharmacyReviewDecision,
  ReviewLabPharmacyDraftInput,
  StageLabPharmacyDraftInput,
} from "./types";

export function assertSyntheticPatientId(id: string) {
  const trimmed = id.trim();
  if (!trimmed) throw new Error("syntheticPatientId is required");
  if (/nhs|real.?patient/i.test(trimmed)) {
    throw new Error("syntheticPatientId must be a synthetic fixture id");
  }
  return trimmed;
}

export function normalizeItems(items: string[]): string[] {
  const out = [...new Set(items.map((x) => x.trim()).filter(Boolean))];
  if (!out.length) throw new Error("At least one investigation / medication item is required");
  return out;
}

function auditEvent(
  action: LabPharmacyAuditEvent["action"],
  actor: string,
  detail: string,
  roleHint: string
): LabPharmacyAuditEvent {
  return {
    id: `lph-audit-${randomUUID()}`,
    at: new Date().toISOString(),
    actor,
    action,
    detail,
    roleHint,
  };
}

export function defaultTitle(kind: LabPharmacyKind, items: string[]): string {
  if (kind === "lab") {
    return `Lab draft · ${items.length} investigation(s)`;
  }
  return `Pharmacy draft · ${items.length} item(s)`;
}

export function defaultSummary(kind: LabPharmacyKind, items: string[]): string {
  if (kind === "lab") {
    return `GP-staged lab investigations pending lab-role HITL: ${items.join(", ")}`;
  }
  return `GP-staged pharmacy / adherence draft pending pharmacist HITL: ${items.join(", ")}`;
}

/**
 * Stage a lab or pharmacy draft for the multi-role HITL loop.
 * Lab drafts attach P1-LAB ServiceRequest stubs (status: draft) — never active / live.
 */
export function stageLabPharmacyDraft(input: StageLabPharmacyDraftInput): LabPharmacyDraft {
  const syntheticPatientId = assertSyntheticPatientId(input.syntheticPatientId);
  const items = normalizeItems(input.items);
  const kind = input.kind;
  const now = new Date().toISOString();
  const id = `lph-${kind}-${randomUUID()}`;
  const roleHint = input.roleHint ?? "gp";

  const serviceRequestDrafts =
    kind === "lab"
      ? buildLabServiceRequestStubs(
          {
            id: input.caseId ?? id,
          } as ReviewCase,
          items
        )
      : undefined;

  return {
    id,
    kind,
    status: "pending_review",
    title: input.title?.trim() || defaultTitle(kind, items),
    summary: input.summary?.trim() || defaultSummary(kind, items),
    syntheticPatientId,
    careEpisodeId: input.careEpisodeId?.trim() || null,
    caseId: input.caseId?.trim() || null,
    organisationId: input.organisationId?.trim() || null,
    scopeKey: input.scopeKey,
    items,
    serviceRequestDrafts,
    stagedBy: input.actor,
    stagedAt: now,
    auditTrail: [
      auditEvent(
        "stage",
        input.actor,
        kind === "lab"
          ? `Lab draft staged · ${items.length} ServiceRequest stub(s) · ehrWrite:false`
          : `Pharmacy draft staged · ${items.length} item(s) · liveEps:false · ehrWrite:false`,
        roleHint
      ),
    ],
    ...LAB_PHARMACY_HITL_HONESTY,
  };
}

export function canStageDraft(role: AppRole, persona: ClinicalPersona | null): boolean {
  if (role === "operations_lead") return true;
  if (role === "clinical_reviewer") {
    // GP stages; pharmacist may also stage a pharmacy concern for peer review.
    return persona === "gp" || persona === "clinical-pharmacist" || persona === null;
  }
  return false;
}

export function canReviewDraft(
  kind: LabPharmacyKind,
  role: AppRole,
  persona: ClinicalPersona | null
): boolean {
  if (role === "operations_lead") {
    // Lab operator persona rides practice-manager → operations_lead; ops may review either queue in eval.
    return true;
  }
  if (role !== "clinical_reviewer") return false;
  if (kind === "lab") {
    // Lab product queue is primarily ops/lab; clinicians may observe / facilitate but not Accept as GP by default.
    // Allow clinical_reviewer for facilitator multi-role sessions (HCP eval).
    return true;
  }
  // Pharmacy: pharmacist primary; GP co-accountable for facilitation.
  return persona === "clinical-pharmacist" || persona === "gp" || persona === null;
}

export function applyLabPharmacyReview(
  draft: LabPharmacyDraft,
  input: Omit<ReviewLabPharmacyDraftInput, "draftId">
): LabPharmacyDraft {
  if (draft.status !== "pending_review" && draft.status !== "staged") {
    throw new Error(`Cannot review draft in status ${draft.status}`);
  }

  const decision = input.decision;
  if (!["accept", "edit", "reject"].includes(decision)) {
    throw new Error("decision must be accept | edit | reject");
  }

  if (decision === "edit") {
    const edited = input.editedContent?.trim();
    if (!edited) throw new Error("editedContent is required for edit decisions");
  }

  const now = new Date().toISOString();
  const roleHint = input.roleHint ?? (draft.kind === "lab" ? "lab" : "pharmacist");
  const note = input.note?.trim() || undefined;

  const nextStatus =
    decision === "accept" ? "accepted" : decision === "edit" ? "edited" : "rejected";

  const detailParts = [
    `${decision} on ${draft.kind} draft`,
    note ? `note=${note}` : null,
    decision === "edit" ? `editedContent=${input.editedContent!.trim()}` : null,
    "live:false",
    "ehrWrite:false",
  ].filter(Boolean);

  return {
    ...draft,
    status: nextStatus,
    reviewedBy: input.actor,
    reviewedAt: now,
    reviewDecision: decision as LabPharmacyReviewDecision,
    reviewNote: note,
    editedContent: decision === "edit" ? input.editedContent!.trim() : draft.editedContent,
    items:
      decision === "edit" && input.editedContent
        ? normalizeItems(input.editedContent.split(/[,\n;]+/))
        : draft.items,
    auditTrail: [
      ...draft.auditTrail,
      auditEvent(decision, input.actor, detailParts.join(" · "), roleHint),
    ],
    ...LAB_PHARMACY_HITL_HONESTY,
  };
}

export function filterQueue(
  drafts: LabPharmacyDraft[],
  options: { kind?: LabPharmacyKind; status?: LabPharmacyDraft["status"] | "open"; organisationId?: string | null }
): LabPharmacyDraft[] {
  return drafts.filter((d) => {
    if (options.kind && d.kind !== options.kind) return false;
    if (options.organisationId && d.organisationId && d.organisationId !== options.organisationId) {
      return false;
    }
    if (options.status === "open") {
      return d.status === "pending_review" || d.status === "staged";
    }
    if (options.status && d.status !== options.status) return false;
    return true;
  });
}

/** Public honesty payload for API / UI surfaces. */
export function labPharmacyHitlCapabilities() {
  return {
    ...LAB_PHARMACY_HITL_HONESTY,
    decisions: ["accept", "edit", "reject"] as const,
    kinds: ["lab", "pharmacy"] as const,
    docPath: "docs/milestone-c/LAB_PHARMACY_HITL.md",
  };
}
