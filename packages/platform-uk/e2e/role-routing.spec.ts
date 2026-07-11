import { expect, test } from "@playwright/test";

test.describe("Role routing", () => {
  test("middleware protects dashboard routes for unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/gp");
    await page.waitForURL(/\/signin/, { timeout: 15_000 });

    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /Sign in to your account/i })).toBeVisible();
  });
});
