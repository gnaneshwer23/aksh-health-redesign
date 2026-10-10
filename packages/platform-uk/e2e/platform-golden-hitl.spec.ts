import { expect, test } from "@playwright/test";

import {
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_HITL_0005,
  GOLDEN_SCENARIO_HITL_0010,
  GOLDEN_SCENARIO_HITL_0015,
  GOLDEN_SCENARIO_HITL_0021,
  HITL_DEMO_PATIENTS,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";
import { resolveReviewQueueItems, updateQueueItemDecision } from "../lib/workflow/review-queue";
import type { ReviewCase } from "../lib/types";

/**
 * Golden journeys AKSH-E2E-0005 (adherence RECOMMEND), 0010 (Reject), 0015 (Accept→outcome).
 */
test.describe("Platform golden journeys — HITL / intervention", () => {
  test("AKSH-E2E-0005: adherence engagement — pending drafts, pharmacy barrier, HITL", async ({
    request,
    baseURL,
  }) => {
    const generator = getCohortGeneratorPatient("E");
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_HITL_0005.expectedDecision).toBe("RECOMMEND");
    expect(generator.adherenceScore ?? 100).toBeLessThan(70);
    expect(manifest.scenarioDistribution.E).toBeGreaterThanOrEqual(5);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-hitl-0005" });

    const demo = HITL_DEMO_PATIENTS.adherence;
    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        transcript: "Low medication adherence — engagement and pharmacy follow-up. Draft only.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();
    const orchBody = (await orchestrate.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      safetyRoute?: string;
    };
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.safetyRoute).not.toBe("urgent_flag");

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as { hitlRequired?: boolean };
    expect(safetyBody.hitlRequired).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_HITL_0005.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });

  test("AKSH-E2E-0010: clinician Reject — learning disposition, no staging / no EHR write", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-hitl-0010" });

    const created = await request.post("/api/review-cases", {
      data: {
        action: "create",
        patientLabel: "Mr James Patel (P002)",
        rawInput:
          "Follow-up for rising HbA1c. AI recommends intensifying therapy. Clinician may Reject.",
        sourceType: "note",
        options: { includeMedicationDraft: false, confidenceMode: "conservative" },
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = (await created.json()) as { reviewCase?: ReviewCase };
    const reviewCase = createdBody.reviewCase!;
    expect(reviewCase.id).toBeTruthy();

    const queueItems = resolveReviewQueueItems(reviewCase);
    const draftItem =
      queueItems.find((i) => i.itemType === "soap_note" && i.status === "DRAFT") ??
      queueItems.find((i) => i.status === "DRAFT");
    expect(draftItem?.id).toBeTruthy();

    const rejected = updateQueueItemDecision(reviewCase, draftItem!.id, "REJECTED", {
      decidedBy: "Dr E2E Hitl",
      rejectionReason: "Not clinically appropriate this visit — defer recommendation",
    });

    const put = await request.put(`/api/review-cases/${reviewCase.id}`, {
      data: {
        ...rejected,
        status: "rejected",
        updatedAt: new Date().toISOString(),
      },
    });
    expect(put.ok()).toBeTruthy();
    const putBody = (await put.json()) as {
      spine?: {
        learningEventIds?: string[];
        ehrWrite?: boolean;
        autoRetrain?: boolean;
        patientId?: string;
      };
      bridgeStaging?: unknown;
      reviewCase?: ReviewCase;
    };

    expect(putBody.spine?.ehrWrite).toBe(false);
    expect(putBody.spine?.autoRetrain).toBe(false);
    expect((putBody.spine?.learningEventIds ?? []).length).toBeGreaterThanOrEqual(1);
    expect(putBody.bridgeStaging).toBeFalsy();

    const rejectedItem = resolveReviewQueueItems(putBody.reviewCase!).find(
      (i) => i.id === draftItem!.id
    );
    expect(rejectedItem?.status).toBe("REJECTED");

    const denied = await request.post("/api/integrations/ehr-writeback-sim", {
      data: { action: "write", resourceSummary: "reject must not write" },
    });
    expect([401, 403]).toContain(denied.status());

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_HITL_0010.testId} · reject case ${reviewCase.id}`,
    });
  });

  test("AKSH-E2E-0015: Accept → health-plan draft + learning; no live EHR", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const generator = getCohortGeneratorPatient("H");
    expect(GOLDEN_SCENARIO_HITL_0015.expectedDecision).toBe("INFORM");
    expect(generator.hba1cSeries.length).toBeGreaterThanOrEqual(2);
    const first = generator.hba1cSeries[0]!.value;
    const last = generator.hba1cSeries[generator.hba1cSeries.length - 1]!.value;
    expect(last).toBeLessThan(first - 1);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-hitl-0015" });

    const created = await request.post("/api/review-cases", {
      data: {
        action: "create",
        patientLabel: "Mr James Patel (P002)",
        rawInput:
          "Care plan review after therapy optimisation. Accept recommendation for follow-up HbA1c.",
        sourceType: "note",
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = (await created.json()) as { reviewCase?: ReviewCase };
    const reviewCase = createdBody.reviewCase!;
    const queueItems = resolveReviewQueueItems(reviewCase);
    const draftItem =
      queueItems.find((i) => i.itemType === "soap_note" && i.status === "DRAFT") ??
      queueItems.find((i) => i.status === "DRAFT");
    expect(draftItem?.id).toBeTruthy();

    const accepted = updateQueueItemDecision(reviewCase, draftItem!.id, "ACCEPTED", {
      decidedBy: "Dr E2E Hitl",
    });

    const put = await request.put(`/api/review-cases/${reviewCase.id}`, {
      data: {
        ...accepted,
        status: "accepted",
        updatedAt: new Date().toISOString(),
        offerHealthPlan: true,
      },
    });
    expect(put.ok()).toBeTruthy();
    const putBody = (await put.json()) as {
      spine?: {
        learningEventIds?: string[];
        healthPlanId?: string | null;
        ehrWrite?: boolean;
        autoRetrain?: boolean;
        patientId?: string;
      };
      bridgeStaging?: {
        liveEmis?: boolean;
        simWriteId?: string | null;
        emisStagingEntryId?: string | null;
      } | null;
    };

    expect(putBody.spine?.ehrWrite).toBe(false);
    expect(putBody.spine?.autoRetrain).toBe(false);
    expect((putBody.spine?.learningEventIds ?? []).length).toBeGreaterThanOrEqual(1);
    expect(putBody.spine?.healthPlanId).toBeTruthy();

    if (putBody.bridgeStaging) {
      expect(putBody.bridgeStaging.liveEmis).toBe(false);
    }

    const emis = await request.get("/api/integrations/emis-staging");
    expect(emis.ok()).toBeTruthy();
    const emisBody = (await emis.json()) as { liveWriteBack?: boolean; enabled?: boolean };
    expect(emisBody.liveWriteBack).toBe(false);
    expect(emisBody.enabled).toBe(false);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_HITL_0015.testId} · generator ${generator.id} · accept case ${reviewCase.id}`,
    });
  });

  test("AKSH-E2E-0021: Clinician Modify — edit stays DRAFT, learning=edit, no EHR", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    expect(GOLDEN_SCENARIO_HITL_0021.expectedWorkflow).toMatch(/HITL edit/i);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-hitl-0021" });

    const created = await request.post("/api/review-cases", {
      data: {
        action: "create",
        patientLabel: "Mr James Patel (P002)",
        rawInput:
          "SOAP draft for therapy review. Clinician will Modify wording before Accept.",
        sourceType: "note",
        options: { includeMedicationDraft: false, confidenceMode: "conservative" },
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = (await created.json()) as { reviewCase?: ReviewCase };
    const reviewCase = createdBody.reviewCase!;
    const queueItems = resolveReviewQueueItems(reviewCase);
    const draftItem =
      queueItems.find((i) => i.itemType === "soap_note" && i.status === "DRAFT") ??
      queueItems.find((i) => i.status === "DRAFT");
    expect(draftItem?.id).toBeTruthy();

    const originalContent = draftItem!.content ?? draftItem!.summary ?? "";
    const editedContent =
      "Clinician-modified plan: continue current therapy, reinforce diet, recheck HbA1c. Draft only — HITL.";

    const edited = updateQueueItemDecision(reviewCase, draftItem!.id, "DRAFT", {
      decidedBy: "Dr E2E Hitl",
      content: editedContent,
    });

    const put = await request.put(`/api/review-cases/${reviewCase.id}`, {
      data: {
        ...edited,
        updatedAt: new Date().toISOString(),
      },
    });
    expect(put.ok()).toBeTruthy();
    const putBody = (await put.json()) as {
      spine?: {
        learningEventIds?: string[];
        healthPlanId?: string | null;
        ehrWrite?: boolean;
        autoRetrain?: boolean;
      };
      reviewCase?: ReviewCase;
      bridgeStaging?: unknown;
    };

    expect(putBody.spine?.ehrWrite).toBe(false);
    expect(putBody.spine?.autoRetrain).toBe(false);
    expect((putBody.spine?.learningEventIds ?? []).length).toBeGreaterThanOrEqual(1);
    expect(putBody.spine?.healthPlanId ?? null).toBeNull();
    expect(putBody.bridgeStaging).toBeFalsy();

    const editedItem = resolveReviewQueueItems(putBody.reviewCase!).find((i) => i.id === draftItem!.id);
    expect(editedItem?.status).toBe("DRAFT");
    expect(editedItem?.content).toContain("Clinician-modified");
    expect(editedItem?.content).not.toBe(originalContent);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_HITL_0021.testId} · modify case ${reviewCase.id}`,
    });
  });
});
