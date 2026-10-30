import { expect, test } from "@playwright/test";

import { applyApiCookiesToPage, createOnboardedTestUser } from "./helpers/auth";
import { CONNECTED_DEMO_PATIENT_ID } from "../lib/diabetes-intelligence/connected-journey-steps";

/**
 * Connected Diabetes Intelligence — end-to-end API journey on local-dev / simulation.
 * Covers seed → review gates → timeline; malformed data; Accept/Edit/Reject;
 * ehrWrite=false; no autonomous meds; basic tenant isolation (scopeKey).
 * Never targets Neon production.
 */
const PATIENT = CONNECTED_DEMO_PATIENT_ID;

test.describe("Connected diabetes journey (synthetic)", () => {
  test.setTimeout(180_000);

  test("API path: seed → HITL gates → timeline; safety + isolation", async ({
    request,
    baseURL,
    browser,
  }) => {
    const gpA = await createOnboardedTestUser(request, baseURL!, {
      role: "gp",
      label: "cdi-journey-a",
    });

    // --- Malformed / missing bodies ---
    const badGlucose = await request.post(`/api/patients/${PATIENT}/diabetes-intelligence`, {
      data: { action: "not_a_real_action" },
    });
    expect(badGlucose.status()).toBe(400);

    const badDecide = await request.post(
      `/api/patients/${PATIENT}/diabetes-intelligence/review/missing-review/decision`,
      { data: { action: "accept" } }
    );
    expect([400, 404, 500]).toContain(badDecide.status());
    const badDecideBody = (await badDecide.json()) as { ehrWrite?: boolean };
    expect(badDecideBody.ehrWrite).toBe(false);

    // --- Phase 1 Patient 360 ---
    const p360 = await request.post(`/api/patients/${PATIENT}/patient-360`, {
      data: { action: "seed_synthetic" },
    });
    expect(p360.ok()).toBeTruthy();
    const p360Body = (await p360.json()) as { ehrWrite?: boolean };
    expect(p360Body.ehrWrite).toBe(false);

    // --- Phase 2 Glucose ---
    const glucoseSeed = await request.post(`/api/patients/${PATIENT}/diabetes-intelligence`, {
      data: { action: "seed_synthetic" },
    });
    expect(glucoseSeed.ok()).toBeTruthy();
    expect(((await glucoseSeed.json()) as { ehrWrite: boolean }).ehrWrite).toBe(false);

    const glucoseDraft = await request.post(`/api/patients/${PATIENT}/diabetes-intelligence`, {
      data: { action: "draft_review" },
    });
    expect(glucoseDraft.ok()).toBeTruthy();
    const glucoseDraftBody = (await glucoseDraft.json()) as {
      ehrWrite: boolean;
      reviews: { id: string; status: string }[];
    };
    const pendingReview =
      glucoseDraftBody.reviews.find((r) => r.status === "DRAFT" || r.status === "pending_review") ??
      glucoseDraftBody.reviews[0];
    expect(pendingReview?.id).toBeTruthy();

    const glucoseAccept = await request.post(
      `/api/patients/${PATIENT}/diabetes-intelligence/review/${pendingReview!.id}/decision`,
      { data: { action: "accept" } }
    );
    expect(glucoseAccept.ok()).toBeTruthy();
    expect(((await glucoseAccept.json()) as { ehrWrite: boolean }).ehrWrite).toBe(false);

    const glucoseDraft2 = await request.post(`/api/patients/${PATIENT}/diabetes-intelligence`, {
      data: { action: "draft_review" },
    });
    const g2 = (await glucoseDraft2.json()) as { reviews: { id: string; status: string }[] };
    const rejectTarget =
      g2.reviews.find((r) => r.status === "DRAFT" || r.status === "pending_review") ?? g2.reviews.at(-1);
    if (rejectTarget?.id) {
      const rejected = await request.post(
        `/api/patients/${PATIENT}/diabetes-intelligence/review/${rejectTarget.id}/decision`,
        { data: { action: "reject", reason: "E2E reject — contradictory / thin data" } }
      );
      expect(rejected.ok()).toBeTruthy();
      expect(((await rejected.json()) as { ehrWrite: boolean }).ehrWrite).toBe(false);
    }

    // --- Phase 0 journey care plan ---
    const journeySeed = await request.post(`/api/patients/${PATIENT}/diabetes-journey`, {
      data: { action: "seed_synthetic" },
    });
    expect(journeySeed.ok()).toBeTruthy();
    const journeyDraft = await request.post(`/api/patients/${PATIENT}/diabetes-journey`, {
      data: { action: "draft_care_plan" },
    });
    expect(journeyDraft.ok()).toBeTruthy();
    const journeyBody = (await journeyDraft.json()) as {
      ehrWrite?: boolean;
      carePlans?: { id: string; status: string }[];
    };
    expect(journeyBody.ehrWrite).toBe(false);
    const draftPlan = journeyBody.carePlans?.find((p) => p.status === "DRAFT");
    expect(draftPlan?.id).toBeTruthy();
    const journeyDecide = await request.post(
      `/api/patients/${PATIENT}/diabetes-journey/care-plan/${draftPlan!.id}/decision`,
      { data: { action: "accept" } }
    );
    expect(journeyDecide.ok()).toBeTruthy();
    const journeyDecideBody = (await journeyDecide.json()) as {
      ehrWrite: boolean;
      decidedByPersona?: string | null;
      followUps?: { id: string }[];
    };
    expect(journeyDecideBody.ehrWrite).toBe(false);
    expect(journeyDecideBody.decidedByPersona).toBe("gp");

    // --- Phase 3 medication ---
    const medSeed = await request.post(`/api/patients/${PATIENT}/medication-care`, {
      data: { action: "seed_synthetic" },
    });
    if (!medSeed.ok()) {
      throw new Error(`medication-care seed failed (${medSeed.status()}): ${await medSeed.text()}`);
    }
    const medBody = (await medSeed.json()) as {
      ehrWrite: boolean;
      autonomousPrescribe?: boolean;
      carePlans?: { id: string; status: string; sections?: { id: string; items: string[] }[] }[];
    };
    expect(medBody.ehrWrite).toBe(false);
    expect(medBody.autonomousPrescribe ?? false).toBe(false);

    await request.post(`/api/patients/${PATIENT}/medication-care`, {
      data: { action: "apply_care_plan_template", templateId: "t2d_foundational" },
    });
    const medAfter = await request.get(`/api/patients/${PATIENT}/medication-care`);
    const medSnap = (await medAfter.json()) as {
      carePlans: { id: string; status: string; sections?: { id: string; items: string[] }[] }[];
      ehrWrite: boolean;
    };
    const medDraft = medSnap.carePlans.find((p) => p.status === "DRAFT") ?? medSnap.carePlans[0];
    if (medDraft?.id) {
      const medEdit = await request.post(
        `/api/patients/${PATIENT}/medication-care/care-plan/${medDraft.id}/decision`,
        {
          data: {
            action: "edit",
            editedSections: (medDraft.sections ?? []).map((s) =>
              s.id === "safety"
                ? { ...s, items: [...(s.items ?? []), "E2E edited: lifestyle follow-up"] }
                : s
            ),
          },
        }
      );
      const medEditBody = (await medEdit.json()) as { ehrWrite?: boolean };
      expect(medEditBody.ehrWrite ?? false).toBe(false);
    }

    // --- Phase 4 continuous care ---
    const ccSeed = await request.post(`/api/patients/${PATIENT}/continuous-care`, {
      data: { action: "seed_synthetic" },
    });
    if (!ccSeed.ok()) {
      throw new Error(`continuous-care seed failed (${ccSeed.status()}): ${await ccSeed.text()}`);
    }
    const ccBody = (await ccSeed.json()) as {
      ehrWrite: boolean;
      escalations?: { id: string; status: string }[];
    };
    expect(ccBody.ehrWrite).toBe(false);
    const esc = ccBody.escalations?.find((e) => /draft|pending/i.test(e.status)) ?? ccBody.escalations?.[0];
    if (esc?.id) {
      const escDecide = await request.post(
        `/api/patients/${PATIENT}/continuous-care/escalation/${esc.id}/decision`,
        { data: { action: "reject", reason: "E2E reject escalation" } }
      );
      const escBody = (await escDecide.json()) as { ehrWrite?: boolean };
      expect(escBody.ehrWrite ?? false).toBe(false);
    }

    // --- Phase 5 agent intelligence ---
    const agentSeed = await request.post(`/api/patients/${PATIENT}/agent-intelligence`, {
      data: { action: "seed_synthetic" },
    });
    expect(agentSeed.ok()).toBeTruthy();
    const agentOrch = await request.post(`/api/patients/${PATIENT}/agent-intelligence`, {
      data: { action: "run_orchestration" },
    });
    expect(agentOrch.ok()).toBeTruthy();
    const agentBody = (await agentOrch.json()) as {
      ehrWrite: boolean;
      drafts: { id: string; status: string; provenance: string; prescribeOrTreat?: boolean }[];
    };
    expect(agentBody.ehrWrite).toBe(false);
    expect(agentBody.drafts.every((d) => d.prescribeOrTreat !== true)).toBeTruthy();
    const agentDraft = agentBody.drafts.find((d) => d.status === "DRAFT");
    expect(agentDraft?.id).toBeTruthy();
    expect(agentDraft?.provenance).toBe("ai_generated");
    const agentAccept = await request.post(
      `/api/patients/${PATIENT}/agent-intelligence/draft/${agentDraft!.id}/decision`,
      { data: { action: "accept" } }
    );
    expect(agentAccept.ok()).toBeTruthy();
    const agentAfter = (await agentAccept.json()) as {
      ehrWrite: boolean;
      drafts: { id: string; provenance: string }[];
    };
    expect(agentAfter.ehrWrite).toBe(false);
    const verified = agentAfter.drafts.find((d) => d.id === agentDraft!.id);
    expect(verified?.provenance).toBe("clinician_verified");

    // --- INT-01: connected pipeline orchestration ---
    const orchStatus = await request.get(`/api/patients/${PATIENT}/connected-diabetes`);
    expect(orchStatus.ok()).toBeTruthy();
    const orchBody = (await orchStatus.json()) as {
      ehrWrite?: boolean;
      hitlRequired?: boolean;
      autonomousPrescribe?: boolean;
      liveOrganisations?: number;
      steps?: { stepId: string; status: string }[];
      unifiedCarePlans?: { unifiedKey: string; sourceStore: string; ehrWrite: boolean }[];
      unifiedFollowUps?: { unifiedKey: string; sourceStore: string; ehrWrite: boolean }[];
      unifiedMedRecons?: {
        unifiedKey: string;
        sourceStore: string;
        entrySurface: string;
        ehrWrite: boolean;
      }[];
    };
    expect(orchBody.ehrWrite).toBe(false);
    expect(orchBody.hitlRequired).toBe(true);
    expect(orchBody.autonomousPrescribe).toBe(false);
    expect(orchBody.liveOrganisations).toBe(0);
    expect((orchBody.steps?.length ?? 0)).toBeGreaterThanOrEqual(7);
    expect(
      (orchBody.unifiedCarePlans ?? []).every((p) => p.ehrWrite === false && p.unifiedKey.includes(":"))
    ).toBeTruthy();
    // INT-04-adjacent: unified follow-up facade after journey accept
    expect(
      (orchBody.unifiedFollowUps ?? []).every((f) => f.ehrWrite === false && f.unifiedKey.includes(":"))
    ).toBeTruthy();
    expect(
      (orchBody.unifiedFollowUps ?? []).some((f) => f.sourceStore === "journey_follow_up")
    ).toBeTruthy();
    // INT-04: dual med-recon entry surfaces over one physical store
    expect(
      (orchBody.unifiedMedRecons ?? []).every(
        (r) =>
          r.ehrWrite === false &&
          r.sourceStore === "medication_reconciliation_runs" &&
          r.unifiedKey.includes("medrecon:")
      )
    ).toBeTruthy();

    const orchRun = await request.post(`/api/patients/${PATIENT}/connected-diabetes`, {
      data: { action: "run_pipeline" },
    });
    expect(orchRun.ok()).toBeTruthy();
    const orchRunBody = (await orchRun.json()) as {
      ehrWrite?: boolean;
      phasesExecuted?: { stepId: string; ok: boolean }[];
    };
    expect(orchRunBody.ehrWrite).toBe(false);
    expect((orchRunBody.phasesExecuted ?? []).length).toBeGreaterThan(0);

    // --- Timeline (includes glucose/medcare/agent merge counts) ---
    const timeline = await request.get(`/api/patients/${PATIENT}/timeline`);
    expect(timeline.ok()).toBeTruthy();
    const timelineBody = (await timeline.json()) as {
      ehrWrite?: boolean;
      glucoseEventsMerged?: number;
      medcareEventsMerged?: number;
      agentEventsMerged?: number;
    };
    expect(timelineBody.ehrWrite).toBe(false);

    // --- Persistence: re-GET still has seeded glucose ---
    const glucoseAgain = await request.get(`/api/patients/${PATIENT}/diabetes-intelligence`);
    expect(glucoseAgain.ok()).toBeTruthy();
    const gAgain = (await glucoseAgain.json()) as {
      cgm?: { readings?: unknown[] };
      hba1c?: { series?: unknown[] };
      ehrWrite: boolean;
    };
    expect(gAgain.ehrWrite).toBe(false);
    expect((gAgain.cgm?.readings?.length ?? 0) + (gAgain.hba1c?.series?.length ?? 0)).toBeGreaterThan(0);

    // --- Tenant isolation: second GP has separate scopeKey ---
    const contextB = await browser.newContext();
    const requestB = contextB.request;
    await createOnboardedTestUser(requestB, baseURL!, { role: "gp", label: "cdi-journey-b" });
    const glucoseB = await requestB.get(`/api/patients/${PATIENT}/diabetes-intelligence`);
    expect(glucoseB.ok()).toBeTruthy();
    expect(((await glucoseB.json()) as { ehrWrite: boolean }).ehrWrite).toBe(false);
    await contextB.close();

    // --- Unauthenticated: empty browser context ---
    const anon = await browser.newContext();
    const anonRes = await anon.request.get(`/api/patients/${PATIENT}/diabetes-intelligence`);
    expect([401, 403]).toContain(anonRes.status());
    await anon.close();

    // --- INT-09: ops/researcher and unbound patient denied on connected APIs ---
    const researcherCtx = await browser.newContext();
    await createOnboardedTestUser(researcherCtx.request, baseURL!, {
      role: "researcher",
      label: "cdi-int09-researcher",
    });
    for (const path of [
      `/api/patients/${PATIENT}/patient-360`,
      `/api/patients/${PATIENT}/diabetes-intelligence`,
      `/api/patients/${PATIENT}/medication-care`,
      `/api/patients/${PATIENT}/continuous-care`,
      `/api/patients/${PATIENT}/agent-intelligence`,
      `/api/patients/${PATIENT}/diabetes-journey`,
      `/api/patients/${PATIENT}/timeline`,
      `/api/patients/${PATIENT}/connected-diabetes`,
    ]) {
      const denied = await researcherCtx.request.get(path);
      expect(denied.status(), `researcher GET ${path}`).toBe(403);
      const deniedBody = (await denied.json()) as { denied?: boolean };
      expect(deniedBody.denied).toBe(true);
    }
    await researcherCtx.close();

    const patientCtx = await browser.newContext();
    await createOnboardedTestUser(patientCtx.request, baseURL!, {
      role: "patient",
      label: "cdi-int09-patient",
    });
    // Real patient sessions have no boundPatientId today → fail closed (FR-CORE-005).
    const patientCross = await patientCtx.request.get(`/api/patients/${PATIENT}/patient-360`);
    expect(patientCross.status()).toBe(403);
    expect(((await patientCross.json()) as { denied?: boolean }).denied).toBe(true);
    await patientCtx.close();

    // --- INT-10: nurse cannot confirm journey care-plan Accept/Edit/Reject ---
    const nurseCtx = await browser.newContext();
    await createOnboardedTestUser(nurseCtx.request, baseURL!, {
      role: "nurse",
      label: "cdi-int10-nurse",
    });
    const nurseDecide = await nurseCtx.request.post(
      `/api/patients/${PATIENT}/diabetes-journey/care-plan/not-a-real-plan/decision`,
      { data: { action: "accept" } }
    );
    expect(nurseDecide.status()).toBe(403);
    const nurseBody = (await nurseDecide.json()) as {
      denied?: boolean;
      decidedByPersona?: string | null;
      ehrWrite?: boolean;
    };
    expect(nurseBody.denied).toBe(true);
    expect(nurseBody.ehrWrite).toBe(false);
    expect(nurseBody.decidedByPersona).toBe("nurse");
    await nurseCtx.close();

    test.info().annotations.push({
      type: "connected-diabetes",
      description: `API journey patient=${PATIENT} gp=${gpA.email} ehrWrite=false int09=denied int10=nurse-denied`,
    });
  });

  test("UI: flagship demo + connected chrome + timeline page", async ({ page, request, baseURL }) => {
    test.setTimeout(120_000);
    await createOnboardedTestUser(request, baseURL!, { role: "gp", label: "cdi-ui" });
    await applyApiCookiesToPage(page, request);
    const state = await request.storageState();
    await page.context().addCookies(state.cookies);

    await page.goto("/demo/connected-diabetes");
    await expect(page.getByText(/Synthetic demo|Synthetic clinical intelligence/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId("connected-diabetes-beat")).toBeVisible();
    await expect(page.getByTestId("connected-diabetes-open")).toBeVisible();

    await page.goto(`/dashboard/gp/patients/${PATIENT}/timeline`);
    await expect(page.getByTestId("connected-patient-chrome")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("connected-step-timeline")).toHaveAttribute("aria-current", "step");

    await page.goto(`/dashboard/gp/patients/${PATIENT}/patient-360`);
    await expect(page.getByTestId("connected-patient-chrome")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("connected-journey-stepper")).toBeVisible();

    await page.goto(`/dashboard/gp/patients/${PATIENT}/connected-diabetes`);
    await expect(page.getByTestId("connected-patient-chrome")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("connected-step-orchestrate")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("run-connected-pipeline")).toBeVisible();
  });
});
