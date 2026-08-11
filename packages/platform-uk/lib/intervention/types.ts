/**
 * Intervention domain — shared summary shape (D3, docs/PHASED_BUILD_PLAN_D.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-2).
 *
 * The migration plan's own framing ("a shared InterventionDraft base type
 * that existing draft types extend additively") is honoured here in a way
 * that is honest about what the existing types actually share today: none
 * of `HealthPlanDraft`, `CoachingDraft`, `DiabetesCoachingDraft`, or the
 * referral-package shapes (`ReviewQueueItem` + `ServiceRequestResource`,
 * lib/types.ts) carry an identical field set — `HealthPlanDraft` has its
 * own `id`/`status`, `CoachingDraft`/`DiabetesCoachingDraft` have neither,
 * and the referral package's `hitlRequired`/`ehrWrite` are platform-wide
 * invariants rather than literal fields on `ServiceRequestResource` itself.
 *
 * Rather than force those four real, independently-evolving types into one
 * literal structural shape (which would either be dishonest about fields
 * that don't exist, or require modifying all four call sites — outside this
 * phase's additive, zero-runtime-change scope), this module defines
 * `InterventionDraftSummary` as a NEW read-only projection, and
 * `lib/intervention/adapters.ts` provides one pure mapping function per
 * domain from the real type to this summary. No existing draft-producing
 * type or function is modified — this is purely additive.
 */

export type InterventionDomain = "health_plan" | "coaching" | "diabetes_coaching" | "referral";

export type InterventionDraftStatus = "draft" | "accepted" | "rejected";

export type InterventionDraftSummary = {
  id: string;
  domain: InterventionDomain;
  patientId: string;
  patientLabel: string;
  title: string;
  status: InterventionDraftStatus;
  /** Restated as a literal, not read off a field that may not exist on every source type — every Intervention-domain draft in this codebase is HITL-gated, without exception. */
  hitlRequired: true;
  /** Restated as a literal — no Intervention-domain draft writes to a live EHR anywhere in this codebase (Track A). */
  ehrWrite: false;
};
