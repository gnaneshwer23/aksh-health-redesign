import { expect, test } from "@playwright/test";

import {
  getCohortGeneratorPatient,
  GOLDEN_SCENARIO_SIM_0013,
  GOLDEN_SCENARIO_SIM_0014,
  loadE2EBatchManifest,
} from "./helpers/e2e-platform";
import { createOnboardedTestUser } from "./helpers/auth";
import { findDelayedLabs } from "../lib/e2e/lab-sim";
import { findAdherenceFailures } from "../lib/e2e/pharmacy-sim";
import { generateE2EDataset } from "../lib/e2e/generator";

/**
 * Golden journeys AKSH-E2E-0013 (lab delay), 0014 (pharmacy adherence → care team).
 */
test.describe("Platform golden journeys — stakeholder sims", () => {
  test("AKSH-E2E-0013: lab delay — no fabrication, then complete updates state fact", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const generator = getCohortGeneratorPatient("F");
    const dataset = generateE2EDataset({ seed: 20260812 });
    const manifest = await loadE2EBatchManifest();

    expect(GOLDEN_SCENARIO_SIM_0013.expectedDecision).toBe("OBSERVE");
    expect(generator.egfrSeries.length).toBe(0);
    expect(manifest.scenarioDistribution.F).toBeGreaterThanOrEqual(5);

    const delayed = findDelayedLabs(dataset.labEvents, {
      patientId: generator.id,
      testName: "eGFR",
    });
    expect(delayed.length).toBeGreaterThanOrEqual(1);
    expect(delayed[0]!.value).toBeNull();

    await createOnboardedTestUser(request, baseURL!, {
      role: "practice-manager",
      label: "golden-sim-0013",
    });

    const status = await request.get("/api/admin/e2e/sims");
    expect(status.ok()).toBeTruthy();
    const statusBody = (await status.json()) as {
      allowed?: boolean;
      liveNhsLab?: boolean;
      liveEmis?: boolean;
      counts?: { delayedLabs?: number };
    };
    expect(statusBody.allowed).toBe(true);
    expect(statusBody.liveNhsLab).toBe(false);
    expect(statusBody.liveEmis).toBe(false);
    expect((statusBody.counts?.delayedLabs ?? 0)).toBeGreaterThan(0);

    const complete = await request.post("/api/admin/e2e/sims", {
      data: {
        action: "complete-lab",
        labEventId: delayed[0]!.id,
        value: 55,
      },
    });
    expect(complete.ok()).toBeTruthy();
    const completeBody = (await complete.json()) as {
      result?: {
        event?: { status?: string; value?: number | null };
        patientStateFact?: { factType?: string; value?: { value?: number } };
        liveNhsLab?: boolean;
        ehrWrite?: boolean;
      };
      liveNhsLab?: boolean;
    };
    expect(completeBody.liveNhsLab).toBe(false);
    expect(completeBody.result?.event?.status).toBe("completed");
    expect(completeBody.result?.event?.value).toBe(55);
    expect(completeBody.result?.patientStateFact?.factType).toBe("egfr");
    expect(completeBody.result?.ehrWrite).toBe(false);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_SIM_0013.testId} · generator ${generator.id} · lab ${delayed[0]!.id}`,
    });
  });

  test("AKSH-E2E-0014: pharmacy adherence failure → care coordinator → clinician", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const generator = getCohortGeneratorPatient("E");
    const dataset = generateE2EDataset({ seed: 20260812 });

    expect(GOLDEN_SCENARIO_SIM_0014.expectedDecision).toBe("RECOMMEND");
    expect(generator.adherenceScore ?? 100).toBeLessThan(70);

    const failures = findAdherenceFailures(dataset.pharmacyEvents, { patientId: generator.id });
    expect(failures.length).toBeGreaterThanOrEqual(1);

    await createOnboardedTestUser(request, baseURL!, {
      role: "practice-manager",
      label: "golden-sim-0014",
    });

    const escalate = await request.post("/api/admin/e2e/sims", {
      data: {
        action: "pharmacy-escalate",
        pharmacyEventId: failures[0]!.id,
        patientId: generator.id,
      },
    });
    expect(escalate.ok()).toBeTruthy();
    const body = (await escalate.json()) as {
      task?: {
        status?: string;
        assigneeRole?: string;
        hitlRequired?: boolean;
        ehrWrite?: boolean;
        livePrescribing?: boolean;
        barrierSummary?: string;
      };
      followUp?: {
        source?: string;
        assignedRole?: string;
        assignedToUserId?: string | null;
        ehrWrite?: boolean;
      };
      careTeam?: { liveDirectory?: boolean; memberCount?: number };
      livePrescribing?: boolean;
      liveEmis?: boolean;
    };

    expect(body.livePrescribing).toBe(false);
    expect(body.liveEmis).toBe(false);
    expect(body.task?.status).toBe("escalated_to_clinician");
    expect(body.task?.assigneeRole).toBe("gp");
    expect(body.task?.hitlRequired).toBe(true);
    expect(body.task?.ehrWrite).toBe(false);
    expect(body.task?.barrierSummary).toBeTruthy();
    expect(body.followUp?.source).toBe("pharmacy");
    expect(body.followUp?.assignedRole).toBe("gp");
    expect(body.followUp?.assignedToUserId).toBeTruthy();
    expect(body.careTeam?.liveDirectory).toBe(false);
    expect((body.careTeam?.memberCount ?? 0)).toBeGreaterThanOrEqual(1);

    test.info().annotations.push({
      type: "golden-scenario",
      description: `${GOLDEN_SCENARIO_SIM_0014.testId} · generator ${generator.id} · pharmacy ${failures[0]!.id}`,
    });
  });
});
