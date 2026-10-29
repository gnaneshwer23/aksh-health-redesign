import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createFreshTestUser, signInViaApi } from "./helpers/auth";

/**
 * What production shows. Runs only against a server started with AKSH_REAL_WORKSPACE=true (or in production mode),
 * because the rest of the suite exercises the demo estate.
 */
test.skip(process.env.AKSH_REAL_WORKSPACE !== "true", "real workspace not enabled for this run");

test("real workspace: a new clinic starts empty, sees only real pages, and never the demo", async ({ page, request, baseURL }) => {
  test.setTimeout(90_000);
  const { email, password } = await createFreshTestUser(request, baseURL!, { role: "practice-manager", label: "real-ws" });
  // Even if a client asks for the sandbox clinic, the real workspace creates an empty one: no sample patients.
  const done = await request.post("/api/onboarding/complete", { data: { role: "practice-manager", fullName: "Real Manager", organisation: { useSynthetic: true } } });
  expect(done.ok()).toBeTruthy();
  await signInViaApi(request, baseURL!, email, password);
  await applyApiCookiesToPage(page, request);
  await page.addInitScript(() => localStorage.setItem("aksh_cookie_consent", "essential"));

  // Demo dashboards redirect to Today.
  await page.goto("/dashboard/admin");
  await expect(page).toHaveURL(/\/dashboard\/today$/);
  await expect(page.locator("[data-today]")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-today-setup]")).toHaveAttribute("data-today-setup", "add_patients");
  await expect(page.locator("[data-today-org]")).toContainText("0 patients");

  // Only real navigation; no demo menu, mock notifications, sample search or status debug strip.
  const nav = page.getByRole("complementary", { name: "Dashboard navigation" });
  for (const label of ["Today", "Fill slots", "Patients", "Organisation", "Security"]) await expect(nav.getByRole("link", { name: label })).toBeVisible();
  for (const label of ["Front Desk", "Integrations", "System spine", "Billing", "CGM monitoring"]) await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Demo and help" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /notifications/ })).toHaveCount(0);
  await expect(page.getByLabel("Global search")).toHaveCount(0);
  await expect(page.getByText("liveEmis")).toHaveCount(0);

  for (const demo of ["/dashboard/front-desk", "/dashboard/gp", "/review"]) {
    await page.goto(demo);
    await expect(page).toHaveURL(/\/dashboard\/today$/);
  }

  // The setup step opens the right place.
  await page.locator("[data-today-setup] a").click();
  await expect(page).toHaveURL(/\/dashboard\/organisation\?org=.+&tab=patients/);
  await expect(page.getByRole("tab", { name: "patients" })).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
});

test("real workspace: sign-up offers only roles with a working product", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/signup");
  const grid = page.getByTestId("signup-role-grid");
  await expect(grid).toBeVisible({ timeout: 20_000 });
  await expect(grid).not.toContainText("Hospital Executive");
  await expect(grid).not.toContainText("Population health lead");
  await expect(grid).not.toContainText("Researcher");
  await expect(grid).toContainText("Patient");
});

test("real workspace: investor demos stay gated; marketing workflow demos stay public", async ({ page }) => {
  for (const path of ["/demo/patel", "/demo/script", "/demo/precision-health-loop", "/asha", "/gp-dashboard", "/product/demo"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/$/);
  }
  // Legacy /voice-care alias lands on the public demo catalog — never the gated Patel walkthrough.
  await page.goto("/voice-care");
  await expect(page).toHaveURL(/\/demo$/);
  for (const path of ["/demo", "/demo/slot-fill", "/demo/glucose"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`));
    await expect(page.getByText(/synthetic/i).first()).toBeVisible();
  }
});

test("real workspace: the clinical agents and the Track B link are closed", async ({ request }) => {
  for (const path of ["/api/agents/orchestrate", "/api/agents/horizon", "/api/front-desk/conversations", "/api/clinical-spine/orchestrate", "/api/precision-health/status"]) {
    const r = await request.post(path, { data: { patientId: "P001" } });
    expect(r.status(), path).toBe(403);
    expect((await r.json()).error).toMatch(/TRACK_B_NOT_OPEN/);
  }
  for (const path of ["/api/front-desk/state", "/api/patients/P001"]) expect((await request.get(path)).status(), path).toBe(403);
  for (const path of ["/api/chat", "/api/eval/agents", "/api/system/database-contract", "/api/integrations/medplum-status", "/api/roadmap"]) {
    expect((await request.get(path)).status(), `${path} closed`).toBe(403);
  }
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: "ok" });
  expect((await request.get("/api/today")).status(), "allowed APIs still reach their own auth").not.toBe(403);
  const review = await request.post("/api/network/patients/any/clinical-review");
  expect(review.status()).toBe(403);
});

test("real workspace: onboarding is role, identity, clinic, consent, then Today", async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);
  await createFreshTestUser(request, baseURL!, { role: "gp", label: "real-onboard" });
  await applyApiCookiesToPage(page, request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/onboarding/role-select");
  await page.getByRole("button", { name: /^Physician \(primary care or specialist\)/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/identity/);
  await expect(page.getByText("liveEmis")).toHaveCount(0);
  await page.getByLabel("Full name").fill("Dr Riley Example");
  await page.getByLabel("Work email").fill("riley@clinic.example");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/organisation/);
  await expect(page.getByRole("radio", { name: /Start in the sandbox clinic/ })).toHaveCount(0);
  await page.getByLabel("Clinic or organisation name").fill("Harbour Diabetes Clinic");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Preferences and the walkthrough are demo-only: straight to consent, and the indicator shows four steps.
  await expect(page).toHaveURL(/\/onboarding\/consent/, { timeout: 20_000 });
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await expect(page.getByText(/EHR staging|consent registry/)).toHaveCount(0);
  for (const box of await page.getByRole("checkbox").all()) {
    if (!(await box.isChecked())) await box.check();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/complete/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Go to your dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard\/today/, { timeout: 30_000 });
  await expect(page.locator("[data-today-org]")).toContainText("Harbour Diabetes Clinic", { timeout: 20_000 });
  await expect(page.locator("[data-today-org]")).toContainText("0 patients");
  await expect(page.locator("[data-needs-you]")).toContainText("Needs you now");
  await expect(page.locator("[data-work-empty]")).toContainText("Nothing needs you right now");
});
