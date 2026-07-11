import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with nav links and visible pilot CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Healthcare Has Data/i })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Platform" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Pilot", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Docs" })).toBeVisible();

    const pilotCta = page.getByRole("link", { name: /Request a Pilot|Apply for Pilot Cohort/i }).first();
    await expect(pilotCta).toBeVisible();

    const opacity = await pilotCta.evaluate((element) => window.getComputedStyle(element).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });
});
