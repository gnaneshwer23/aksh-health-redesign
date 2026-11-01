/**
 * Milestone C3 — Lab / pharmacy product HITL loop.
 * Synthetic / controlled data only. Does not claim clinical validation.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";

import {
  LAB_PHARMACY_HITL_HONESTY,
  applyLabPharmacyReview,
  canReviewDraft,
  canStageDraft,
  filterQueue,
  labPharmacyHitlCapabilities,
  stageLabPharmacyDraft,
} from "../lib/lab-pharmacy-hitl";
import {
  listLabPharmacyDrafts,
  reviewAndPersistLabPharmacyDraft,
  stageAndPersistLabPharmacyDraft,
} from "../lib/repositories/lab-pharmacy-hitl-repository";

const root = path.join(__dirname, "..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-c/LAB_PHARMACY_HITL.md");
  assert.match(doc, /What C3 is/);
  assert.match(doc, /What C3 is not/);
  assert.match(doc, /Click-path by role/);
  assert.match(doc, /simulation/i);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /test:milestone-c/);
  assert.match(doc, /clinical validation/i);
  assert.match(doc, /live: false|live:false/i);
  assert.match(doc, /ehrWrite/);

  const c1 = read("docs/milestone-c/FACILITATOR_SESSION.md");
  assert.match(c1, /LAB_PHARMACY_HITL/);

  const c2 = read("docs/milestone-c/REVIEW_HONESTY.md");
  assert.match(c2, /LAB_PHARMACY_HITL/);

  const plan = read("docs/agents/HCP_AGENT_EVALUATION_PLAN.md");
  assert.match(plan, /Milestone C3/);
  assert.match(plan, /LAB_PHARMACY_HITL/);

  const protocol = read("docs/milestone-b/SESSION_PROTOCOL.md");
  assert.match(protocol, /LAB_PHARMACY_HITL/);

  // --- Surfaces / wiring ---
  const panel = read("components/dashboard/lab-pharmacy/LabPharmacyHitlPanel.tsx");
  const gpPage = read("app/dashboard/gp/lab-pharmacy/page.tsx");
  const labPage = read("app/dashboard/admin/lab-queue/page.tsx");
  const rxPage = read("app/dashboard/pharmacist/pharmacy-queue/page.tsx");
  const api = read("app/api/lab-pharmacy-hitl/route.ts");
  const reviewApi = read("app/api/lab-pharmacy-hitl/review/route.ts");
  const sidebar = read("components/dashboard/Sidebar.tsx");
  const hcpPanel = read("components/dashboard/hcp-eval/HcpFacilitatorSessionPanel.tsx");

  assert.match(panel, /data-testid="lab-pharmacy-hitl-panel"/);
  assert.match(panel, /data-testid="lab-pharmacy-hitl-honesty"/);
  assert.match(panel, /ReviewHonestyStrip/);
  assert.match(panel, /live: false/);
  assert.match(gpPage, /LabPharmacyHitlPanel/);
  assert.match(gpPage, /mode="stage"/);
  assert.match(labPage, /mode="lab-queue"/);
  assert.match(rxPage, /mode="pharmacy-queue"/);
  assert.match(api, /requireAppRole/);
  assert.match(api, /ehrWrite/);
  assert.match(reviewApi, /accept.*edit.*reject/i);
  assert.match(sidebar, /\/dashboard\/gp\/lab-pharmacy/);
  assert.match(sidebar, /\/dashboard\/admin\/lab-queue/);
  assert.match(sidebar, /\/dashboard\/pharmacist\/pharmacy-queue/);
  assert.match(hcpPanel, /hcp-session-link-lab-pharmacy/);
  assert.match(hcpPanel, /Lab \/ pharmacy HITL \(C3\)/);

  assert.doesNotMatch(panel, /productionRbacEnforced\s*[:=]\s*true/);
  assert.doesNotMatch(api, /productionRbacEnforced\s*[:=]\s*true/);

  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  assert.ok(pkg.scripts["test:milestone-c:lab-pharmacy"]);
  assert.match(pkg.scripts["test:milestone-c"], /test:milestone-c:lab-pharmacy/);

  // --- Pure workflow ---
  assert.equal(LAB_PHARMACY_HITL_HONESTY.live, false);
  assert.equal(LAB_PHARMACY_HITL_HONESTY.ehrWrite, false);
  assert.equal(LAB_PHARMACY_HITL_HONESTY.clinicalValidationClaim, false);

  const caps = labPharmacyHitlCapabilities();
  assert.equal(caps.live, false);
  assert.deepEqual([...caps.decisions], ["accept", "edit", "reject"]);

  assert.equal(canStageDraft("clinical_reviewer", "gp"), true);
  assert.equal(canStageDraft("operations_lead", null), true);
  assert.equal(canStageDraft("patient", null), false);
  assert.equal(canReviewDraft("lab", "operations_lead", null), true);
  assert.equal(canReviewDraft("pharmacy", "clinical_reviewer", "clinical-pharmacist"), true);

  const labDraft = stageLabPharmacyDraft({
    kind: "lab",
    syntheticPatientId: "hcp-synth-patel",
    items: ["HbA1c", "eGFR"],
    careEpisodeId: "ce-c3-test",
    scopeKey: "practice_practice-demo",
    actor: "gp@test.aksh",
    roleHint: "gp",
  });
  assert.equal(labDraft.status, "pending_review");
  assert.equal(labDraft.live, false);
  assert.equal(labDraft.ehrWrite, false);
  assert.ok(labDraft.serviceRequestDrafts?.length === 2);
  assert.equal(labDraft.serviceRequestDrafts![0]!.status, "draft");
  assert.equal(labDraft.careEpisodeId, "ce-c3-test");
  assert.ok(labDraft.auditTrail.some((a) => a.action === "stage"));

  assert.throws(() =>
    stageLabPharmacyDraft({
      kind: "lab",
      syntheticPatientId: "nhs-123",
      items: ["HbA1c"],
      scopeKey: "practice_practice-demo",
      actor: "gp@test",
    })
  );

  const accepted = applyLabPharmacyReview(labDraft, {
    decision: "accept",
    actor: "lab01@test.aksh",
    roleHint: "lab",
    note: "Investigations confirmed (sim)",
  });
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.reviewDecision, "accept");
  assert.ok(accepted.auditTrail.length >= 2);

  const pharmacyDraft = stageLabPharmacyDraft({
    kind: "pharmacy",
    syntheticPatientId: "hcp-synth-patel",
    items: ["Metformin adherence follow-up"],
    scopeKey: "practice_practice-demo",
    actor: "gp@test.aksh",
  });
  assert.equal(pharmacyDraft.serviceRequestDrafts, undefined);
  const edited = applyLabPharmacyReview(pharmacyDraft, {
    decision: "edit",
    actor: "pharm@test.aksh",
    editedContent: "Metformin adherence follow-up, SGLT2 barrier check",
  });
  assert.equal(edited.status, "edited");
  assert.ok(edited.items.includes("SGLT2 barrier check"));

  const rejected = applyLabPharmacyReview(
    stageLabPharmacyDraft({
      kind: "pharmacy",
      syntheticPatientId: "hcp-synth-patel",
      items: ["Allergy block review"],
      scopeKey: "practice_practice-demo",
      actor: "gp@test.aksh",
    }),
    { decision: "reject", actor: "pharm@test.aksh", note: "Duplicate" }
  );
  assert.equal(rejected.status, "rejected");

  assert.throws(() => applyLabPharmacyReview(accepted, { decision: "accept", actor: "x" }));

  const openOnly = filterQueue([labDraft, accepted], { status: "open" });
  assert.equal(openOnly.length, 1);
  assert.equal(openOnly[0]!.id, labDraft.id);

  // --- Persistence loop (temp cwd) ---
  const prevCwd = process.cwd();
  const tmp = mkdtempSync(path.join(tmpdir(), "lph-c3-"));
  try {
    process.chdir(tmp);
    const staged = await stageAndPersistLabPharmacyDraft(
      {
        kind: "lab",
        syntheticPatientId: "hcp-synth-patel",
        items: ["HbA1c"],
        careEpisodeId: "ce-persist",
        organisationId: "practice-demo",
        scopeKey: "practice_practice-demo",
        actor: "gp@persist.test",
      },
      { role: "clinical_reviewer", persona: "gp", practiceId: "practice-demo" }
    );
    assert.equal(staged.draft.status, "pending_review");
    assert.equal(staged.source, "file");

    const listed = await listLabPharmacyDrafts({
      scopeKey: "practice_practice-demo",
      kind: "lab",
      status: "open",
    });
    assert.ok(listed.drafts.some((d) => d.id === staged.draft.id));

    const openForCrossOrg = await stageAndPersistLabPharmacyDraft(
      {
        kind: "pharmacy",
        syntheticPatientId: "hcp-synth-patel",
        items: ["Adherence chase"],
        organisationId: "practice-demo",
        scopeKey: "practice_practice-demo",
        actor: "gp@persist.test",
      },
      { role: "clinical_reviewer", persona: "gp", practiceId: "practice-demo" }
    );

    // Tenant isolation: other org cannot review
    await assert.rejects(
      () =>
        reviewAndPersistLabPharmacyDraft(
          {
            draftId: openForCrossOrg.draft.id,
            decision: "reject",
            actor: "evil@other.org",
            scopeKey: "practice_practice-demo",
          },
          { role: "operations_lead", persona: null, practiceId: "other-practice" }
        ),
      /organisation boundary/
    );

    const reviewed = await reviewAndPersistLabPharmacyDraft(
      {
        draftId: staged.draft.id,
        decision: "accept",
        actor: "lab@persist.test",
        scopeKey: "practice_practice-demo",
        note: "Lab HITL accept (sim)",
      },
      { role: "operations_lead", persona: null, practiceId: "practice-demo" }
    );
    assert.equal(reviewed.draft.status, "accepted");
    assert.ok(reviewed.draft.auditTrail.some((a) => a.action === "accept"));
  } finally {
    process.chdir(prevCwd);
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log("milestone-c3-lab-pharmacy-hitl: multi-role stage→review loop + honesty — PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
