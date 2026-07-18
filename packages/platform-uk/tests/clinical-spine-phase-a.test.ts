/**
 * Phase A clinical spine — onboarding consent sync + queue decision learning.
 * Honest invariants: ehrWrite:false · autoRetrain:false · liveEmis:false.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  mapOnboardingConsentsToGrantInputs,
  resolveOnboardingSubjectId,
  syncOnboardingConsentsToRegistry
} from "../lib/onboarding/consent-registry-sync";
import {
  diffQueueDecisions,
  recordSpineQueueDecisions,
  resolveSpinePatientId
} from "../lib/clinical-spine/queue-decision";
import { updateQueueItemDecision } from "../lib/workflow/review-queue";
import type { ReviewCase } from "../lib/types";
import { reviewCases as seedCases } from "../lib/mock-data";

const scopeKey = `phase_a_${Date.now()}`;

function minimalCase(): ReviewCase {
  const seeded =
    seedCases.find((c) => c.id === "case-patel-demo") ??
    seedCases.find((c) => c.scenarioId === "PATEL-DEMO") ??
    seedCases.find((c) => c.id === "case-v-uk1") ??
    seedCases.find((c) => c.scenarioId === "V-UK1") ??
    seedCases[0];
  if (!seeded) {
    throw new Error("No seed review cases available for Phase A spine test");
  }
  // Prefer golden Patel mapping when present; otherwise stamp PATEL-DEMO so spine resolves P002.
  const base: ReviewCase = {
    ...seeded,
    id: seeded.scenarioId === "PATEL-DEMO" || seeded.id === "case-patel-demo" ? seeded.id : "case-patel-demo",
    scenarioId: "PATEL-DEMO",
    patientLabel: seeded.patientLabel.includes("Patel")
      ? seeded.patientLabel
      : "Mr James Patel — T2D + DVT"
  };
  // Isolate a single DRAFT soap item for deterministic diffs
  const soap =
    base.reviewQueueItems?.find((i) => i.itemType === "soap_note") ??
    base.reviewQueueItems?.[0];
  return {
    ...base,
    reviewQueueItems: soap
      ? [
          {
            ...soap,
            id: "q-soap",
            status: "DRAFT",
            decidedBy: undefined,
            decidedAt: undefined,
            content: soap.content ?? soap.summary
          }
        ]
      : [
          {
            id: "q-soap",
            agentId: "SYNTHESIS",
            itemType: "soap_note",
            status: "DRAFT",
            title: "SOAP draft",
            summary: "Suspected DVT with poor glycaemic control"
          }
        ]
  };
}

async function run() {
  // --- Onboarding → consent registry ---
  const subject = resolveOnboardingSubjectId("usr_testuser01");
  assert.equal(subject, "user-usr_testuser01");

  const gpInputs = mapOnboardingConsentsToGrantInputs({
    role: "gp",
    userId: "usr_testuser01",
    consents: { aiDocumentation: true, hitlApproval: true, anonymisedOutcomes: true },
    actor: "gp@example.com"
  });
  assert.ok(gpInputs.some((g) => g.purposeCode === "care_delivery"));
  assert.ok(gpInputs.some((g) => g.purposeCode === "care_improvement"));
  assert.ok(gpInputs.every((g) => g.patientId === subject));

  const patientInputs = mapOnboardingConsentsToGrantInputs({
    role: "patient",
    userId: "usr_patient01",
    consents: { healthContact: true, gpApproval: true, careImprovement: true, voiceCalls: true },
    actor: "patient@example.com"
  });
  assert.ok(patientInputs.some((g) => g.purposeCode === "care_delivery"));
  assert.ok(patientInputs.some((g) => g.purposeCode === "coaching_wellness"));

  const synced = await syncOnboardingConsentsToRegistry({
    role: "gp",
    userId: `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    consents: { aiDocumentation: true, hitlApproval: true },
    actor: "phase-a-test",
    scopeKey
  });
  assert.ok(synced.grantsCreated >= 1);
  assert.equal(synced.ehrWrite, false);

  // --- GP decision → spine ---
  const existing = minimalCase();
  assert.equal(resolveSpinePatientId(existing), "P002");

  const accepted = updateQueueItemDecision(existing, "q-soap", "ACCEPTED", {
    decidedBy: "Dr Morgan"
  });
  const deltas = diffQueueDecisions(existing, accepted);
  assert.equal(deltas.length, 1);
  assert.equal(deltas[0]?.decision, "accept");

  const spine = await recordSpineQueueDecisions({
    existing,
    next: accepted,
    scopeKey,
    actor: "Dr Morgan",
    offerHealthPlan: true
  });
  assert.equal(spine.patientId, "P002");
  assert.equal(spine.learningEventIds.length, 1);
  assert.ok(spine.healthPlanId);
  assert.equal(spine.ehrWrite, false);
  assert.equal(spine.autoRetrain, false);

  const edited = updateQueueItemDecision(existing, "q-soap", "DRAFT", {
    decidedBy: "Dr Morgan",
    content: "Edited SOAP content"
  });
  const editDeltas = diffQueueDecisions(existing, edited);
  assert.equal(editDeltas.length, 1);
  assert.equal(editDeltas[0]?.decision, "edit");

  // --- Source wiring (static contracts) ---
  const completeRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/onboarding/complete/route.ts"),
    "utf8"
  );
  assert.ok(completeRoute.includes("syncOnboardingConsentsToRegistry"));

  const reviewRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/review-cases/[id]/route.ts"),
    "utf8"
  );
  assert.ok(reviewRoute.includes("recordSpineQueueDecisions"));
  assert.ok(reviewRoute.includes("offerHealthPlan"));

  const adminPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/admin/precision-health/page.tsx"),
    "utf8"
  );
  assert.ok(adminPage.includes("SystemSpinePanel"));

  const demo = fs.readFileSync(
    path.join(process.cwd(), "components/demo/PrecisionHealthLoopDemo.tsx"),
    "utf8"
  );
  assert.ok(demo.includes("Replay the Aksh clinical spine"));
  assert.ok(demo.includes("/dashboard/gp"));

  console.log("Phase A clinical spine checks passed.");
}

void run();
