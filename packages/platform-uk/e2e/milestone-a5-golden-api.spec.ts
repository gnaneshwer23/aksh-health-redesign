import { expect, test } from "@playwright/test";

import { createOnboardedTestUser } from "./helpers/auth";

/**
 * Milestone A5 — optional Playwright *API* surface for §11.2 gates.
 *
 * Honesty: this is request-level API automation against a running Next server,
 * not a multi-role browser UI journey (patient→reception→nurse→GP click path).
 * Default `npm run test:milestone-a5` does **not** include this file.
 */
test.describe("Milestone A5 — golden API gates (optional Playwright)", () => {
  test("GP orchestrate + Guardian honesty flags for synthetic P002", async ({
    request,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    await createOnboardedTestUser(request, baseURL!, {
      role: "gp",
      label: "milestone-a5-golden-api",
    });

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: "P002",
        transcript: "A5 golden API: synthetic diabetes review. Draft only.",
        includeDrAssist: false,
        careEpisodeId: `ce-a5-pw-${Date.now().toString(36)}`,
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
  });

  test("patient role cannot invoke orchestrate (role bypass)", async ({ request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, {
      role: "patient",
      label: "milestone-a5-neg-patient",
    });

    const orchestrate = await request.post("/api/agents/orchestrate", {
      data: {
        patientId: "P002",
        transcript: "should be denied",
        includeDrAssist: false,
      },
      timeout: 30_000,
    });
    expect([401, 403]).toContain(orchestrate.status());
  });
});
