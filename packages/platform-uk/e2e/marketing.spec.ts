import { expect, test } from "@playwright/test";

test.describe("Marketing smoke", () => {
  test("homepage loads with F01 hero, nav links, and open app CTA", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Clinical workflow\. AI-structured\. Clinician-owned\./i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "See it in action" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open operator view" }).first()).toBeVisible();

    const navigation = page.getByRole("navigation");
    await expect(navigation.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Clinicians" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Administrators" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Organisations" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Docs" })).toBeVisible();

    const openApp = navigation.getByRole("link", { name: "Open app" });
    await expect(openApp).toBeVisible();

    const opacity = await openApp.evaluate((element) => window.getComputedStyle(element).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });

  test("mobile nav exposes hamburger menu at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    await expect(page.locator("#mobile-nav-menu").getByRole("link", { name: "Demo" })).toBeVisible();
    await expect(page.locator("#mobile-nav-menu").getByRole("link", { name: "Clinician Dashboard" })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("dedicated audience and get-started routes render", async ({ page }) => {
    await page.goto("/for-clinicians");
    await expect(page.getByRole("heading", { level: 1, name: /Spend time with patients/i })).toBeVisible();

    await page.goto("/for-administrators");
    await expect(page.getByRole("heading", { level: 1, name: /Governance, tenancy, and integration readiness/i })).toBeVisible();

    await page.goto("/get-started");
    await expect(page.getByRole("heading", { name: /Get your organisation set up/i })).toBeVisible();
  });

  test("custom not-found page links home", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  });
});
