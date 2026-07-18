import { expect, test } from "@playwright/test";

test.describe("Role routing", () => {
  test("unauthenticated users can access public GP demo dashboard", async ({ page }) => {
    await page.goto("/dashboard/gp");
    await expect(page).toHaveURL(/\/dashboard\/gp/);
    await expect(page.getByTestId("demo-data-banner")).toBeVisible();
    await expect(page.getByText(/Clinician Dashboard|AI Review Queue/i).first()).toBeVisible();
  });

  test("unauthenticated users can access public ICS demo dashboard", async ({ page }) => {
    await page.goto("/dashboard/ics");
    await expect(page).toHaveURL(/\/dashboard\/ics/);
    await expect(page.getByTestId("demo-data-banner")).toBeVisible();
    await expect(page.getByTestId("neo4j-mock-mode-banner")).toHaveCount(0);
    await expect(page.getByTestId("neo4j-live-mode-banner")).toHaveCount(0);
    await expect(page.getByText(/ICS Population Intelligence|Total Patients/i).first()).toBeVisible();
  });

  test("unauthenticated users can access public Hospital demo dashboard", async ({ page }) => {
    await page.goto("/dashboard/hospital");
    await expect(page).toHaveURL(/\/dashboard\/hospital/);
    await expect(page.getByTestId("demo-data-banner")).toBeVisible();
    await expect(page.getByTestId("hospital-mock-mode-banner")).toBeVisible();
    await expect(page.getByText(/Command Centre|synthetic/i).first()).toBeVisible();
  });

  test("middleware still protects non-demo dashboard routes", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await page.waitForURL(/\/signin/, { timeout: 15_000 });

    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("heading", { name: /^Sign in$/i })).toBeVisible();
  });
});
