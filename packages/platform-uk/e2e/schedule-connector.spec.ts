import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Week 6 "done when": the clinic's scheduling system reports a freed slot and the resulting booking. Nobody types the
 * slot in, and the booking for the chosen patient closes the workflow on its own; the baseline panel reports it.
 */
async function expectNoCriticalA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
}

test("schedule connector: slots arrive from the schedule and a read-back booking closes the workflow", async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const ctx = await browser.newContext();
  await createOnboardedTestUser(ctx.request, baseURL!, { role: "practice-manager", label: "connector" });
  const org = await (await ctx.request.post("/api/orgs", { data: { name: `Hillside Clinic ${stamp}`, kind: "clinic" } })).json();
  const mrn = `HS-${stamp}`;
  const imported = await (await ctx.request.post(`/api/orgs/${org.id}/patients`, { data: { patients: [{ recordRef: mrn, givenName: "Mira", familyName: "Example", dateOfBirth: "1957-09-09" }] } })).json();
  await ctx.request.post(`/api/orgs/${org.id}/waitlist`, { data: { patientId: imported.rows[0].id, appointmentType: "foot_check", reason: "overdue_care", careGap: "Annual foot check due", contactChannel: "sms" } });

  // 1. The admin creates a connection and maps the schedule's code for foot checks.
  const page = await ctx.newPage();
  await applyApiCookiesToPage(page, ctx.request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/dashboard/organisation");
  await page.getByRole("tab", { name: "connections" }).click();
  await page.getByLabel("Connection name").fill("Front desk schedule");
  await page.getByRole("button", { name: "Create connection" }).click();
  const key = (await page.locator("[data-connection-key] p.font-mono").innerText()).trim();
  expect(key).toMatch(/^aksh_/);
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Add mapping" }).click();
  await page.getByLabel("Their code 1").fill("FC01");
  await page.getByLabel("Aksh type 1").selectOption("foot_check");
  await page.getByLabel("Connection site").fill("North wing");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Connection settings saved" })).toBeVisible();
  await expectNoCriticalA11y(page);

  // 2. The scheduling system reports a freed slot (FHIR R4), with a retry.
  const schedule = await browser.newContext();
  const auth = { Authorization: `Bearer ${key}` };
  const start = new Date(Date.now() + 30 * 3_600_000);
  const slotId = `slot-${stamp}`;
  const slot = { resourceType: "Slot", id: slotId, meta: { versionId: "1" }, status: "free", start: start.toISOString(), end: new Date(start.getTime() + 20 * 60_000).toISOString(), appointmentType: { coding: [{ code: "FC01" }] } };
  const sent = await (await schedule.request.post("/api/connect/v1/slots", { headers: auth, data: slot })).json();
  expect(sent.results[0].result).toBe("ACCEPTED");
  expect((await (await schedule.request.post("/api/connect/v1/slots", { headers: auth, data: slot })).json()).results[0].result).toBe("REPLAY");
  expect((await schedule.request.post("/api/connect/v1/slots", { headers: { Authorization: "Bearer aksh_not-a-key" }, data: slot })).status()).toBe(401);

  // 3. Staff work it: it is already in the queue.
  await page.goto("/dashboard/access");
  await expect(page.locator("[data-baseline]")).toContainText("Last 30 days (rehearsal", { timeout: 20_000 }); // loads after the queue
  await page.locator("[data-slot-queue] button", { hasText: "North wing" }).first().click();
  await page.getByRole("button", { name: "Find patients for this slot" }).click();
  await expect(page.locator("[data-candidates]")).toContainText("Mira Example");
  await page.getByRole("button", { name: "Draft offer" }).click();
  await page.getByRole("button", { name: /Approve/ }).click();
  await page.getByRole("button", { name: "They accepted" }).click();
  await expect(page.locator("[data-slot-detail]")).toContainText("Check schedule");

  // 4. The schedule shows the booking for Mira: the workflow closes as booked, with no staff click.
  const appointment = { resourceType: "Appointment", id: `appt-${stamp}`, status: "booked", slot: [{ reference: `Slot/${slotId}` }], participant: [{ actor: { reference: "Patient/1", identifier: { value: mrn } } }] };
  expect((await (await schedule.request.post("/api/connect/v1/appointments", { headers: auth, data: appointment })).json()).results[0].result).toBe("BOOKED_VERIFIED");
  await page.reload();
  await expect(page.locator("[data-baseline]")).toContainText("1 of 1 slots booked and verified");
  await expect(page.locator("[data-baseline]")).toContainText("1 of 1 bookings were confirmed by your schedule directly");
  await expectNoCriticalA11y(page);

  // 5. Every message is visible to the clinic.
  await page.goto("/dashboard/organisation");
  await page.getByRole("tab", { name: "connections" }).click();
  for (const code of ["ACCEPTED", "REPLAY", "BOOKED_VERIFIED"]) await expect(page.locator("[data-connection-events]")).toContainText(code);
  await schedule.close();
  await ctx.close();
});
