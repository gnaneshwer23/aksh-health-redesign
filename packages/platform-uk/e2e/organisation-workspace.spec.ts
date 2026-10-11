import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { createFreshTestUser } from "./helpers/auth";

/**
 * Week 4 "done when": a clinic signs up and reaches a working slot-fill queue with real staff and patients, all
 * through the screens. Accounts are created with the same sign-up call the form makes; everything after is UI.
 */
async function expectNoCriticalA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
}

async function onboard(page: Page, roleButton: RegExp, fullName: string, organisation: (page: Page) => Promise<void>) {
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/onboarding/role-select");
  await page.getByRole("button", { name: roleButton }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/identity/);
  await page.getByLabel("Full name").fill(fullName);
  await page.getByLabel("Work email").fill(`${fullName.split(" ").pop()!.toLowerCase()}@clinic.example`);
  const phone = page.getByLabel("Phone");
  if (await phone.count()) await phone.fill("+10000000000");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/organisation/);
  await organisation(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/preferences/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/consent/);
  for (const box of await page.getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/tutorial/);
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(page).toHaveURL(/\/onboarding\/complete/);
  await page.getByRole("button", { name: "Go to your dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard\//, { timeout: 20_000 });
}

test("organisation: a clinic signs up, invites staff, imports patients and reaches a working slot-fill queue", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const clinic = `Riverside Diabetes Clinic ${Date.now()}`;
  const stamp = Date.now();

  // 1. Admin signs up and describes their own (empty) organisation.
  const adminCtx = await browser.newContext();
  await createFreshTestUser(adminCtx.request, baseURL!, { role: "gp", label: "org-admin" });
  const admin = await adminCtx.newPage();
  await onboard(admin, /^Physician \(GP \/ family doctor\)/, "Dr Morgan Admin", async (p) => {
    await p.getByRole("radio", { name: /Describe my organisation/ }).click();
    await p.getByLabel("Clinic or organisation name").fill(clinic);
  });

  // 2. Settings: time zone and emergency number drive Asha's safety wording.
  await admin.goto("/dashboard/organisation");
  await expect(admin.locator("[data-organisation-workspace]")).toContainText(clinic, { timeout: 20_000 });
  await admin.getByLabel("Time zone").fill("Europe/Berlin");
  await admin.getByLabel("Emergency number").fill("112");
  await admin.getByRole("button", { name: "Save settings" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Settings saved" })).toBeVisible();
  await expectNoCriticalA11y(admin);

  // 3. Invite a nurse; the code is shown once.
  await admin.getByRole("tab", { name: "staff" }).click();
  await admin.getByLabel("Invite role").selectOption("nurse");
  await admin.getByRole("button", { name: "Create invite code" }).click();
  const code = (await admin.locator("[data-invite-code] p.font-mono").innerText()).trim();
  expect(code.length).toBeGreaterThanOrEqual(8);
  await expectNoCriticalA11y(admin);

  // 4. Nurse signs up and joins with the code during onboarding.
  const nurseCtx = await browser.newContext();
  await createFreshTestUser(nurseCtx.request, baseURL!, { role: "nurse", label: "org-nurse" });
  const nurse = await nurseCtx.newPage();
  await onboard(nurse, /^Nurse \/ Diabetes educator/, "Sam Nurse", async (p) => {
    await p.getByRole("radio", { name: /I have an invite code/ }).click();
    await p.getByLabel("Staff invite code").fill(code);
    await p.getByRole("button", { name: "Join", exact: true }).click();
    await expect(p.getByRole("status").filter({ hasText: "You have joined" })).toBeVisible();
  });
  await nurse.goto("/dashboard/organisation");
  await expect(nurse.locator("[data-organisation-workspace]")).toContainText(clinic, { timeout: 20_000 });

  // The admin sees the nurse as an active member (no sandbox was created for them).
  await admin.reload();
  await admin.getByRole("tab", { name: "staff" }).click();
  await expect(admin.locator("[data-members]")).toContainText("Sam Nurse");
  expect((await (await nurse.request.get("/api/orgs")).json()).rows).toHaveLength(1);

  // 5. Import patients from CSV: the check shows the bad row before anything is written.
  await admin.getByRole("tab", { name: "patients" }).click();
  await admin.getByRole("button", { name: "Import CSV" }).click();
  const csv = [
    "record_number,given_name,family_name,date_of_birth,sex,diabetes_type,email,phone,preferred_channel,latest_hba1c_mmol_mol,hba1c_date",
    `RV-${stamp}-1,Nadia,Example,1959-05-02,female,type 2,,+10000000001,sms,62,2026-03-01`,
    `RV-${stamp}-2,Omar,Sample,1971-11-20,male,type_1,,,phone,,`,
    `RV-${stamp}-3,Broken,Row,not-a-date,,type_2,,,sms,,`,
  ].join("\n");
  await admin.getByLabel("CSV text").fill(csv);
  await admin.getByRole("button", { name: "Check file" }).click();
  await expect(admin.locator("[data-import-report]")).toContainText("2 of 3 rows ready");
  await expect(admin.locator("[data-import-report] tbody tr")).toHaveCount(1);
  await expect(admin.locator("[data-import-report] tbody")).toContainText("dateOfBirth");
  await expectNoCriticalA11y(admin);
  await admin.getByRole("button", { name: /^Import 2 patients/ }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Imported 2 patients" })).toBeVisible();
  await expect(admin.locator("[data-org-patients]")).toContainText("Nadia Example");

  // 6. Patient record: invite code and waiting list.
  await admin.locator("[data-org-patients] button", { hasText: "Nadia Example" }).click();
  await admin.getByRole("button", { name: "Create patient invite code" }).click();
  await expect(admin.locator("[data-patient-actions] [data-invite-code]")).toBeVisible();
  const waitlist = admin.locator("[data-add-waitlist]");
  await waitlist.getByLabel("Appointment type").selectOption("foot_check");
  await waitlist.getByLabel("Reason").selectOption("overdue_care");
  await waitlist.getByLabel("Contact channel").selectOption("sms");
  await waitlist.getByRole("button", { name: "Add to waiting list" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Added to the waiting list" })).toBeVisible();
  await expectNoCriticalA11y(admin);

  // 6b. PRD PA-108: the admin approves the clinic's own offer wording (checked live, versioned).
  await admin.getByRole("tab", { name: "Offer wording" }).click();
  const wording = admin.getByLabel("Offer wording");
  await expect(wording).toBeVisible({ timeout: 20_000 });
  await wording.fill("Hi {givenName}, your diabetes team has a {appointmentType}.");
  await expect(admin.locator("[data-wording-problems]")).toContainText("{when}", { timeout: 20_000 });
  await wording.fill("Hi {givenName}, {organisationName} can offer you a {appointmentType} on {when}{site}. Reply YES by {replyBy}. Reply STOP to opt out.");
  await expect(admin.locator("[data-wording-preview]")).toContainText("Hi Sam", { timeout: 20_000 });
  await admin.getByRole("button", { name: "Approve wording" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Wording approved as version 1" })).toBeVisible({ timeout: 20_000 });
  await expect(admin.locator("[data-wording-versions]")).toContainText("Version 1 · in use");

  // 7. The nurse records a freed slot and works it to a drafted offer (shadow mode).
  await nurse.goto("/dashboard/access");
  const form = nurse.locator("[data-record-slot]");
  await expect(form).toBeVisible({ timeout: 20_000 });
  await expectNoCriticalA11y(nurse);
  await form.getByLabel("Appointment type").selectOption("foot_check");
  await form.getByLabel("Site").fill("Main site");
  await form.getByRole("button", { name: "Record freed slot" }).click();
  await expect(nurse.locator("[data-slot-detail]")).toContainText("Slot recorded", { timeout: 20_000 });
  await expect(nurse.locator("[data-slot-queue]")).toContainText(/foot check/i);
  await nurse.getByRole("button", { name: "Find patients for this slot" }).click();
  await expect(nurse.locator("[data-candidates]")).toContainText("Nadia Example");
  await nurse.getByRole("button", { name: "Draft offer" }).click();
  await expect(nurse.locator("[data-offer-text]")).toContainText(`Hi Nadia, ${clinic} can offer you a foot check`, { timeout: 20_000 });
  // §10.2: staff time against the slot.
  await nurse.locator("[data-slot-notes] summary").click();
  await nurse.getByLabel("Minutes spent on this slot").fill("5");
  await nurse.getByRole("button", { name: "Log time" }).click();
  await expect(nurse.getByRole("status").filter({ hasText: "Time logged" })).toBeVisible({ timeout: 20_000 });

  await adminCtx.close();
  await nurseCtx.close();
});
