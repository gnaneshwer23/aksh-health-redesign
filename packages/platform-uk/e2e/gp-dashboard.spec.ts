import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

test.describe("GP dashboard", () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "gp-dashboard" });
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/gp");
    await expect(page.getByText(/Clinician Dashboard|AI Review Queue/i).first()).toBeVisible();
  });

  test("dashboard loads without demo data banner", async ({ page }) => {
    await expect(page.getByTestId("demo-data-banner")).toHaveCount(0);
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
