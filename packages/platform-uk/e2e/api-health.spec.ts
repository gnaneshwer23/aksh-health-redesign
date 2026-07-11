import { expect, test } from "@playwright/test";

import { DEMO_GP, signInViaApi } from "./helpers/auth";

test.describe("API health", () => {
  test("neo4j health and profile endpoints return expected shapes", async ({ request, baseURL }) => {
    const unauthHealth = await request.get("/api/neo4j/health");
    expect(unauthHealth.status()).toBe(401);

    const unauthProfile = await request.get("/api/profile");
    expect(unauthProfile.status()).toBe(401);

    await signInViaApi(request, baseURL!, DEMO_GP.email, DEMO_GP.password);

    const healthResponse = await request.get("/api/neo4j/health");
    expect(healthResponse.ok()).toBeTruthy();
    const healthBody = (await healthResponse.json()) as { connected: boolean; mode: string };
    expect(typeof healthBody.connected).toBe("boolean");
    expect(["live", "mock"]).toContain(healthBody.mode);

    const profileResponse = await request.get("/api/profile");
    expect(profileResponse.ok()).toBeTruthy();
    const profileBody = (await profileResponse.json()) as {
      userId: string;
      role: string;
      onboardingComplete: boolean;
      source: string;
    };
    expect(profileBody.userId).toBeTruthy();
    expect(profileBody.role).toBe("gp");
    expect(typeof profileBody.onboardingComplete).toBe("boolean");
    expect(["database", "session"]).toContain(profileBody.source);
  });
});
