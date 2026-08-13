import { expect, test } from "@playwright/test";

import {
  COHORT_DEMO_PATIENTS,
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_C,
  GOLDEN_SCENARIO_D,
  GOLDEN_SCENARIO_F,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Golden journeys AKSH-E2E-0003 (cohort C), 0004 (cohort D), 0006 (cohort F).
 */
test.describe("Platform golden journeys — cohorts C, D, F", () => {
  test("AKSH-E2E-0003: high-risk prioritisation → escalate path", async ({ page, request, baseURL }) => {
    test.setTimeout(90_000);
    const demo = COHORT_DEMO_PATIENTS.C;
    const generator = getCohortGeneratorPatient("C");
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_C.expectedDecision).toBe("ESCALATE");
    expect(manifest.scenarioDistribution.C).toBeGreaterThanOrEqual(15);
    expect(generator.riskLevel).toMatch(/high|very_high/);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-c" });
    await applyApiCookiesToPage(page, request);

    const oracle = await request.post("/api/agents/oracle", { data: { patientId: demo.id } });
    expect(oracle.ok()).toBeTruthy();
    const oBody = (await oracle.json()) as { draft?: { oracleRisk?: string }; hitlRequired?: boolean };
    expect(oBody.draft?.oracleRisk).toMatch(/High|VeryHigh/i);
    expect(oBody.hitlRequired).toBe(true);

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as { safetyRoute?: string; hitlRequired?: boolean };
    expect(safetyBody.hitlRequired).toBe(true);
    expect(safetyBody.safetyRoute).not.toBe("observe");

    await page.goto("/dashboard/gp/review-queue");
    await expect(page.getByTestId("gp-review-queue")).toBeVisible();

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_C.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });

  test("AKSH-E2E-0004: safety escalation — GUARDIAN HITL, no autonomous treatment", async ({
    request,
    baseURL,
  }) => {
    const demo = COHORT_DEMO_PATIENTS.D;
    const generator = getCohortGeneratorPatient("D");

    expect(GOLDEN_SCENARIO_D.expectedSafety).toBe("ESCALATE");
    expect(generator.cgmSummary?.hypoEvents7d).toBeGreaterThanOrEqual(3);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-d" });

    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: demo.id, proposedDrug: "Apixaban" },
    });
    expect(guardian.ok()).toBeTruthy();
    const gBody = (await guardian.json()) as {
      hitlRequired?: boolean;
      ehrWrite?: boolean;
      draft?: { overallStatus?: string };
    };
    expect(gBody.hitlRequired).toBe(true);
    expect(gBody.ehrWrite).toBe(false);
    expect(gBody.draft).toBeTruthy();

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    const safetyBody = (await safety.json()) as { coachingAllowed?: boolean; hitlRequired?: boolean };
    expect(safetyBody.hitlRequired).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_D.testId} · CGM cohort ${generator.id} · safety ${demo.id}`,
    });
  });

  test("AKSH-E2E-0006: missing information — gaps flagged, no fabrication", async ({
    request,
    baseURL,
  }) => {
    const demo = COHORT_DEMO_PATIENTS.F;
    const generator = getCohortGeneratorPatient("F");

    expect(GOLDEN_SCENARIO_F.expectedDecision).toBe("ACQUIRE_DATA");
    expect(generator.missingDataFlags.length).toBeGreaterThan(0);
    expect(generator.hba1cSeries.length).toBe(0);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-f" });

    const state = await request.get(`/api/patients/${demo.id}/state`);
    expect(state.ok()).toBeTruthy();
    const stateBody = (await state.json()) as {
      patientId: string;
      snapshot?: { current?: Record<string, unknown> };
    };
    expect(stateBody.patientId).toBe(demo.id);

    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: demo.id, proposedDrug: "Metformin" },
    });
    expect(guardian.ok()).toBeTruthy();
    const gBody = (await guardian.json()) as { ehrWrite?: boolean; hitlRequired?: boolean };
    expect(gBody.ehrWrite).toBe(false);
    expect(gBody.hitlRequired).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_F.testId} · generator ${generator.id} · missing-info ${demo.id}`,
    });
  });

  test("RBAC: researcher denied patient state read", async ({ request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "researcher", label: "golden-f-rbac" });
    const state = await request.get("/api/patients/P015/state");
    expect(state.status()).toBe(403);
  });
});
