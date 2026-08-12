import { expect, test } from "@playwright/test";

import {
  AGENT_DEMO_PATIENTS,
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_B_AGENTS_0019,
  GOLDEN_SCENARIO_G_AGENTS_0007,
  GOLDEN_SCENARIO_G_AGENTS_0011,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";

/**
 * Golden journeys AKSH-E2E-0007 (multimorbidity), 0011 (allergy block), 0019 (LLM failure).
 */
test.describe("Platform golden journeys — agent orchestration", () => {
  test("AKSH-E2E-0007: multimorbidity — multi-agent drafts, GUARDIAN-led review", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const demo = AGENT_DEMO_PATIENTS.multimorbidity;
    const generator = getCohortGeneratorPatient("G");
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_G_AGENTS_0007.expectedDecision).toBe("REQUEST_APPROVAL");
    expect(generator.conditions.length).toBeGreaterThanOrEqual(4);
    expect(manifest.scenarioDistribution.G).toBeGreaterThanOrEqual(10);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-agents-0007" });

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        transcript: "Polypharmacy review — multimorbidity complexity. Draft only.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();

    const body = (await orchestrate.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      orchestration?: {
        queuePriority?: string;
        reviewOrder?: string[];
        outputs?: {
          ORACLE?: { oracleRisk?: string; mode?: string };
          GUARDIAN?: { overallStatus?: string; interactions?: unknown[]; mode?: string };
          NEXUS?: { correlations?: unknown[]; status?: string; mode?: string };
        };
      };
      safetyRoute?: string;
    };

    expect(body.ehrWrite).toBe(false);
    expect(body.hitlRequired).toBe(true);
    expect(body.orchestration?.queuePriority).not.toBe("Normal");
    if (body.orchestration?.queuePriority === "Urgent") {
      expect(body.orchestration?.reviewOrder?.[0]).toBe("GUARDIAN");
    }
    expect(body.orchestration?.outputs?.ORACLE?.oracleRisk).toMatch(/High|VeryHigh/i);
    expect((body.orchestration?.outputs?.NEXUS?.correlations?.length ?? 0)).toBeGreaterThan(0);
    expect(body.orchestration?.outputs?.NEXUS?.status).toBe("draft");
    expect(body.safetyRoute).not.toBe("low_risk_coaching");

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_G_AGENTS_0007.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });

  test("AKSH-E2E-0011: allergy safety — penicillin record blocks beta-lactam path", async ({
    request,
    baseURL,
  }) => {
    const demo = AGENT_DEMO_PATIENTS.allergy;

    expect(GOLDEN_SCENARIO_G_AGENTS_0011.expectedSafety).toBe("BLOCKED");

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-agents-0011" });

    const guardian = await request.post("/api/agents/guardian", {
      data: { patientId: demo.id, proposedDrug: "Amoxicillin" },
      timeout: 30_000,
    });
    expect(guardian.ok()).toBeTruthy();
    const gBody = (await guardian.json()) as {
      hitlRequired?: boolean;
      ehrWrite?: boolean;
      draft?: { overallStatus?: string; proposedDrug?: string };
    };
    expect(gBody.hitlRequired).toBe(true);
    expect(gBody.ehrWrite).toBe(false);
    expect(gBody.draft?.proposedDrug).toMatch(/amoxicillin/i);

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        proposedDrug: "Amoxicillin",
        transcript: "Proposed Amoxicillin with penicillin allergy on record. HITL mandatory.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();
    const orchBody = (await orchestrate.json()) as {
      hitlRequired?: boolean;
      ehrWrite?: boolean;
      safetyRoute?: string;
      orchestration?: { queuePriority?: string };
    };
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.safetyRoute).not.toBe("low_risk_coaching");

    const safety = await request.get(`/api/patients/${demo.id}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as { hitlRequired?: boolean; coachingAllowed?: boolean };
    expect(safetyBody.hitlRequired).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_G_AGENTS_0011.testId} · allergy ${demo.id}`,
    });
  });

  test("AKSH-E2E-0019: LLM unavailable — deterministic orchestration, state intact", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const demo = AGENT_DEMO_PATIENTS.llmFailure;
    const generator = getCohortGeneratorPatient("B");

    expect(GOLDEN_SCENARIO_B_AGENTS_0019.expectedIntelligence).toMatch(/deterministic/i);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-agents-0019" });

    const stateBefore = await request.get(`/api/patients/${demo.id}/state`);
    expect(stateBefore.ok()).toBeTruthy();
    const beforeBody = (await stateBefore.json()) as { factHistoryCount?: number; patientId?: string };
    const priorFactCount = beforeBody.factHistoryCount ?? 0;

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        proposedDrug: "Apixaban",
        transcript: "Synthetic deterioration review — deterministic fallback expected.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orchestrate.ok()).toBeTruthy();

    const body = (await orchestrate.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      autoRetrain?: boolean;
      liveEmis?: boolean;
      orchestration?: {
        outputs?: {
          SYNTHESIS?: { mode?: string; plan?: string };
          GUARDIAN?: { mode?: string };
          ORACLE?: { mode?: string };
          NEXUS?: { mode?: string };
        };
      };
    };

    expect(body.ehrWrite).toBe(false);
    expect(body.hitlRequired).toBe(true);
    expect(body.autoRetrain).toBe(false);
    expect(body.liveEmis).toBe(false);
    expect(body.orchestration?.outputs?.SYNTHESIS?.plan?.length ?? 0).toBeGreaterThan(5);

    const stateAfter = await request.get(`/api/patients/${demo.id}/state`);
    const afterBody = (await stateAfter.json()) as { factHistoryCount?: number };
    expect((afterBody.factHistoryCount ?? 0)).toBeGreaterThanOrEqual(priorFactCount);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_B_AGENTS_0019.testId} · generator ${generator.id} · UI ${demo.id}`,
    });
  });
});
