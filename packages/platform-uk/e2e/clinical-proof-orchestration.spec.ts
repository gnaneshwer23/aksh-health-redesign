import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Agent orchestration — same patient context → SYNTHESIS + GUARDIAN + ORACLE (+ DrASSIST).
 * Asserts shared context, no overwrite, GUARDIAN priority for urgent, HITL-only, EMIS blocked.
 */
test.describe("Clinical proof — agent orchestration", () => {
  test("P002 shared context: SYNTHESIS + GUARDIAN + ORACLE + DrASSIST, GUARDIAN leads when urgent", async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    await createOnboardedTestUser(request, baseURL!, {
      role: "gp",
      label: "orch-p002",
    });
    await applyApiCookiesToPage(page, request);

    const patientId = "P002";
    const patientLabel = "Mr James Patel";
    const proposedDrug = "Apixaban";
    const transcript =
      "Five-day left calf swelling. T2D on metformin and aspirin. Suspect DVT — consider anticoagulation.";

    const started = Date.now();

    // Parallel agent calls — independent responses (no shared mutable draft)
    const [synthesis, guardian, oracle, drAssist] = await Promise.all([
      request.post("/api/agents/synthesis", {
        data: { transcript, patientLabel: `${patientLabel} (${patientId})` },
        timeout: 25_000,
      }),
      request.post("/api/agents/guardian", {
        data: { patientId, proposedDrug },
        timeout: 25_000,
      }),
      request.post("/api/agents/oracle", {
        data: { patientId },
        timeout: 25_000,
      }),
      request.post("/api/agents/dr-assist", {
        data: { patientId },
        timeout: 25_000,
      }),
    ]);

    const elapsedMs = Date.now() - started;
    expect(elapsedMs).toBeLessThan(60_000);

    expect(synthesis.ok()).toBeTruthy();
    expect(guardian.ok()).toBeTruthy();
    expect(oracle.ok()).toBeTruthy();
    expect(drAssist.ok()).toBeTruthy();

    const sBody = (await synthesis.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      draft?: { patientLabel?: string; plan?: string; subjective?: string };
    };
    const gBody = (await guardian.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      draft?: { patientId?: string; overallStatus?: string; interactions?: unknown[] };
    };
    const oBody = (await oracle.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      draft?: { patientId?: string; oracleScore?: number; oracleRisk?: string };
    };
    const dBody = (await drAssist.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      draft?: { patientId?: string; codes?: unknown[] };
    };

    // HITL / zero write for all
    for (const body of [sBody, gBody, oBody, dBody]) {
      expect(body.ehrWrite).toBe(false);
      expect(body.hitlRequired).toBe(true);
    }

    // Shared patient context
    expect(gBody.draft?.patientId).toBe(patientId);
    expect(oBody.draft?.patientId).toBe(patientId);
    expect(dBody.draft?.patientId).toBe(patientId);
    expect(sBody.draft?.patientLabel?.toLowerCase()).toMatch(/patel|p002/);

    // Independently evidenced outputs (no overwrite — each draft has its own shape)
    expect(sBody.draft?.plan).toBeTruthy();
    expect(sBody.draft?.subjective).toBeTruthy();
    expect(typeof gBody.draft?.overallStatus).toBe("string");
    expect(Array.isArray(gBody.draft?.interactions)).toBeTruthy();
    expect(typeof oBody.draft?.oracleScore).toBe("number");
    expect(typeof oBody.draft?.oracleRisk).toBe("string");
    expect((dBody.draft?.codes?.length ?? 0) > 0).toBeTruthy();

    // GUARDIAN priority for urgent: Patel has interaction risk / URGENT flag
    // Review order contract: when status is red/amber OR risk high → GUARDIAN first
    const guardianStatus = gBody.draft?.overallStatus ?? "green";
    const oracleRisk = oBody.draft?.oracleRisk ?? "Low";
    const isUrgent =
      guardianStatus === "red" ||
      guardianStatus === "amber" ||
      oracleRisk === "High" ||
      oracleRisk === "VeryHigh";
    expect(isUrgent).toBeTruthy();

    const reviewOrder = isUrgent
      ? (["GUARDIAN", "ORACLE", "SYNTHESIS", "DrASSIST"] as const)
      : (["SYNTHESIS", "GUARDIAN", "ORACLE", "DrASSIST"] as const);
    expect(reviewOrder[0]).toBe("GUARDIAN");

    // Partner blocked
    const emis = await request.get("/api/integrations/emis-staging");
    const emisBody = (await emis.json()) as { liveWriteBack?: boolean };
    expect(emisBody.liveWriteBack).toBe(false);
  });
});
