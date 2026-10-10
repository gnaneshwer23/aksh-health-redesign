import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createFreshTestUser } from "./helpers/auth";

test("self-serve: physician signs up, skips registration, lands in sandbox workspace", async ({
  page,
  request,
  baseURL,
}) => {
  await createFreshTestUser(request, baseURL!, { role: "gp", label: "self-serve" });
  await applyApiCookiesToPage(page, request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/onboarding/role-select");

  await page.getByRole("button", { name: /^Physician \(GP \/ family doctor\)/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/identity/);
  await expect(page.getByText("Professional registration or licence number (optional)")).toBeVisible();
  await expect(page.getByText(/GMC|NPI|NHS/)).toHaveCount(0);
  await page.getByLabel("Full name").fill("Dr Riley Example");
  await page.getByLabel("Work email").fill("riley@clinic.example");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/organisation/);
  await expect(page.getByRole("radio", { name: /Start in the sandbox clinic/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/preferences/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/consent/);
  for (const box of await page.getByRole("checkbox").all()) {
    if (!(await box.isChecked())) await box.check();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding\/tutorial/);
  await page.getByRole("button", { name: "Skip tutorial" }).click();

  await expect(page).toHaveURL(/\/onboarding\/complete/);
  await page.getByRole("button", { name: "Go to your dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard\/gp/, { timeout: 20_000 });
  await expect(page.getByTestId("synthetic-workspace-banner")).toContainText("live patient data needs your organisation");
  await expect(page.getByRole("link", { name: "Bring Aksh to your organisation" })).toHaveAttribute("href", "/get-started");
});
