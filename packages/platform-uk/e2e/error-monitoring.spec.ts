import { expect, test } from "@playwright/test";

test("error monitoring: browser crash reports are accepted signed out, malformed ones rejected", async ({ request }) => {
  const ok = await request.post("/api/telemetry/error", { data: { name: "E2EProbe", message: "e2e probe error", route: "/e2e/probe" } });
  expect(ok.status()).toBe(204);
  const bad = await request.post("/api/telemetry/error", { data: { route: "/missing-message" } });
  expect(bad.status()).toBe(400);
});
