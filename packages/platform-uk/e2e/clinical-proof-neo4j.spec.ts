import { expect, test } from "@playwright/test";

import { createOnboardedTestUser } from "./helpers/auth";

test.describe("Clinical proof — Neo4j data source honesty", () => {
  test("public ICS population stays synthetic demo", async ({ request }) => {
    const response = await request.get("/api/neo4j/ics-population");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["x-data-source"]).toBe("demo");
  });

  test("authenticated GP receives neo4j or honest mock on patient/guardian", async ({
    request,
    baseURL,
  }) => {
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "neo4j-smoke-gp" });

    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const body = (await health.json()) as {
      neo4j?: { mode?: string; connected?: boolean };
    };
    const live = body.neo4j?.mode === "live" && body.neo4j?.connected === true;

    const patient = await request.get("/api/neo4j/patient?id=P002");
    expect(patient.ok()).toBeTruthy();
    const patientSource = patient.headers()["x-data-source"];
    expect(["neo4j", "mock"]).toContain(patientSource);
    if (live) {
      expect(patientSource).toBe("neo4j");
    }

    const guardian = await request.get("/api/neo4j/guardian?patientId=P002");
    expect(guardian.ok()).toBeTruthy();
    const guardianSource = guardian.headers()["x-data-source"];
    expect(["neo4j", "mock"]).toContain(guardianSource);
    if (live) {
      expect(guardianSource).toBe("neo4j");
    }

    const ics = await request.get("/api/neo4j/ics-population");
    expect(ics.ok()).toBeTruthy();
    const icsSource = ics.headers()["x-data-source"];
    expect(["neo4j", "mock"]).toContain(icsSource);
    if (live) {
      expect(icsSource).toBe("neo4j");
    }
  });
});
