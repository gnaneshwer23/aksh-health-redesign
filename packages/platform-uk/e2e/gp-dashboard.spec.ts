import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

test.describe("GP dashboard", () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "gp-dashboard" });
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/gp");
    await expect(page.getByText(/Clinician Dashboard|AI Review Queue/i).first()).toBeVisible();
  });

  test("dashboard shows persistent synthetic data banner", async ({ page }) => {
    const banner = page.getByTestId("demo-data-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Demo environment");
    await expect(banner).toContainText("All patients are synthetic");
    await expect(banner).toContainText("No real NHS data");
  });

  test("dashboard loads with working sidebar navigation", async ({ page }) => {
    await expect(page.getByRole("link", { name: "My Patients" })).toBeVisible();

    await page.getByRole("link", { name: "My Patients" }).click();
    await page.waitForURL(/\/dashboard\/gp\/patients/);
    await expect(page.getByText(/My Patients|Search by name/i).first()).toBeVisible();

    await page.getByRole("link", { name: "Review Queue" }).click();
    await page.waitForURL(/\/dashboard\/gp\/review-queue/);
    await expect(page.getByRole("region", { name: "AI Review Queue" })).toBeVisible();
  });
});
