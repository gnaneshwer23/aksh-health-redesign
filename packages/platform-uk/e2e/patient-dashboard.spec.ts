import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createFreshTestUser, createOnboardedTestUser, signInViaApi } from "./helpers/auth";

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

    // The view waits for the profile; allow for a cold dev-server compile.
    await expect(page.getByText("Your account is not linked to a clinic yet.")).toBeVisible({ timeout: 20_000 });
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
    test.setTimeout(90_000); // two sign-ups, an import and an invite before the page loads
    // A clinic admin creates the organisation, imports a patient and issues a single-use invite.
    await createOnboardedTestUser(request, baseURL!, { role: "practice-manager", label: "invite-admin" });
    const org = await (await request.post("/api/orgs", { data: { name: `E2E Clinic ${Date.now()}`, kind: "clinic", region: "Europe" } })).json();
    const imported = await (
      await request.post(`/api/orgs/${org.id}/patients`, {
        data: {
          patients: [
            {
              recordRef: `E2E-${Date.now()}`,
              givenName: "Mira",
              familyName: "Example",
              dateOfBirth: "1968-03-14",
              diabetesType: "type_2",
              observations: [{ kind: "hba1c", value: 62, unit: "mmol/mol", observedAt: "2026-09-20", source: "lab" }],
            },
          ],
        },
      })
    ).json();
    const patientId = imported.rows[0].id as string;
    const invite = await (await request.post(`/api/orgs/${org.id}/invites`, { data: { kind: "patient", patientId } })).json();
    expect(invite.code).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);

    // The patient signs up; a wrong date of birth is rejected, the right one links the record once.
    const user = await createFreshTestUser(request, baseURL!, { role: "patient", label: "patient-linked" });
    const wrongDob = await request.post("/api/onboarding/invite", { data: { inviteCode: invite.code, dateOfBirth: "1900-01-01" } });
    expect((await wrongDob.json()).status).toBe("rejected");
    const done = await request.post("/api/onboarding/complete", {
      data: { role: "patient", fullName: "Mira Example", identity: { firstName: "Mira", inviteCode: invite.code, dateOfBirth: "1968-03-14" } },
    });
    expect((await done.json()).patientBinding).toBe("linked");

    await signInViaApi(request, baseURL!, user.email, user.password);
    await applyApiCookiesToPage(page, request);
    await page.goto("/dashboard/patient");
    await expect(page.getByRole("heading", { name: "Hello, Mira" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Latest HbA1c")).toBeVisible();
    await expect(page.getByText("62 mmol/mol")).toBeVisible();

    // The invite cannot be reused by anyone else.
    await createFreshTestUser(request, baseURL!, { role: "patient", label: "patient-reuse" });
    const reuse = await request.post("/api/onboarding/invite", { data: { inviteCode: invite.code, dateOfBirth: "1968-03-14" } });
    expect((await reuse.json()).status).toBe("rejected");
  });
});
