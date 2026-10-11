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
