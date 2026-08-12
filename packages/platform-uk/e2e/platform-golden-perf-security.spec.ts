import { expect, test } from "@playwright/test";

import {
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_PERF_0016,
  GOLDEN_SCENARIO_PERF_0017,
  GOLDEN_SCENARIO_PERF_0019,
  loadE2EBatchManifest,
  PERF_DEMO_PATIENTS,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";
import {
  assertGoldenScenario0017,
  buildAppointmentReminder,
} from "../lib/e2e/perf-security-assertions";

/**
 * Golden journeys AKSH-E2E-0016 (tenant isolation), 0017 (lightweight reminder),
 * 0019 (LLM-off failure honesty). Non-destructive.
 */
test.describe("Platform golden journeys — perf / security / failure", () => {
  test("AKSH-E2E-0016: tenant / role isolation — no data leak", async ({ request, baseURL }) => {
    expect(GOLDEN_SCENARIO_PERF_0016.expectedSafety).toBe("BLOCKED");
    expect(GOLDEN_SCENARIO_PERF_0016.expectedOutcome).toMatch(/403|404/);

    const manifest = await loadE2EBatchManifest();
    expect(manifest.scenarioDistribution.A).toBeGreaterThanOrEqual(15);

    // Researcher cannot read clinical patient state
    await createOnboardedTestUser(request, baseURL!, {
      role: "researcher",
      label: "golden-perf-0016-researcher",
    });
    const denied = await request.get(`/api/patients/${PERF_DEMO_PATIENTS.isolation.id}/state`);
    expect(denied.status()).toBe(403);

    // Patient role cannot check in for an arbitrary other patient (fail-closed)
    await createOnboardedTestUser(request, baseURL!, {
      role: "patient",
      label: "golden-perf-0016-patient",
    });
    const cross = await request.post(`/api/patients/${PERF_DEMO_PATIENTS.isolation.id}/check-in`, {
      data: { mood: "okay" },
    });
    expect(cross.status()).toBe(403);
    const crossBody = (await cross.json()) as { denied?: boolean };
    expect(crossBody.denied).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_PERF_0016.testId} · researcher+cross-patient deny`,
    });
  });

  test("AKSH-E2E-0017: appointment reminder — no clinical agent overload", async ({
    request,
    baseURL,
  }) => {
    const generator = getCohortGeneratorPatient("A");
    expect(GOLDEN_SCENARIO_PERF_0017.expectedDecision).toBe("INFORM");
    expect(GOLDEN_SCENARIO_PERF_0017.expectedWorkflow).toMatch(/Lightweight/i);

    const reminder = buildAppointmentReminder({
      patientId: generator.id,
      appointmentAt: "2026-09-15T09:30:00.000Z",
      clinicName: "Aksh E2E Demo Clinic",
    });
    const asserted = assertGoldenScenario0017(reminder);
    expect(asserted.ok).toBe(true);
    expect(reminder.clinicalAgentsInvoked).toEqual([]);
    expect(reminder.orchestrationInvoked).toBe(false);
    expect(reminder.ehrWrite).toBe(false);
    expect(reminder.liveEmis).toBe(false);

    // UI path: stable patient safety route remains available without forcing full agent overload for reminder
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-perf-0017" });
    const safety = await request.get(`/api/patients/${PERF_DEMO_PATIENTS.reminder.id}/safety-route`);
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as { hitlRequired?: boolean };
    expect(safetyBody.hitlRequired).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_PERF_0017.testId} · generator ${generator.id} · agents=0`,
    });
  });

  test("AKSH-E2E-0019: AI provider failure — deterministic fallback, no corruption", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const demo = PERF_DEMO_PATIENTS.llmFailure;
    expect(GOLDEN_SCENARIO_PERF_0019.expectedSafety).toBe("REVIEW_REQUIRED");
    expect(GOLDEN_SCENARIO_PERF_0019.expectedDecision).toBe("REQUEST_APPROVAL");

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-perf-0019" });

    const before = await request.get(`/api/patients/${demo.id}/state`);
    expect(before.ok()).toBeTruthy();
    const beforeBody = (await before.json()) as { factHistoryCount?: number };
    const priorCount = beforeBody.factHistoryCount ?? 0;

    const orch = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: demo.id,
        proposedDrug: "Apixaban",
        transcript: "Stage 11 LLM-off / provider-failure honesty. Draft only.",
        includeDrAssist: true,
      },
      timeout: 45_000,
    });
    expect(orch.ok()).toBeTruthy();
    const orchBody = (await orch.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      autoRetrain?: boolean;
      liveEmis?: boolean;
      orchestration?: {
        elapsedMs?: number;
        outputs?: Record<string, { mode?: string; plan?: string }>;
      };
    };
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.autoRetrain).toBe(false);
    expect(orchBody.liveEmis).toBe(false);
    expect(orchBody.orchestration?.outputs?.SYNTHESIS?.mode).toBe("deterministic");
    expect(orchBody.orchestration?.outputs?.GUARDIAN?.mode).toBe("deterministic");
    expect(orchBody.orchestration?.outputs?.SYNTHESIS?.plan?.length ?? 0).toBeGreaterThan(5);

    const after = await request.get(`/api/patients/${demo.id}/state`);
    expect(after.ok()).toBeTruthy();
    const afterBody = (await after.json()) as { factHistoryCount?: number };
    expect(afterBody.factHistoryCount ?? 0).toBeGreaterThanOrEqual(priorCount);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_PERF_0019.testId} · ${demo.id} · elapsed=${orchBody.orchestration?.elapsedMs ?? "n/a"}ms`,
    });
  });
});
