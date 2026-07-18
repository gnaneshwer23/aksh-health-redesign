import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

test.describe("Clinical proof — RBAC", () => {
  test("nurse session is redirected away from admin dashboard", async ({ page, request, baseURL }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "nurse", label: "rbac-nurse" });
    await applyApiCookiesToPage(page, request);

    await page.goto("/dashboard/admin");
    // Middleware should bounce cross-role to the nurse dashboard (or onboarding/home)
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url).not.toMatch(/\/dashboard\/admin(?:\/|$)/);
  });

  test("researcher cannot open GP clinical review queue as own dashboard path", async ({
    page,
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "researcher", label: "rbac-research" });
    await applyApiCookiesToPage(page, request);

    await page.goto("/dashboard/gp/review-queue");
    await page.waitForTimeout(1500);
    const url = page.url();
    // Public GP demo allowlist may still render GP pages without auth; with researcher session,
    // middleware should deny non-matching role paths.
    expect(url).not.toMatch(/\/dashboard\/gp\/review-queue/);
  });

  test("public allowlist includes GP, ICS, and Hospital for unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/gp");
    await expect(page).toHaveURL(/\/dashboard\/gp/);

    await page.goto("/dashboard/ics");
    await expect(page).toHaveURL(/\/dashboard\/ics/);

    await page.goto("/dashboard/hospital");
    await expect(page).toHaveURL(/\/dashboard\/hospital/);

    await page.goto("/dashboard/pharmacist");
    await page.waitForURL(/\/signin/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/signin/);
  });
});
