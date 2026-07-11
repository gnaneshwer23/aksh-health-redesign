import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

test.describe("Patient dashboard", () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "patient", label: "patient-dashboard" });
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/patient");
  });

  test("mobile tab bar shows key health tabs", async ({ page }) => {
    await expect(page.getByText(/My Health|Ask Aksh/i).first()).toBeVisible();

    const tabList = page.getByRole("tablist");
    await expect(tabList).toBeVisible();

    for (const label of ["My Health", "Check-ins", "Medications", "Appointments", "Ask Aksh"]) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }

    const box = await tabList.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
  });
});
