import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, DEMO_ONBOARDING, signInViaApi } from "./helpers/auth";

test.describe("Onboarding redirect", () => {
  test("authenticated user without onboarding is sent to onboarding flow", async ({
    page,
    request,
    baseURL,
  }) => {
    await signInViaApi(request, baseURL!, DEMO_ONBOARDING.email, DEMO_ONBOARDING.password);
    await applyApiCookiesToPage(page, request);

    await page.goto("/dashboard/gp");
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

    await expect(page).toHaveURL(/\/onboarding\/role-select/);
    await expect(page.getByRole("button", { name: /GP/i }).first()).toBeVisible();
  });
});
