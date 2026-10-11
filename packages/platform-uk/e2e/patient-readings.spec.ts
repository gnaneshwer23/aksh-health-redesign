import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { applyApiCookiesToPage, createFreshTestUser, createOnboardedTestUser, signInViaApi } from "./helpers/auth";

/**
 * Week 7 "done when": a patient records readings on their phone; once linked, they reach the clinic record; a low
 * reading shows safety wording with the clinic's emergency number and is flagged for the care team; a clinician checks
 * it; readings saved offline are sent when the phone is back online.
 */
async function expectNoCriticalA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
}

test("patient readings: recorded on the phone, linked, shared, flagged, offline-safe, and checked by a clinician", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();

  // The clinic: emergency number 112, Lena imported, a single-use invite for her.
  const clinicCtx = await browser.newContext();
  await createOnboardedTestUser(clinicCtx.request, baseURL!, { role: "gp", label: "readings-gp" });
  const org = await (await clinicCtx.request.post("/api/orgs", { data: { name: `Riverbank Clinic ${stamp}`, kind: "clinic" } })).json();
  await clinicCtx.request.patch(`/api/orgs/${org.id}`, { data: { locale: { emergencyNumber: "112", glucoseUnit: "mmol/L" } } });
  const imported = await (await clinicCtx.request.post(`/api/orgs/${org.id}/patients`, { data: { patients: [{ recordRef: `RB-${stamp}`, givenName: "Lena", familyName: "Example", dateOfBirth: "1970-04-04" }] } })).json();
  const invite = await (await clinicCtx.request.post(`/api/orgs/${org.id}/invites`, { data: { kind: "patient", patientId: imported.rows[0].id } })).json();

  // 1. Lena signs up without a code and records a reading: it stays on her account.
  const patientCtx = await browser.newContext();
  const user = await createFreshTestUser(patientCtx.request, baseURL!, { role: "patient", label: "readings-patient" });
  await patientCtx.request.post("/api/onboarding/complete", { data: { role: "patient", fullName: "Lena Example", identity: { firstName: "Lena" } } });
  await signInViaApi(patientCtx.request, baseURL!, user.email, user.password);
  const page = await patientCtx.newPage();
  await applyApiCookiesToPage(page, patientCtx.request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/dashboard/patient");
  await expect(page.getByText("Your account is not linked to a clinic yet.")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Reading value").fill("7.0");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved to your account" })).toBeVisible();

  // 2. She links her clinic with the code and her date of birth, then chooses to share the earlier reading.
  await page.getByLabel("Clinic invite code").fill(invite.code);
  await page.getByLabel("Date of birth").fill("1970-04-04");
  await page.getByRole("button", { name: "Link" }).click();
  await expect(page.getByRole("heading", { name: "Hello, Lena" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-share-earlier]")).toContainText("1 reading before joining");
  await page.getByRole("button", { name: "Share with my care team" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 earlier reading shared" })).toBeVisible();

  // 3. A low glucose: general safety wording with the clinic's emergency number.
  await page.getByLabel("Reading value").fill("3.1");
  await page.getByLabel("When was it taken").selectOption("before_meal");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("[data-reading-notice]")).toContainText("call 112");
  await expect(page.locator("[data-readings-list]")).toContainText("3.1 mmol/L · before a meal");
  await expectNoCriticalA11y(page);

  // 4. A mistyped blood pressure is withdrawn by the patient.
  await page.getByLabel("Reading type").selectOption("bp");
  await page.getByLabel("Systolic").fill("150");
  await page.getByLabel("Diastolic").fill("95");
  await page.getByRole("button", { name: "Save" }).click();
  const bpLine = page.locator("[data-readings-list] li", { hasText: "150/95" });
  await bpLine.getByRole("button", { name: "Entered in error" }).click();
  await expect(bpLine).toContainText("Entered in error");

  // 5. Offline: saved on the phone, sent when back online.
  await page.getByLabel("Reading type").selectOption("weight");
  await patientCtx.setOffline(true);
  await page.getByLabel("Reading value").fill("80");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "offline" })).toBeVisible();
  await patientCtx.setOffline(false);
  await expect(page.locator("[data-readings-list]")).toContainText("80 kg", { timeout: 15_000 });

  // 6. The clinician sees the low reading first, flagged, and marks it checked.
  const gp = await clinicCtx.newPage();
  await applyApiCookiesToPage(gp, clinicCtx.request);
  await gp.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await gp.goto("/dashboard/network");
  const review = gp.locator("[data-readings-review]");
  await expect(review).toContainText("Lena Example", { timeout: 20_000 });
  const first = review.locator("li").first();
  await expect(first).toContainText("Glucose 3.1 mmol/L");
  await expect(first).toContainText("low");
  await expect(review).not.toContainText("150/95");
  await first.getByRole("checkbox").check();
  await review.getByRole("button", { name: "Mark as checked" }).click();
  await expect(review.getByRole("status")).toContainText("1 reading marked as checked");
  await expectNoCriticalA11y(gp);

  await page.reload();
  await expect(page.locator("[data-readings-list] li", { hasText: "3.1 mmol/L" })).toContainText("Checked by your care team", { timeout: 20_000 });
  await patientCtx.close();
  await clinicCtx.close();
});
