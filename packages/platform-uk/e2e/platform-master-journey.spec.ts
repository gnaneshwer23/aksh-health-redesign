import { expect, test } from "@playwright/test";

import {
  COHORT_B_DEMO_PATIENT_ID,
  getCohortGeneratorPatient,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";
import {
  MASTER_JOURNEY_TEST_ID,
  buildMasterIdentityMap,
} from "../lib/e2e/master-journey";

/**
 * Playwright surface for AKSH-E2E-MASTER-001.
 * Full 25-step durable chain runs in `npm run test:master` (unit).
 * This spec asserts API orchestration + identity map + honesty under one correlation annotation.
 */
test.describe("Platform Master Journey — AKSH-E2E-MASTER-001", () => {
  test("API orchestration for canonical deteriorating patient (P002)", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    const identity = buildMasterIdentityMap(20260812);
    const generator = getCohortGeneratorPatient("B");
    const manifest = await loadE2EBatchManifest();
    const correlationId = `aksh-master-pw-${Date.now().toString(36)}`;

    expect(identity.canonicalPatientId).toBe(COHORT_B_DEMO_PATIENT_ID);
    expect(identity.generatorPatientId).toBe(COHORT_B_DEMO_PATIENT_ID);
    expect(identity.generatorPatientId).toBe(generator.id);
    expect(generator.cohortId).toBe("B");
    expect(generator.legacyIds).toContain("E2P021");
    expect(manifest.liveEmis).toBe(false);

    await createOnboardedTestUser(request, baseURL!, {
      role: "gp",
      label: "master-journey-001",
    });

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: COHORT_B_DEMO_PATIENT_ID,
        transcript: `Master Journey ${correlationId}: progressive T2D deterioration. Draft only.`,
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();
    const body = (await orchestrate.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      liveEmis?: boolean;
      safetyRoute?: string;
    };
    expect(body.ehrWrite).toBe(false);
    expect(body.hitlRequired).toBe(true);
    expect(body.liveEmis ?? false).toBe(false);
    expect(["clinical_review_queue", "urgent_flag"]).toContain(body.safetyRoute);

    test.info().annotations.push({
      type: "master-journey",
      description: `${MASTER_JOURNEY_TEST_ID} · corr=${correlationId} · canonical=${identity.canonicalPatientId}`,
    });
  });
});
