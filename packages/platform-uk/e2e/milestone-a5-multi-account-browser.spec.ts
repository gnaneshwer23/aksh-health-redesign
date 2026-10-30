import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Milestone A5 — multi-account *browser* smoke for §11.2 stakeholder surfaces.
 *
 * Honesty: this is role-landing + API denial evidence across separate browser
 * contexts — not a single click-path that books → observes → decides in one UI
 * chain. Lab/pharmacy remain simulation-layer (covered in API/unit golden).
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
