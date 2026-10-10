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
  await expect(page.locator("[data-shadow-mode]")).toContainText("never sends messages");
  await page.locator("[data-slot-queue] button", { hasText: "foot check" }).first().click();
  await page.getByRole("button", { name: "Find patients for this slot" }).click();
  await expect(page.locator("[data-candidates]")).toContainText("Nadia Example");
  await expect(page.locator("[data-candidates]")).toContainText("Annual foot check due");
  await page.getByRole("button", { name: "Draft offer" }).click();
  await expect(page.locator("[data-offer-text]")).toContainText("Hello Nadia");
  await expect(page.locator("[data-offer-text]")).not.toContainText("foot check due");
  await page.getByRole("button", { name: /Approve/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "not sent shadow mode" })).toBeVisible();
  await page.getByRole("button", { name: "They accepted" }).click();
  await expect(page.getByText("Accepted is not booked.")).toBeVisible();
  await page.getByRole("button", { name: "Booking shows in our schedule" }).click();
  await expect(page.getByRole("status").filter({ hasText: "booked verified" })).toBeVisible();
});
