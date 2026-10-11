import { expect, test } from "@playwright/test";

import {
  COHORT_B_DEMO_PATIENT_ID,
  COHORT_B_DEMO_PATIENT_LABEL,
  getCohortBGeneratorPatient,
  GOLDEN_JOURNEY_SCENARIO,
  ingestDeterioratingHbA1cSeries,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Golden journey AKSH-E2E-0002 — Progressive Type 2 diabetes deterioration.
 * UI/agents: demo patient P002 (James Patel, T2D + high risk).
 * Data plane: E2E generator cohort B patient (canonical id P002; legacy alias E2P021) + optional HbA1c ingest.
 */
test.describe("Platform golden journey — AKSH-E2E-0002", () => {
  test("deterioration: state → intelligence → safety → clinician review path", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);

    const cohortB = getCohortBGeneratorPatient();
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_JOURNEY_SCENARIO.testId).toBe("AKSH-E2E-0002");
    expect(GOLDEN_JOURNEY_SCENARIO.expectedDecision).toBe("REQUEST_APPROVAL");
    expect(manifest.scenarioDistribution.B).toBeGreaterThanOrEqual(20);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-0002" });
    await applyApiCookiesToPage(page, request);

    const patientId = COHORT_B_DEMO_PATIENT_ID;

    // 1) Clinician sees patient in roster
    await page.goto("/dashboard/gp/patients");
    await expect(page.getByText(new RegExp(COHORT_B_DEMO_PATIENT_LABEL, "i")).first()).toBeVisible({
      timeout: 20_000,
    });

    // 2) Patient State read (C1 foundation)
    const stateResponse = await request.get(`/api/patients/${patientId}/state`);
    expect(stateResponse.ok()).toBeTruthy();
    const stateBody = (await stateResponse.json()) as {
      patientId: string;
      snapshot?: { factCount?: number };
      facts?: unknown[];
    };
    expect(stateBody.patientId).toBe(patientId);

    // 3) Optional diabetes ingest — only when module enabled in server env
    const ingestStatuses = await ingestDeterioratingHbA1cSeries(request, patientId);
    const diabetesIngestActive = ingestStatuses.some((s) => s === 200);
    if (diabetesIngestActive) {
      const stateAfter = await request.get(`/api/patients/${patientId}/state`);
      const afterBody = (await stateAfter.json()) as { factHistoryCount?: number };
      expect((afterBody.factHistoryCount ?? 0)).toBeGreaterThan(0);
    }

    // 4) Intelligence — GUARDIAN + ORACLE (HITL, no EHR write)
    const [guardian, oracle, orchestrate] = await Promise.all([
      request.post("/api/agents/guardian", {
        data: { patientId, proposedDrug: "Apixaban" },
        timeout: 30_000,
      }),
      request.post("/api/agents/oracle", { data: { patientId }, timeout: 30_000 }),
      request.post("/api/agents/orchestrate", {
        data: { patientId, patientLabel: COHORT_B_DEMO_PATIENT_LABEL, transcript: "HbA1c rising, weight up, adherence uncertain." },
        timeout: 45_000,
      }),
    ]);

    expect(guardian.ok()).toBeTruthy();
    expect(oracle.ok()).toBeTruthy();
    expect(orchestrate.ok()).toBeTruthy();

    const gBody = (await guardian.json()) as { ehrWrite?: boolean; hitlRequired?: boolean };
    const oBody = (await oracle.json()) as { ehrWrite?: boolean; draft?: { oracleRisk?: string } };
    const orchBody = (await orchestrate.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      decision?: { route?: string; escalation?: string };
      queuePriority?: string;
    };

    expect(gBody.ehrWrite).toBe(false);
    expect(gBody.hitlRequired).toBe(true);
    expect(oBody.ehrWrite).toBe(false);
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);

    // High-risk / deterioration — not OBSERVE-only
    expect(oBody.draft?.oracleRisk).toMatch(/High|VeryHigh|Medium/i);

    // 5) Safety route — clinician-facing branch
    const safety = await request.get(`/api/patients/${patientId}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as {
      safetyRoute?: string;
      coachingAllowed?: boolean;
      hitlRequired?: boolean;
    };
    expect(safetyBody.hitlRequired).toBe(true);
    expect(safetyBody.safetyRoute).toBeTruthy();

    // 6) Review queue — human-in-the-loop surface
    await page.goto("/dashboard/gp/review-queue");
    await expect(page.getByTestId("gp-review-queue").first()).toBeVisible();
    await expect(page.getByText(new RegExp(COHORT_B_DEMO_PATIENT_LABEL, "i")).first()).toBeVisible();

    // Traceability artifact
    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_JOURNEY_SCENARIO.testId} · generator cohort B ${cohortB.id} · UI ${patientId}`,
    });
    test.info().annotations.push({
      type: "expected-decision",
      description: GOLDEN_JOURNEY_SCENARIO.expectedDecision,
    });
  });

  test("RBAC: nurse redirected away from E2E admin dashboard", async ({ page, request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "nurse", label: "golden-rbac-nurse" });
    await applyApiCookiesToPage(page, request);

    await page.goto("/dashboard/admin/e2e");
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toMatch(/\/dashboard\/admin\/e2e(?:\/|$)/);
  });
});
