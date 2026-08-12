import { expect, test } from "@playwright/test";

import {
  DECISION_DEMO_PATIENTS,
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_DECISION_0001,
  GOLDEN_SCENARIO_DECISION_0009,
  GOLDEN_SCENARIO_DECISION_0012,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";

/**
 * Golden journeys AKSH-E2E-0001 (observe), 0009 (critical lab escalate), 0012 (hallucination guard).
 */
test.describe("Platform golden journeys — decision + safety", () => {
  test("AKSH-E2E-0001: stable diabetes — OBSERVE / low-risk coaching branch", async ({
    request,
    baseURL,
  }) => {
    const demo = DECISION_DEMO_PATIENTS.stable;
    const generator = getCohortGeneratorPatient("A");
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_DECISION_0001.expectedDecision).toBe("OBSERVE");
    expect(GOLDEN_SCENARIO_DECISION_0001.expectedSafety).toBe("SAFE");
    expect(manifest.scenarioDistribution.A).toBeGreaterThanOrEqual(15);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-decision-0001" });

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as {
      safetyRoute?: string;
      coachingAllowed?: boolean;
      hitlRequired?: boolean;
      oracleRisk?: string;
    };
    expect(safetyBody.safetyRoute).toBe("low_risk_coaching");
    expect(safetyBody.coachingAllowed).toBe(true);
    expect(safetyBody.hitlRequired).toBe(true);
    expect(safetyBody.oracleRisk).toMatch(/Low|Medium/i);

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        transcript: "Annual diabetes review — stable control. Draft only.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();
    const orchBody = (await orchestrate.json()) as {
      safetyRoute?: string;
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      orchestration?: { queuePriority?: string };
    };
    expect(orchBody.safetyRoute).toBe("low_risk_coaching");
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.orchestration?.queuePriority).toBe("Normal");

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_DECISION_0001.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });

  test("AKSH-E2E-0009: critical lab — safety-first escalation path", async ({ request, baseURL }) => {
    test.setTimeout(90_000);
    const demo = DECISION_DEMO_PATIENTS.escalation;
    const generator = getCohortGeneratorPatient("C");

    expect(GOLDEN_SCENARIO_DECISION_0009.expectedDecision).toBe("ESCALATE");
    expect(GOLDEN_SCENARIO_DECISION_0009.expectedSafety).toBe("ESCALATE");
    expect(generator.riskLevel).toMatch(/high|very_high/);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-decision-0009" });

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        transcript: "Critical HbA1c lab flagged — safety-first routing. Draft only.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();
    const orchBody = (await orchestrate.json()) as {
      safetyRoute?: string;
      hitlRequired?: boolean;
      ehrWrite?: boolean;
      orchestration?: { queuePriority?: string; reviewOrder?: string[] };
    };
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.safetyRoute).toBe("urgent_flag");
    expect(orchBody.orchestration?.queuePriority).not.toBe("Normal");
    expect(orchBody.orchestration?.reviewOrder?.[0]).toBe("GUARDIAN");

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    const safetyBody = (await safety.json()) as { coachingAllowed?: boolean; safetyRoute?: string };
    expect(safetyBody.coachingAllowed).toBe(false);
    expect(safetyBody.safetyRoute).not.toBe("low_risk_coaching");

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_DECISION_0009.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });

  test("AKSH-E2E-0012: absent creatinine — ACQUIRE_DATA, no fabrication", async ({
    request,
    baseURL,
  }) => {
    const demo = DECISION_DEMO_PATIENTS.missingRenal;
    const generator = getCohortGeneratorPatient("F");

    expect(GOLDEN_SCENARIO_DECISION_0012.expectedDecision).toBe("ACQUIRE_DATA");
    expect(generator.egfrSeries.length).toBe(0);
    expect(generator.missingDataFlags.some((f) => f.includes("renal"))).toBe(true);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-decision-0012" });

    const state = await request.get(`/api/patients/${demo.id}/state`);
    expect(state.ok()).toBeTruthy();
    const stateBody = (await state.json()) as {
      snapshot?: { current?: Record<string, unknown> };
    };
    expect(stateBody.snapshot?.current?.egfr).toBeUndefined();
    expect(stateBody.snapshot?.current?.creatinine).toBeUndefined();

    const oracle = await request.post("/api/agents/oracle", {
      data: { patientId: demo.id },
      timeout: 30_000,
    });
    expect(oracle.ok()).toBeTruthy();
    const oBody = (await oracle.json()) as {
      draft?: { summary?: string; contributingFactors?: string[]; safetyNotes?: string[] };
      hitlRequired?: boolean;
      ehrWrite?: boolean;
    };
    expect(oBody.hitlRequired).toBe(true);
    expect(oBody.ehrWrite).toBe(false);

    const oracleText = [
      oBody.draft?.summary ?? "",
      ...(oBody.draft?.contributingFactors ?? []),
      ...(oBody.draft?.safetyNotes ?? []),
    ].join(" ");
    expect(oracleText).not.toMatch(/\begfr\s*[:=]?\s*\d{2,3}/i);
    expect(oracleText).not.toMatch(/\bcreatinine\s*[:=]?\s*\d{2,3}/i);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_DECISION_0012.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });
});
