import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible get started CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Clinical workflows, one platform/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Solutions" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Docs" })).toBeVisible();

    const primaryCta = page.getByRole("navigation").getByRole("link", { name: "Get Started" });
    await expect(primaryCta).toBeVisible();

    const opacity = await primaryCta.evaluate((element) => window.getComputedStyle(element).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });
});
