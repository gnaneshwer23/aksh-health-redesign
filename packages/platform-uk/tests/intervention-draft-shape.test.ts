/**
 * D3 (docs/PHASED_BUILD_PLAN_D.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-2): Intervention-domain
 * unified summary shape.
 *
 * Covers:
 *  1. Each existing draft-producing function's real output maps correctly
 *     onto the shared InterventionDraftSummary via its adapter, without the
 *     adapter mutating or requiring changes to the original type.
 *  2. describePendingInterventionDrafts aggregates a mixed set of drafts
 *     across at least three domains (health plan, coaching, diabetes
 *     coaching) for one patient, correctly excluding another patient's
 *     drafts and non-"draft"-status items.
 */

import assert from "node:assert/strict";

import { buildPersonalisedHealthPlanDraft } from "../lib/precision-health/health-plan";
import { buildNutritionCoachingDraft } from "../lib/precision-health/coaching";
import { buildNutritionDiabetesCoachingDraft } from "../lib/disease-modules/diabetes/nutrition";
import {
  healthPlanDraftToInterventionSummary,
  coachingDraftToInterventionSummary,
  diabetesCoachingDraftToInterventionSummary,
  referralQueueItemToInterventionSummary
} from "../lib/intervention/adapters";
import { describePendingInterventionDrafts } from "../lib/intervention/list-pending";
import type { ReviewQueueItem } from "../lib/types";

function testHealthPlanAdapter() {
  const draft = buildPersonalisedHealthPlanDraft({ patientId: "P100", patientLabel: "Test Patient", createdBy: "unit-test" });
  const summary = healthPlanDraftToInterventionSummary(draft);

  assert.equal(summary.domain, "health_plan");
  assert.equal(summary.patientId, "P100");
  assert.equal(summary.status, "draft");
  assert.equal(summary.hitlRequired, true);
  assert.equal(summary.ehrWrite, false);
  // Original draft is untouched by the adapter.
  assert.equal(draft.patientId, "P100");
  assert.equal(draft.hitlRequired, true);

  console.log("Intervention draft shape: HealthPlanDraft adapter maps correctly, original untouched.");
}

function testCoachingAdapter() {
  const draft = buildNutritionCoachingDraft({ patientId: "P100", patientLabel: "Test Patient" });
  const summary = coachingDraftToInterventionSummary(draft);

  assert.equal(summary.domain, "coaching");
  assert.equal(summary.patientId, "P100");
  assert.equal(summary.title, draft.title);
  assert.equal(summary.status, "draft");
  assert.equal(summary.hitlRequired, true);
  assert.equal(summary.ehrWrite, false);

  console.log("Intervention draft shape: CoachingDraft adapter maps correctly.");
}

function testDiabetesCoachingAdapter() {
  const draft = buildNutritionDiabetesCoachingDraft({ patientId: "P100", patientLabel: "Test Patient" });
  const summary = diabetesCoachingDraftToInterventionSummary(draft);

  assert.equal(summary.domain, "diabetes_coaching");
  assert.equal(summary.patientId, "P100");
  assert.equal(summary.title, draft.title);
  assert.equal(summary.status, "draft");
  assert.equal(summary.hitlRequired, true);
  assert.equal(summary.ehrWrite, false);

  console.log("Intervention draft shape: DiabetesCoachingDraft adapter maps correctly.");
}

function testReferralAdapter() {
  const item: ReviewQueueItem = {
    id: "case-1-queue-referral",
    agentId: "REFERRAL",
    itemType: "referral_package",
    status: "ACCEPTED",
    title: "DVT urgent referral package",
    summary: "Duplex ultrasound + D-dimer"
  };
  const summary = referralQueueItemToInterventionSummary(
    { id: "case-1", patientId: "P100", patientLabel: "Test Patient" },
    item
  );

  assert.equal(summary.domain, "referral");
  assert.equal(summary.patientId, "P100");
  assert.equal(summary.status, "accepted", "ReviewQueueItem status ACCEPTED maps to InterventionDraftStatus 'accepted'");
  assert.equal(summary.hitlRequired, true);
  assert.equal(summary.ehrWrite, false);

  console.log("Intervention draft shape: referral ReviewQueueItem adapter maps status correctly.");
}

function testDescribePendingInterventionDraftsAggregatesAcrossDomains() {
  const p100HealthPlan = healthPlanDraftToInterventionSummary(
    buildPersonalisedHealthPlanDraft({ patientId: "P100", patientLabel: "Test Patient", createdBy: "unit-test" })
  );
  const p100Coaching = coachingDraftToInterventionSummary(
    buildNutritionCoachingDraft({ patientId: "P100", patientLabel: "Test Patient" })
  );
  const p100Diabetes = diabetesCoachingDraftToInterventionSummary(
    buildNutritionDiabetesCoachingDraft({ patientId: "P100", patientLabel: "Test Patient" })
  );
  const p100AcceptedReferral = referralQueueItemToInterventionSummary(
    { id: "case-1", patientId: "P100", patientLabel: "Test Patient" },
    {
      id: "case-1-queue-referral",
      agentId: "REFERRAL",
      itemType: "referral_package",
      status: "ACCEPTED",
      title: "Referral",
      summary: "Already accepted — must not count as pending"
    }
  );
  // A different patient's draft must never leak into P100's pending count.
  const otherPatientDraft = coachingDraftToInterventionSummary(
    buildNutritionCoachingDraft({ patientId: "P200", patientLabel: "Other Patient" })
  );

  const result = describePendingInterventionDrafts("P100", [
    p100HealthPlan,
    p100Coaching,
    p100Diabetes,
    p100AcceptedReferral,
    otherPatientDraft
  ]);

  assert.equal(result.pendingCount, 3, "only the 3 still-draft P100 items count as pending, not the accepted referral or the other patient's draft");
  assert.equal(result.byDomain.health_plan, 1);
  assert.equal(result.byDomain.coaching, 1);
  assert.equal(result.byDomain.diabetes_coaching, 1);
  assert.equal(result.byDomain.referral, undefined, "the accepted referral must not appear in byDomain at all");
  assert.ok(result.items.every((item) => item.patientId === "P100"));

  console.log("Intervention draft shape: describePendingInterventionDrafts aggregates across health_plan/coaching/diabetes_coaching, excludes accepted + other-patient items.");
}

function main() {
  testHealthPlanAdapter();
  testCoachingAdapter();
  testDiabetesCoachingAdapter();
  testReferralAdapter();
  testDescribePendingInterventionDraftsAggregatesAcrossDomains();
}

main();
