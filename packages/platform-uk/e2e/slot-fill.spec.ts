import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

test("slot fill: staff match a freed slot, draft an offer in shadow mode, and booking waits for read-back", async ({ page, request, baseURL }) => {
  test.setTimeout(90_000);
  await createOnboardedTestUser(request, baseURL!, { role: "practice-manager", label: "slot-fill" });
  const org = await (await request.post("/api/orgs", { data: { name: `Slot Clinic ${Date.now()}`, kind: "clinic", locale: { timezone: "UTC" } } })).json();
  const imported = await (await request.post(`/api/orgs/${org.id}/patients`, {
    data: { patients: [{ recordRef: `SF-${Date.now()}`, givenName: "Nadia", familyName: "Example", dateOfBirth: "1959-05-02" }] },
  })).json();
  await request.post(`/api/orgs/${org.id}/waitlist`, {
    data: { patientId: imported.rows[0].id, appointmentType: "foot_check", reason: "overdue_care", careGap: "Annual foot check due", contactChannel: "sms" },
  });
  const start = new Date(Date.now() + 30 * 3_600_000);
  const slot = await (await request.post(`/api/orgs/${org.id}/slots`, {
    data: { source: "manual", sourceRef: `SLOT-${Date.now()}`, appointmentType: "foot_check", site: "Main site", startsAt: start.toISOString(), durationMin: 20, offerExpiresAt: new Date(start.getTime() - 6 * 3_600_000).toISOString() },
  })).json();
  expect(slot.workflowId).toBeTruthy();

  await applyApiCookiesToPage(page, request);
  await page.addInitScript(() => localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/dashboard/access");
  await expect(page.locator("[data-shadow-mode]")).toContainText("never sends messages", { timeout: 20_000 });
  await page.locator("[data-slot-queue] button", { hasText: "foot check" }).first().click();
  await page.getByRole("button", { name: "Find patients for this slot" }).click();
  await expect(page.locator("[data-candidates]")).toContainText("Nadia Example", { timeout: 20_000 });
  await expect(page.locator("[data-candidates]")).toContainText("Annual foot check due", { timeout: 20_000 });
  await page.getByRole("button", { name: "Draft offer" }).click();
  await expect(page.locator("[data-offer-text]")).toContainText("Hello Nadia", { timeout: 20_000 });
  await expect(page.locator("[data-offer-text]")).not.toContainText("foot check due");
  await page.getByRole("button", { name: "Edit wording" }).click();
  await page.getByLabel("Offer text").fill("Hello Nadia, we have an earlier foot appointment tomorrow morning at Main site. Reply YES to take it, or STOP to stop these messages.");
  await page.getByRole("button", { name: "Save wording" }).click();
  await expect(page.locator("[data-offer-text]")).toContainText("earlier foot appointment tomorrow morning", { timeout: 20_000 });
  await expect(page.locator("[data-access-settings]")).toContainText("Most offers per patient in 30 days", { timeout: 20_000 });
  await page.getByRole("button", { name: /Approve/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not sent by Aksh (shadow mode)" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "They accepted" }).click();
  await expect(page.getByText("Accepted is not booked.")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Booking shows in our schedule" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Booked and verified" })).toBeVisible({ timeout: 20_000 });

  // Weekly pilot review: this week shows the booking; last week (complete) can be signed off by the admin.
  const monday = new Date();
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const thisWeek = monday.toISOString().slice(0, 10);
  await page.goto(`/dashboard/access/review?org=${org.id}&week=${thisWeek}`);
  await expect(page.locator("[data-review-title]")).toContainText("Slot Clinic", { timeout: 20_000 });
  await expect(page.locator("[data-review-funnel]")).toContainText("Filled (booked and verified in time)1", { timeout: 20_000 });
  await expect(page.getByText("You can sign off once the week has ended.")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Previous week" }).click();
  await page.getByLabel("Review summary").fill("Rehearsal week: no slots yet.");
  await page.getByRole("button", { name: "Sign off this week" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Signed off" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-signoff]")).toContainText("Rehearsal week: no slots yet.", { timeout: 20_000 });
});
