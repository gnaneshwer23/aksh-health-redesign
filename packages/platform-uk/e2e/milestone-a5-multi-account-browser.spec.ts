import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";
import type { ReviewCase } from "../lib/types";

/**
 * Milestone A5 — multi-account browser evidence for §11.2 stakeholder surfaces.
 *
 * 1) Role-landing smoke + API authz denials (separate contexts).
 * 2) Full single-session golden click-path: Front Desk booking → nurse observe →
 *    GP CONDUCTOR orchestrate + review Accept (synthetic P002 / James Patel only).
 *
 * Lab/pharmacy remain simulation-layer (API/unit golden + admin E2E sim controls).
 */

test.describe("Milestone A5 — multi-account browser smoke", () => {
  test("GP / nurse / front-desk landings + patient/ops authz denials", async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    const root = baseURL!;

    const gpCtx = await browser.newContext();
    await createOnboardedTestUser(gpCtx.request, root, { role: "gp", label: "a5-browser-gp" });
    const gpPage = await gpCtx.newPage();
    await applyApiCookiesToPage(gpPage, gpCtx.request);
    await gpPage.goto("/dashboard/gp/patients");
    await expect(gpPage.getByText(/my patients/i).first()).toBeVisible({
      timeout: 45_000,
    });
    const orch = await gpCtx.request.post("/api/agents/orchestrate", {
      data: {
        patientId: "P002",
        transcript: "A5 browser smoke: synthetic diabetes review. Draft only.",
        includeDrAssist: false,
      },
      timeout: 45_000,
    });
    expect(orch.ok()).toBeTruthy();
    const orchBody = (await orch.json()) as { ehrWrite?: boolean; hitlRequired?: boolean };
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    await gpCtx.close();

    const nurseCtx = await browser.newContext();
    await createOnboardedTestUser(nurseCtx.request, root, { role: "nurse", label: "a5-browser-nurse" });
    const nursePage = await nurseCtx.newPage();
    await applyApiCookiesToPage(nursePage, nurseCtx.request);
    await nursePage.goto("/dashboard/nurse");
    await expect(nursePage.getByText(/observation|nurse|handover|continuous care/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await nurseCtx.close();

    const fdCtx = await browser.newContext();
    await createOnboardedTestUser(fdCtx.request, root, {
      role: "practice-manager",
      label: "a5-browser-fd",
    });
    const fdPage = await fdCtx.newPage();
    await applyApiCookiesToPage(fdPage, fdCtx.request);
    await fdPage.goto("/dashboard/front-desk");
    await expect(fdPage.locator("body")).toContainText(/front desk|booking|intake|schedule/i, {
      timeout: 45_000,
    });
    const opsOk = await fdCtx.request.get("/api/agents/ops-runs?alerts=1");
    expect(opsOk.ok()).toBeTruthy();
    const opsDeniedInvoke = await fdCtx.request.post("/api/agents/orchestrate", {
      data: { patientId: "P002", transcript: "ops must not invoke", includeDrAssist: false },
      timeout: 30_000,
    });
    expect([401, 403]).toContain(opsDeniedInvoke.status());
    await fdCtx.close();

    const patientCtx = await browser.newContext();
    await createOnboardedTestUser(patientCtx.request, root, {
      role: "patient",
      label: "a5-browser-patient",
    });
    const patientPage = await patientCtx.newPage();
    await applyApiCookiesToPage(patientPage, patientCtx.request);
    await patientPage.goto("/dashboard/patient");
    await expect(patientPage.locator("body")).toBeVisible({ timeout: 45_000 });
    const patientOrch = await patientCtx.request.post("/api/agents/orchestrate", {
      data: { patientId: "P002", transcript: "patient bypass", includeDrAssist: false },
      timeout: 30_000,
    });
    expect([401, 403]).toContain(patientOrch.status());
    const patientOps = await patientCtx.request.get("/api/agents/ops-runs");
    expect([401, 403]).toContain(patientOps.status());
    await patientCtx.close();

    const researcherCtx = await browser.newContext();
    await createOnboardedTestUser(researcherCtx.request, root, {
      role: "researcher",
      label: "a5-browser-researcher",
    });
    const researcherOps = await researcherCtx.request.get("/api/agents/ops-runs");
    expect([401, 403]).toContain(researcherOps.status());
    const researcherOrch = await researcherCtx.request.post("/api/agents/orchestrate", {
      data: { patientId: "P002", transcript: "researcher bypass", includeDrAssist: false },
      timeout: 30_000,
    });
    expect([401, 403]).toContain(researcherOrch.status());
    await researcherCtx.close();
  });
});

test.describe("Milestone A5 — multi-account golden click-path", () => {
  test("Front Desk booking → nurse observe → GP CONDUCTOR + review Accept", async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(240_000);
    const root = baseURL!;
    const careEpisodeHint = `ce-a5-click-${Date.now().toString(36)}`;

    // --- 1) Front Desk: sample referral → confirm booking (synthetic Patel / P002) ---
    const fdCtx = await browser.newContext();
    await createOnboardedTestUser(fdCtx.request, root, {
      role: "practice-manager",
      label: "a5-click-fd",
    });
    const fdPage = await fdCtx.newPage();
    await applyApiCookiesToPage(fdPage, fdCtx.request);
    await fdPage.goto("/dashboard/front-desk");
    await expect(fdPage.getByRole("heading", { name: "Front Desk", level: 1 })).toBeVisible({
      timeout: 45_000,
    });
    await expect(fdPage.getByText(/Synthetic patients · simulated telephony · no EHR write/)).toBeVisible();

    await fdPage.getByRole("button", { name: "Use sample letter" }).click();
    await fdPage.getByRole("button", { name: "Process referral" }).click();
    await expect(fdPage.getByTestId("referral-intake-card").first()).toBeVisible({ timeout: 30_000 });
    await expect(fdPage.getByText(/Proposed: /).first()).toBeVisible({ timeout: 30_000 });
    await fdPage.getByTestId("referral-confirm-booking").first().click();
    await expect(fdPage.getByTestId("referral-intake-card").filter({ hasText: /booked/i }).first()).toBeVisible({
      timeout: 45_000,
    });

    const worklistProbe = await fdCtx.request.get("/api/nurse/observation-worklist");
    // practice-manager may be allowed or denied; nurse context is the authority below
    expect([200, 401, 403]).toContain(worklistProbe.status());
    await fdCtx.close();

    // --- 2) Nurse: observation worklist → record vitals (HITL, ehrWrite:false) ---
    const nurseCtx = await browser.newContext();
    await createOnboardedTestUser(nurseCtx.request, root, {
      role: "nurse",
      label: "a5-click-nurse",
    });
    const nursePage = await nurseCtx.newPage();
    await applyApiCookiesToPage(nursePage, nurseCtx.request);

    const nurseWl = await nurseCtx.request.get("/api/nurse/observation-worklist");
    expect(nurseWl.ok()).toBeTruthy();
    const nurseWlBody = (await nurseWl.json()) as {
      items: { patientId?: string; careEpisodeId?: string | null; kind?: string }[];
      ehrWrite?: boolean;
    };
    expect(nurseWlBody.ehrWrite).toBe(false);
    expect(
      nurseWlBody.items.some((i) => i.patientId === "P002" || /P002|Patel/i.test(JSON.stringify(i)))
    ).toBeTruthy();

    await nursePage.goto("/dashboard/nurse");
    await expect(nursePage.getByTestId("nurse-observation-worklist")).toBeVisible({ timeout: 45_000 });
    await expect(nursePage.getByTestId("nurse-honesty-banner")).toBeAttached();

    await nursePage.goto("/dashboard/nurse/observations");
    await expect(nursePage.getByText(/James Patel|Observations/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await nursePage.getByLabel("Systolic BP").fill("128");
    await nursePage.getByLabel("Diastolic BP").fill("78");
    await nursePage.getByPlaceholder("Heart rate (bpm)").fill("72");
    await nursePage.getByRole("button", { name: "Save Observations" }).click();
    await expect(nursePage.getByText(/Observations on clinical spine|Sim write-back only/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(nursePage.getByTestId("nurse-vitals-timeline-note")).toContainText(/liveEmis:false/);
    await nurseCtx.close();

    // --- 3) GP: CONDUCTOR orchestrate + primary review Accept (no EHR write) ---
    const gpCtx = await browser.newContext();
    const gpUser = await createOnboardedTestUser(gpCtx.request, root, {
      role: "gp",
      label: "a5-click-gp",
    });
    const gpPage = await gpCtx.newPage();
    await applyApiCookiesToPage(gpPage, gpCtx.request);

    const orch = await gpCtx.request.post("/api/agents/orchestrate", {
      data: {
        patientId: "P002",
        transcript:
          "A5 golden click-path: synthetic diabetes review after nurse observations. Draft only for HITL.",
        includeDrAssist: false,
        careEpisodeId: careEpisodeHint,
      },
      timeout: 60_000,
    });
    expect(orch.ok()).toBeTruthy();
    const orchBody = (await orch.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      liveEmis?: boolean;
      safetyRoute?: string;
    };
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.liveEmis ?? false).toBe(false);
    expect(["clinical_review_queue", "urgent_flag"]).toContain(orchBody.safetyRoute);

    const create = await gpCtx.request.post("/api/review-cases", {
      data: {
        action: "create",
        patientLabel: "Mr James Patel (synthetic A5 click-path)",
        rawInput:
          "Care plan review after nurse observations and CONDUCTOR draft. Accept recommendation for follow-up HbA1c. Synthetic only.",
        sourceType: "note",
      },
    });
    expect(create.status()).toBe(201);
    const created = (await create.json()) as { reviewCase: ReviewCase };
    const caseId = created.reviewCase.id;

    await gpPage.goto(`/cases/${caseId}`);
    await expect(gpPage.getByTestId("decision-accept")).toBeVisible({ timeout: 45_000 });
    await gpPage.getByTestId("decision-accountability-check").check();
    await gpPage.getByTestId("decision-accept").click();
    await expect(gpPage.getByTestId("decision-accept")).toBeDisabled({ timeout: 45_000 });

    const stored = (
      (await (await gpCtx.request.get(`/api/review-cases/${caseId}`)).json()) as {
        reviewCase: ReviewCase;
      }
    ).reviewCase;
    expect(stored.status).toBe("accepted");
    expect(stored.reviewSummary?.lastReviewer).toBe(gpUser.email);
    await gpCtx.close();
  });
});
