import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Week 9 "done when": a device feed pushes CGM readings (FHIR Observation) and the clinician's worklist puts the
 * patient with low glucose first; opening the row shows the full CGM view.
 */
// One base time for every batch, so the fortnight is exactly 14 days however long the uploads take.
const BASE = Date.now();
const observation = (mrn: string, minutesAgo: number, mmol: number) => ({
  resource: {
    resourceType: "Observation",
    status: "final",
    code: { coding: [{ system: "http://loinc.org", code: "14745-4", display: "Glucose [Moles/volume] in Body fluid" }] },
    valueQuantity: { value: mmol, unit: "mmol/L", code: "mmol/L" },
    effectiveDateTime: new Date(BASE - minutesAgo * 60_000).toISOString(),
    subject: { identifier: { value: mrn } },
  },
});

test("cgm monitoring: a device feed fills the worklist, most urgent first", async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const ctx = await browser.newContext();
  await createOnboardedTestUser(ctx.request, baseURL!, { role: "nurse", label: "monitor-nurse" });
  const org = await (await ctx.request.post("/api/orgs", { data: { name: `Feed Clinic ${stamp}`, kind: "diabetes_centre" } })).json();
  await ctx.request.patch(`/api/orgs/${org.id}`, { data: { locale: { timezone: "UTC" } } });
  await ctx.request.post(`/api/orgs/${org.id}/patients`, { data: { patients: [
    { recordRef: `LO-${stamp}`, givenName: "Lia", familyName: `Lows${stamp}`, dateOfBirth: "1985-05-05", diabetesType: "type_1" },
    { recordRef: `OK-${stamp}`, givenName: "Oto", familyName: `Steady${stamp}`, dateOfBirth: "1986-06-06", diabetesType: "type_1" },
  ] } });
  const key = (await (await ctx.request.post(`/api/orgs/${org.id}/connections`, { data: { name: "CGM aggregator" } })).json()).key as string;

  // The device feed: 14 days of 5-minute readings for each patient; Lia has frequent lows.
  const feed = await browser.newContext();
  for (const [mrn, pick] of [[`LO-${stamp}`, (i: number) => (i % 20 === 0 ? 2.7 : 7.5)], [`OK-${stamp}`, () => 6.8]] as const) {
    for (let start = 0; start < 14 * 288; start += 1000) {
      const entry = Array.from({ length: Math.min(1000, 14 * 288 - start) }, (_, j) => observation(mrn, (start + j + 1) * 5, pick(start + j)));
      const r = await feed.request.post("/api/connect/v1/observations", { headers: { Authorization: `Bearer ${key}` }, data: { resourceType: "Bundle", type: "collection", entry } });
      expect(r.ok()).toBeTruthy();
    }
  }

  const page = await ctx.newPage();
  await applyApiCookiesToPage(page, ctx.request);
  await page.addInitScript(() => window.localStorage.setItem("aksh_cookie_consent", "essential"));
  await page.goto("/dashboard/monitoring");
  await expect(page.getByRole("link", { name: "CGM monitoring" }).first()).toBeVisible({ timeout: 20_000 });
  const list = page.locator("[data-cgm-worklist] > li");
  await expect(list.first()).toContainText(`Lows${stamp}`, { timeout: 20_000 });
  await expect(list.first()).toContainText("Very low glucose");
  await expect(page.locator("[data-cgm-worklist]")).toContainText(`Steady${stamp}`);
  await expect(page.locator("[data-cgm-worklist] > li", { hasText: `Steady${stamp}` })).toContainText("On target");
  await expect(page.getByText("Aksh does not watch CGM data in real time")).toBeVisible();
  await list.first().getByRole("button").first().click();
  await expect(list.first().locator("[data-cgm-metrics]")).toBeVisible();
  await expect(list.first().getByRole("img", { name: /Ambulatory glucose profile/ })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "critical").map((v) => v.id)).toEqual([]);
  await feed.close();
  await ctx.close();
});
