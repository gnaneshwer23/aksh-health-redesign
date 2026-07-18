import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";

/**
 * Multi-patient golden path stretch — 1–2 non-Patel cohort patients.
 * Proves agent + HITL-safe APIs beyond P002 without fake-passing EMIS.
 */
const COHORT_STRETCH = [
  {
    id: "P001",
    name: /Mrs Sarah Johnson/i,
    proposedDrug: "Apixaban",
  },
  {
    id: "P003",
    name: /Mrs Margaret Williams/i,
    proposedDrug: "Prednisolone",
  },
] as const;

test.describe("Clinical proof — multi-patient golden path stretch", () => {
  for (const patient of COHORT_STRETCH) {
    test(`${patient.id} agent drafts HITL-only + present on GP patients`, async ({
      page,
      request,
      baseURL,
    }) => {
      await createOnboardedTestUser(request, baseURL!, {
        role: "gp",
        label: `multi-${patient.id.toLowerCase()}`,
      });
      await applyApiCookiesToPage(page, request);

      await page.goto("/dashboard/gp/patients");
      await expect(page.getByText(patient.name).first()).toBeVisible({ timeout: 20_000 });

      const guardian = await request.post("/api/agents/guardian", {
        data: { patientId: patient.id, proposedDrug: patient.proposedDrug },
      });
      expect(guardian.ok()).toBeTruthy();
      const gBody = (await guardian.json()) as {
        ehrWrite?: boolean;
        hitlRequired?: boolean;
        draft?: unknown;
      };
      expect(gBody.ehrWrite).toBe(false);
      expect(gBody.hitlRequired).toBe(true);
      expect(gBody.draft).toBeTruthy();

      const oracle = await request.post("/api/agents/oracle", {
        data: { patientId: patient.id },
      });
      expect(oracle.ok()).toBeTruthy();
      const oBody = (await oracle.json()) as { ehrWrite?: boolean; hitlRequired?: boolean; draft?: unknown };
      expect(oBody.ehrWrite).toBe(false);
      expect(oBody.hitlRequired).toBe(true);
      expect(oBody.draft).toBeTruthy();

      const emis = await request.get("/api/integrations/emis-staging");
      const emisBody = (await emis.json()) as { liveWriteBack?: boolean };
      expect(emisBody.liveWriteBack).toBe(false);
    });
  }
});
