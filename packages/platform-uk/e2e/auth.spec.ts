import { expect, test } from "@playwright/test";

import { createOnboardedTestUser, signInViaUi } from "./helpers/auth";

const SIGNUP_ROLE_LABELS = [
  "GP",
  "Nurse / Care Coordinator",
  "Clinical Pharmacist",
  "Practice Manager / Admin",
  "ICS Lead / Clinical Informatics",
  "Hospital Executive",
  "Patient",
  "Researcher / Analyst",
] as const;

test.describe("Auth flow", () => {
  test.describe.configure({ mode: "serial" });
  test("signup page shows 8-tile role picker", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
    await expect(page.getByText("Your role")).toBeVisible();

    for (const label of SIGNUP_ROLE_LABELS) {
      const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
      await expect(page.getByRole("button", { name: pattern })).toBeVisible();
    }

    const roleTiles = page.locator('button[aria-pressed]');
    await expect(roleTiles).toHaveCount(8);

    await expect(page.getByTestId("signup-accept-terms")).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms of Service" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toBeVisible();
  });

  test("signin with onboarded GP reaches GP dashboard", async ({ page, request, baseURL }) => {
    const user = await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "auth-gp" });
    await signInViaUi(page, user.email, user.password);
    await page.goto("/dashboard/gp");
    await page.waitForURL(/\/dashboard\/gp/, { timeout: 15_000 });

    await expect(page.getByText(/Clinician Dashboard|AI Review Queue/i).first()).toBeVisible();
  });
});
