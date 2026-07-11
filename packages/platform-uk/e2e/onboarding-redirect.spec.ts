import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createFreshTestUser } from "./helpers/auth";

test.describe("Onboarding redirect", () => {
  test("authenticated user without onboarding is sent to onboarding flow", async ({
    page,
    request,
    baseURL,
  }) => {
    await createFreshTestUser(request, baseURL!, { role: "gp", label: "onboarding" });
    await applyApiCookiesToPage(page, request);

    await page.goto("/dashboard/gp");
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

    await expect(page).toHaveURL(/\/onboarding\/role-select/);
    await expect(page.getByRole("button", { name: /GP/i }).first()).toBeVisible();
  });
});
