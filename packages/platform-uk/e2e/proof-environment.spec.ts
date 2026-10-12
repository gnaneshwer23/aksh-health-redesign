import { expect, test } from "@playwright/test";

/** The clinical-proof environment (platform map G4). Runs only against a server built with AKSH_PROOF_ENVIRONMENT=true. */
test.skip(process.env.AKSH_PROOF_ENVIRONMENT !== "true", "proof environment not enabled for this run");

test("proof environment: labelled, synthetic only, never indexed", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/proof$/);
  await expect(page.locator("[data-proof-banner]")).toContainText("Every patient, clinic and result here is synthetic");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("synthetic patients");

  for (const path of ["/contact", "/get-started", "/pilot"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/proof$/);
  }

  const res = await request.get("/proof");
  expect(res.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s*$/m);

  // The synthetic estate and the Track B link are open here (they are closed in production).
  await page.goto("/demo/patel");
  await expect(page.locator("[data-proof-banner]")).toBeVisible();
  expect((await request.post("/api/network/patients/x/clinical-review")).status()).not.toBe(403);
});
