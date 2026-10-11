import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { base32Decode, hotp, stepAt } from "../lib/auth/totp";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/** Two-step sign-in: set it up from the Security page, then sign in again with password and authenticator code. */
test("mfa: set up two-step sign-in, then sign in with password and code", async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext();
  const account = await createOnboardedTestUser(ctx.request, baseURL!, { role: "practice-manager", label: "mfa" });
  const page = await ctx.newPage();
  await applyApiCookiesToPage(page, ctx.request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/dashboard/security");
  await page.getByRole("button", { name: "Set up two-step sign-in" }).click({ timeout: 20_000 });
  const secret = (await page.locator("[data-two-step-secret]").innerText()).replace(/\s+/g, "");
  const code = (offsetSteps = 0) => hotp(base32Decode(secret), stepAt(Date.now()) + offsetSteps);
  await page.getByLabel("Authenticator code").fill(code());
  await page.getByRole("button", { name: "Turn on" }).click();
  await expect(page.locator("[data-recovery-codes] li")).toHaveCount(8);
  await expect(page.locator("[data-two-step-on]")).toContainText("8 recovery codes left");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
  await ctx.close();

  // A fresh browser: password first, then the code step.
  const fresh = await browser.newContext();
  const signin = await fresh.newPage();
  await signin.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await signin.goto("/signin");
  await signin.getByTestId("signin-email").fill(account.email);
  await signin.getByTestId("signin-password").fill(account.password);
  await signin.getByTestId("signin-submit").click();
  await expect(signin.locator("[data-mfa-step]")).toBeVisible({ timeout: 20_000 });
  await signin.getByTestId("signin-otp").fill("000000");
  await signin.getByTestId("signin-submit").click();
  await expect(signin.locator("#signin-form-error")).toContainText("That code didn't work");
  // The set-up code's 30-second step is spent (codes are single use): wait for the next step.
  await signin.waitForTimeout(30_000 - (Date.now() % 30_000) + 1_000);
  await signin.getByTestId("signin-otp").fill(code());
  await signin.getByTestId("signin-submit").click();
  await expect(signin).toHaveURL(/\/dashboard\//, { timeout: 20_000 });
  await fresh.close();
});
