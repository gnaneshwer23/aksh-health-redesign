import { expect, test } from "@playwright/test";

import { getSyntheticWorld } from "../lib/synthetic-world/generate";
import { applyApiCookiesToPage, createFreshTestUser, signInViaApi } from "./helpers/auth";

test.describe("Patient dashboard (self-serve)", () => {
  test("patient without a clinic invite gets Asha and own readings, never another patient's chart", async ({
    page,
    request,
    baseURL,
  }) => {
    const user = await createFreshTestUser(request, baseURL!, { role: "patient", label: "patient-unlinked" });
    const done = await request.post("/api/onboarding/complete", {
      data: { role: "patient", fullName: "Sam Unlinked", identity: { firstName: "Sam", market: "GB" } },
    });
    expect((await done.json()).patientBinding).toBe("none");
    await signInViaApi(request, baseURL!, user.email, user.password);
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/patient");

    await expect(page.getByText("Your account is not linked to a clinic yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Asha" })).toHaveAttribute("href", "/asha");
    await page.getByLabel("Reading value").fill("6.4");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("list", { name: "Recent readings" })).toContainText("6.4");
    await expect(page.getByText(/James Patel/)).toHaveCount(0);

    const record = await request.get("/api/me/record");
    expect(await record.json()).toEqual({ linked: false });
  });

  test("clinic invite code plus matching date of birth links the patient's own record", async ({
    page,
    request,
    baseURL,
  }) => {
    const p = getSyntheticWorld().patients[7]!;
    const user = await createFreshTestUser(request, baseURL!, { role: "patient", label: "patient-linked" });

    const wrongDob = await request.post("/api/onboarding/invite", {
      data: { inviteCode: `AKSH-${p.id}`, dateOfBirth: "1900-01-01" },
    });
    expect((await wrongDob.json()).status).toBe("rejected");

    const done = await request.post("/api/onboarding/complete", {
      data: {
        role: "patient",
        fullName: `${p.givenName} ${p.familyName}`,
        identity: { firstName: p.givenName, inviteCode: `AKSH-${p.id}`, dateOfBirth: p.dob, market: p.market },
      },
    });
    expect((await done.json()).patientBinding).toBe("linked");
    await signInViaApi(request, baseURL!, user.email, user.password);
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/patient");

    await expect(page.getByRole("heading", { name: `Hello, ${p.givenName}` })).toBeVisible();
    await expect(page.getByText("Latest HbA1c")).toBeVisible();
    await expect(page.getByText("My care team")).toBeVisible();
  });
});
