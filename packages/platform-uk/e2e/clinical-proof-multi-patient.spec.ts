import { expect, test } from "@playwright/test";

import {
  MULTI_PATIENT_E2E_COHORT,
  assertPartnerBlocksHonest,
  type GoldenPathPatient,
} from "../lib/clinical-proof/golden-path-cohort";
import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Multi-patient golden paths — parameterized across diverse cohort profiles.
 * Agents + HITL invariants + EMIS blocked honestly. Not 7 copy-paste specs.
 */
test.describe("Clinical proof — multi-patient golden paths", () => {
  test("cohort declares partner blocks honestly for every golden-path patient", () => {
    expect(MULTI_PATIENT_E2E_COHORT.length).toBeGreaterThanOrEqual(5);
    expect(MULTI_PATIENT_E2E_COHORT.length).toBeLessThanOrEqual(10);
    for (const patient of MULTI_PATIENT_E2E_COHORT) {
      expect(() => assertPartnerBlocksHonest(patient)).not.toThrow();
      expect(patient.partnerBlocked).toContain("emis-live-writeback");
    }
  });

  for (const patient of MULTI_PATIENT_E2E_COHORT) {
    test(`${patient.id} (${patient.profiles[0]}) agents HITL-only + UI + EHR blocked`, async ({
      page,
      request,
      baseURL,
    }) => {
      await runGoldenPathPatient(page, request, baseURL!, patient);
    });
  }
});

async function runGoldenPathPatient(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
  baseURL: string,
  patient: GoldenPathPatient
) {
  await createOnboardedTestUser(request, baseURL, {
    role: "gp",
    label: `multi-${patient.id.toLowerCase()}`,
  });
  await applyApiCookiesToPage(page, request);

  // UI: patient visible on GP patients list
  await page.goto("/dashboard/gp/patients");
  await expect(page.getByText(new RegExp(patient.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).first()).toBeVisible({
    timeout: 20_000,
  });

  // GUARDIAN draft — HITL only
  const guardian = await request.post("/api/agents/guardian", {
    data: { patientId: patient.id, proposedDrug: patient.proposedDrug },
  });
  expect(guardian.ok()).toBeTruthy();
  const gBody = (await guardian.json()) as {
    ehrWrite?: boolean;
    hitlRequired?: boolean;
    draft?: { patientId?: string; overallStatus?: string };
  };
  expect(gBody.ehrWrite).toBe(false);
  expect(gBody.hitlRequired).toBe(true);
  expect(gBody.draft).toBeTruthy();
  expect(gBody.draft?.patientId).toBe(patient.id);

  // ORACLE draft — HITL only
  const oracle = await request.post("/api/agents/oracle", {
    data: { patientId: patient.id },
  });
  expect(oracle.ok()).toBeTruthy();
  const oBody = (await oracle.json()) as {
    ehrWrite?: boolean;
    hitlRequired?: boolean;
    draft?: { patientId?: string };
  };
  expect(oBody.ehrWrite).toBe(false);
  expect(oBody.hitlRequired).toBe(true);
  expect(oBody.draft?.patientId).toBe(patient.id);

  // SYNTHESIS draft — HITL only (shared patient label)
  const synthesis = await request.post("/api/agents/synthesis", {
    data: {
      transcript: patient.transcript,
      patientLabel: `${patient.name} (${patient.id})`,
    },
  });
  expect(synthesis.ok()).toBeTruthy();
  const sBody = (await synthesis.json()) as {
    ehrWrite?: boolean;
    hitlRequired?: boolean;
    draft?: unknown;
  };
  expect(sBody.ehrWrite).toBe(false);
  expect(sBody.hitlRequired).toBe(true);
  expect(sBody.draft).toBeTruthy();

  // SHIELD append when Postgres available — never fail the golden path if durable audit is down
  const shieldPost = await request.post("/api/audit/shield", {
    data: {
      action: "defer",
      label: `Clinical-proof golden path ${patient.id}`,
      detail: `profiles=${patient.profiles.join(",")}; partnerBlocked=emis`,
      agentLabel: "SHIELD",
      resourceRef: `${patient.name} (${patient.id})`,
      category: "system",
    },
  });
  if (shieldPost.status() === 503) {
    // Honest: durable SHIELD unavailable without DATABASE_URL
    const body = (await shieldPost.json()) as { durable?: boolean };
    expect(body.durable).toBe(false);
  } else {
    expect(shieldPost.ok()).toBeTruthy();
  }

  // Partner-blocked: live EMIS write-back never claimed
  const emis = await request.get("/api/integrations/emis-staging");
  const emisBody = (await emis.json()) as { liveWriteBack?: boolean };
  expect(emisBody.liveWriteBack).toBe(false);
}
