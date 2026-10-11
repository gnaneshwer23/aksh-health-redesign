import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import pg from "pg";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Week 5 "done when": a clinic completes its go-live checklist through the screens, an Aksh reviewer asks for one
 * change, then approves; the clinic is live in shadow mode and every step is in the history.
 */
async function expectNoCriticalA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
}

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

async function fillEvidence(page: Page, key: string, values: Record<string, string>) {
  const item = page.locator(`[data-evidence-item="${key}"]`);
  await item.getByRole("button", { name: /Add evidence|Update/ }).click();
  const form = page.locator(`[data-evidence-form="${key}"]`);
  for (const [label, value] of Object.entries(values)) {
    const field = form.getByLabel(label, { exact: true });
    if ((await field.evaluate((el) => el.tagName)) === "SELECT") await field.selectOption(value.startsWith("label:") ? { label: value.slice(6) } : value);
    else await field.fill(value);
  }
  await form.getByRole("button", { name: /Submit|Resubmit/ }).click();
  await expect(item).toContainText("Awaiting Aksh review");
}

test("go-live: a clinic completes its checklist, Aksh reviews and approves, and it is live in shadow mode", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();
  const clinic = `Lakeside Diabetes Centre ${stamp}`;

  // Set-up already covered through the screens by the Week 4 journey: organisation, settings, a nurse, patients.
  const adminCtx = await browser.newContext();
  await createOnboardedTestUser(adminCtx.request, baseURL!, { role: "practice-manager", label: "golive-admin" });
  const org = await (await adminCtx.request.post("/api/orgs", { data: { name: clinic, kind: "diabetes_centre" } })).json();
  await adminCtx.request.patch(`/api/orgs/${org.id}`, { data: { locale: { timezone: "Asia/Kolkata", emergencyNumber: "112" } } });
  const imported = await (await adminCtx.request.post(`/api/orgs/${org.id}/patients`, { data: { patients: [{ recordRef: `LK-${stamp}`, givenName: "Asha", familyName: "Example", dateOfBirth: "1968-03-14" }] } })).json();
  await adminCtx.request.post(`/api/orgs/${org.id}/waitlist`, { data: { patientId: imported.rows[0].id, appointmentType: "diabetes_review", reason: "overdue_care", contactChannel: "sms" } });
  const invite = await (await adminCtx.request.post(`/api/orgs/${org.id}/invites`, { data: { kind: "staff", role: "nurse" } })).json();
  const nurseCtx = await browser.newContext();
  await createOnboardedTestUser(nurseCtx.request, baseURL!, { role: "nurse", label: "golive-nurse" });
  expect((await nurseCtx.request.post("/api/invites/accept", { data: { code: invite.code } })).ok()).toBeTruthy();
  await nurseCtx.close();

  // 1. The admin checks the nurse's registration on the official register.
  const admin = await adminCtx.newPage();
  await applyApiCookiesToPage(admin, adminCtx.request);
  await admin.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await admin.goto("/dashboard/organisation");
  await admin.getByRole("tab", { name: "go-live" }).click();
  await expect(admin.locator("[data-auto-checks]")).toContainText("Not yet checked");
  await expect(admin.getByRole("button", { name: "Request go-live review" })).toBeDisabled();
  await expectNoCriticalA11y(admin);
  await admin.getByRole("tab", { name: "staff" }).click();
  const nurseRow = admin.locator("[data-members] li", { hasText: "Nurse / educator" });
  await nurseRow.getByRole("button", { name: "Check registration" }).click();
  const check = nurseRow.locator("[data-registration-check]");
  await check.getByLabel("Check outcome").selectOption("verified");
  await check.getByLabel("Register checked").fill("National nursing register");
  await check.getByLabel("Registration number").fill(`RN-${stamp}`);
  await check.getByLabel("Check reference").fill("Register search, screenshot on file");
  await check.getByRole("button", { name: "Record check" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Registration recorded as checked" })).toBeVisible();
  await expect(nurseRow).toContainText("registration verified");

  // 2. Evidence for every item.
  await admin.getByRole("tab", { name: "go-live" }).click();
  await expect(admin.locator("[data-auto-checks]")).not.toContainText("Not yet checked");
  await fillEvidence(admin, "dpa", { "Signed on": iso(3), "Signed by (name)": "Priya Director", "Their role": "Medical director", "Document reference or version": "DPA v1.0" });
  await fillEvidence(admin, "dpia", { "Completed on": iso(2), "Assessment reference": "DPIA-2026-01", "Residual risk": "low" });
  await fillEvidence(admin, "safety_lead", { "Clinical safety lead": "label:E2E Test User" });
  await fillEvidence(admin, "contact_channel", { Channel: "sms", "Sender name patients will see": "Lakeside", "How patients opt out": "Reply STOP to stop these messages." });
  await fillEvidence(admin, "baseline", { "Period start": iso(45), "Period end": iso(3), "Freed slots in the period": "40", "Of those, filled": "11", "How you filled them before Aksh": "Reception phoned the list" });
  await expect(admin.locator("[data-go-live-blockers]")).toHaveCount(0);
  await admin.getByRole("button", { name: "Request go-live review" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Go-live review requested" })).toBeVisible();
  await expect(admin.locator("[data-go-live-status]")).toContainText("Review requested");

  // 3. An Aksh reviewer (granted out of band, as in production) asks for one change.
  const reviewerCtx = await browser.newContext();
  const reviewerAccount = await createOnboardedTestUser(reviewerCtx.request, baseURL!, { role: "practice-manager", label: "golive-reviewer" });
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  await db.query(`INSERT INTO aksh.platform_admins (user_id, granted_by) SELECT id, 'e2e' FROM aksh.users WHERE email = $1`, [reviewerAccount.email]);
  try {
  const reviewer = await reviewerCtx.newPage();
  await applyApiCookiesToPage(reviewer, reviewerCtx.request);
  await reviewer.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await reviewer.goto("/dashboard/platform");
  await expect(reviewer.getByRole("link", { name: "Go-live reviews" }).first()).toBeVisible({ timeout: 20_000 });
  await reviewer.locator("[data-review-queue] button", { hasText: clinic }).click();
  const dpa = reviewer.locator('[data-review-item="dpa"]');
  await dpa.getByLabel(/What needs to change/).fill("Add the signed copy reference");
  await dpa.getByRole("button", { name: "Request changes" }).click();
  await expect(dpa).toContainText("Changes requested");
  await expectNoCriticalA11y(reviewer);

  // 4. The admin resubmits; the reviewer accepts everything and approves.
  await admin.reload();
  await admin.getByRole("tab", { name: "go-live" }).click();
  await expect(admin.locator('[data-evidence-item="dpa"]')).toContainText("Aksh: Add the signed copy reference");
  await fillEvidence(admin, "dpa", { "Document reference or version": "DPA v1.0 signed copy" });
  await reviewer.locator("[data-review-queue] button", { hasText: clinic }).click();
  for (const key of ["dpa", "dpia", "safety_lead", "contact_channel", "baseline"]) {
    const item = reviewer.locator(`[data-review-item="${key}"]`);
    await item.getByRole("button", { name: "Accept" }).click();
    await expect(item).toContainText("Accepted");
  }
  await reviewer.getByLabel("Decision note").fill("Evidence complete");
  await reviewer.getByRole("button", { name: "Approve go-live" }).click();
  await expect(reviewer.getByRole("status").filter({ hasText: "Approved: live in shadow mode" })).toBeVisible();

  // 5. The clinic is live in shadow mode, and the history shows every step.
  await admin.reload();
  await expect(admin.locator("[data-organisation-workspace]")).toContainText("Live (read only)");
  await admin.getByRole("tab", { name: "go-live" }).click();
  await expect(admin.locator("[data-go-live-status]")).toContainText("Live in shadow mode");
  await expect(admin.getByTestId("live-workspace-banner")).toContainText(`${clinic} is live in shadow mode`);
  for (const step of ["Evidence submitted", "Changes requested by Aksh", "Accepted by Aksh", "Go-live review requested", "Approved: live in shadow mode"]) {
    await expect(admin.locator("[data-go-live-history]")).toContainText(step);
  }
  await expect(admin.locator('[data-evidence-item="baseline"]')).toContainText("Accepted · locked");

  } finally {
    // Never leave a test account with reviewer rights, whatever happened above.
    await db.query(`DELETE FROM aksh.platform_admins WHERE user_id = (SELECT id FROM aksh.users WHERE email = $1)`, [reviewerAccount.email]);
    await db.end();
    await adminCtx.close();
    await reviewerCtx.close();
  }
});
