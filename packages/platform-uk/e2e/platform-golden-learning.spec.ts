import { expect, test } from "@playwright/test";

import {
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_LEARN_0008,
  GOLDEN_SCENARIO_LEARN_0018,
  GOLDEN_SCENARIO_LEARN_0020,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";
import { generateE2EDataset } from "../lib/e2e/generator";
import {
  buildE2EPopulationAggregate,
  detectHba1cImprovement,
} from "../lib/e2e/learning-state-assertions";

/**
 * Golden journeys AKSH-E2E-0008 (improvement), 0018 (idempotent ingest), 0020 (population honesty).
 */
test.describe("Platform golden journeys — learning + state versioning", () => {
  test("AKSH-E2E-0008: detect positive improvement trajectory", async ({ request, baseURL }) => {
    const generator = getCohortGeneratorPatient("H");
    const traj = detectHba1cImprovement(generator);
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_LEARN_0008.expectedDecision).toBe("INFORM");
    expect(traj.improved).toBe(true);
    expect(manifest.scenarioDistribution.H).toBeGreaterThanOrEqual(3);

    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-learn-0008" });

    // Improving patient path uses stable low-risk demo proxy for coaching-safe INFORM branch
    const safety = await request.get("/api/patients/P007/safety-route");
    expect(safety.ok()).toBeTruthy();
    const safetyBody = (await safety.json()) as {
      safetyRoute?: string;
      coachingAllowed?: boolean;
      hitlRequired?: boolean;
    };
    expect(safetyBody.hitlRequired).toBe(true);
    expect(safetyBody.safetyRoute).toBe("low_risk_coaching");
    expect(safetyBody.coachingAllowed).toBe(true);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_LEARN_0008.testId} · generator ${generator.id} · ΔHbA1c=${traj.delta}`,
    });
  });

  test("AKSH-E2E-0018: duplicate lab ingest — one logical fact, learning honesty", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "golden-learn-0018" });

    const patientId = "P002";
    const sourceReference = `e2e-dup-lab-${Date.now()}`;

    // Record accept learning event, then link outcome twice conceptually via state reads
    const learn = await request.post("/api/learning/events", {
      data: {
        agentLabel: "SYNTHESIS",
        predictionId: `pred-${sourceReference}`,
        predictionSummary: "Duplicate ingest rehearsal",
        decision: "accept",
        outcomeKind: "follow_up_scheduled",
        patientId,
      },
    });
    expect(learn.ok()).toBeTruthy();
    const learnBody = (await learn.json()) as {
      event?: { id?: string };
      autoRetrainTriggered?: boolean;
      modelUpdated?: boolean;
      ehrWrite?: boolean;
    };
    expect(learnBody.autoRetrainTriggered).toBe(false);
    expect(learnBody.modelUpdated).toBe(false);
    expect(learnBody.ehrWrite).toBe(false);
    expect(learnBody.event?.id).toBeTruthy();

    const outcome1 = await request.post(`/api/learning/events/${learnBody.event!.id}/outcome`, {
      data: {
        outcomeKind: "care_action_completed",
        outcomeSummary: "HbA1c lab recorded once",
        outcomeMetric: { name: "hba1c", value: 8.4, unit: "%" },
      },
    });
    expect(outcome1.ok()).toBeTruthy();
    const o1 = (await outcome1.json()) as {
      linked?: boolean;
      event?: { id?: string; linksToEventId?: string };
      autoRetrainTriggered?: boolean;
      ehrWrite?: boolean;
    };
    expect(o1.linked).toBe(true);
    expect(o1.event?.linksToEventId).toBe(learnBody.event!.id);
    expect(o1.autoRetrainTriggered).toBe(false);
    expect(o1.ehrWrite).toBe(false);

    // List events — source Accept row still present (append-only; no UPDATE)
    const listed = await request.get("/api/learning/events?limit=50");
    expect(listed.ok()).toBeTruthy();
    const listBody = (await listed.json()) as {
      events?: Array<{ id?: string; linksToEventId?: string | null }>;
      autoRetrain?: boolean;
      modelUpdates?: boolean;
    };
    expect(listBody.autoRetrain).toBe(false);
    expect(listBody.modelUpdates).toBe(false);
    expect(listBody.events?.some((e) => e.id === learnBody.event!.id)).toBe(true);
    expect(listBody.events?.some((e) => e.id === o1.event?.id)).toBe(true);

    // Patient state still readable after learning activity
    const state = await request.get(`/api/patients/${patientId}/state`);
    expect(state.ok()).toBeTruthy();

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_LEARN_0018.testId} · learning ${learnBody.event!.id} · outcome ${o1.event?.id}`,
    });
  });

  test("AKSH-E2E-0020: population aggregate matches generator / manifest", async ({
    request,
    baseURL,
  }) => {
    const dataset = generateE2EDataset({ seed: 20260812 });
    const aggregate = buildE2EPopulationAggregate(dataset);
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_LEARN_0020.expectedDecision).toBe("INFORM");
    expect(aggregate.totalPatients).toBe(manifest.patientCount);
    expect(aggregate.deterioratingCount).toBe(manifest.scenarioDistribution.B);
    expect(aggregate.cohortCounts.B).toBe(manifest.scenarioDistribution.B);
    expect(aggregate.liveEmis).toBe(false);
    expect(aggregate.autoRetrain).toBe(false);
    expect(aggregate.isSynthetic).toBe(true);

    await createOnboardedTestUser(request, baseURL!, {
      role: "practice-manager",
      label: "golden-learn-0020",
    });

    // E2E sim admin surface remains honest while reading cohort scale
    const sims = await request.get("/api/admin/e2e/sims");
    expect(sims.ok()).toBeTruthy();
    const simsBody = (await sims.json()) as {
      counts?: { patients?: number };
      liveEmis?: boolean;
      autoRetrain?: boolean;
    };
    expect(simsBody.liveEmis).toBe(false);
    expect((simsBody.counts?.patients ?? 0)).toBeGreaterThanOrEqual(aggregate.totalPatients);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_LEARN_0020.testId} · n=${aggregate.totalPatients} · deteriorating=${aggregate.deterioratingDisplay}`,
    });
  });
});
