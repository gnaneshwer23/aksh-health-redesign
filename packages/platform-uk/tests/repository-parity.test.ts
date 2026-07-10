import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { reviewCases } from "../lib/mock-data";
import {
  createReviewCase,
  readReviewCaseById,
  readReviewCases,
  resetReviewCases,
  updateReviewCase,
  writeReviewCases
} from "../lib/review-case-repository";
import { buildDatabaseAdapterContract } from "../lib/system-contracts";
import type { ReviewCase } from "../lib/types";
import { createFrozenArtifact, normalizeReviewCaseForPersistence } from "../lib/workflow";

const requiredParityCheckIds = [
  "scoped_round_trip",
  "seed_rehydration",
  "create_assigns_owner_and_prepends",
  "read_enforces_optional_ownership",
  "update_persists_review_state",
  "update_blocks_wrong_owner",
  "reset_restores_seed_cases"
];

function getSeedCase(id: string) {
  const reviewCase = reviewCases.find((item) => item.id === id);
  assert.ok(reviewCase, `Expected seeded case ${id} to exist`);
  return structuredClone(reviewCase);
}

async function cleanupScope(scopeKey: string) {
  try {
    await unlink(path.join(process.cwd(), "data", `review-cases.${scopeKey}.json`));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function runJsonRepositoryParitySuite() {
  const scopeKey = `repository_parity_${Date.now()}`;
  const secondaryScopeKey = `${scopeKey}_secondary`;
  const ownerId = "repository-parity-owner";
  const otherUserId = "repository-parity-other";

  try {
    const firstCase = getSeedCase("case-001");
    firstCase.userId = ownerId;
    const secondCase = {
      ...getSeedCase("case-002"),
      id: "case-parity-secondary",
      patientLabel: "Secondary scoped parity patient"
    };
    secondCase.userId = ownerId;

    await writeReviewCases([firstCase], scopeKey);
    await writeReviewCases([secondCase], secondaryScopeKey);

    const primaryCases = await readReviewCases(scopeKey);
    const secondaryCases = await readReviewCases(secondaryScopeKey);
    assert.ok(primaryCases.some((item) => item.id === firstCase.id), "Primary scope should contain its written case");
    assert.ok(secondaryCases.some((item) => item.id === secondCase.id), "Secondary scope should contain its written case");
    assert.equal(
      primaryCases.some((item) => item.id === secondCase.id),
      false,
      "Primary scope should not include a non-seed case written only to a secondary scope"
    );

    const primaryScopedCase = await readReviewCaseById(firstCase.id, scopeKey, ownerId);
    const secondaryScopedCase = await readReviewCaseById(secondCase.id, secondaryScopeKey, ownerId);
    assert.equal(primaryScopedCase?.id, firstCase.id, "Read-by-id should return the primary scoped case");
    assert.equal(secondaryScopedCase?.id, secondCase.id, "Read-by-id should return the secondary scoped case");
    assert.equal(await readReviewCaseById(secondCase.id, scopeKey), null, "Read-by-id should not leak non-seed cases across scopes");

    assert.equal(
      primaryCases.length,
      reviewCases.length,
      "Reading an incomplete scoped store should rehydrate missing seed cases"
    );

    await assert.rejects(
      () => readReviewCaseById(firstCase.id, scopeKey, otherUserId),
      /Unauthorized/,
      "Read ownership checks should reject a different supplied user"
    );

    const createdCase: ReviewCase = {
      ...getSeedCase("case-003"),
      id: "case-parity-created",
      userId: "",
      patientLabel: "Synthetic parity patient",
      updatedAt: "2026-05-03 11:00"
    };
    const created = await createReviewCase(createdCase, scopeKey, ownerId);
    assert.equal(created.userId, ownerId, "Create should assign the supplied user owner");
    const afterCreate = await readReviewCases(scopeKey);
    assert.equal(afterCreate[0].id, created.id, "Create should prepend the new case to the scoped store");

    const updatedCase = normalizeReviewCaseForPersistence({
      ...created,
      status: "accepted",
      reviewSummary: {
        ...created.reviewSummary,
        lastDecision: "accept",
        lastDecisionAt: "2026-05-03 11:05",
        lastReviewer: "Repository Parity Reviewer",
        overrideReason: ""
      },
      humanGateDecisions: [
        {
          id: "red_flag_escalation",
          status: "not_applicable",
          decidedAt: "2026-05-03 11:04",
          decidedBy: "Repository Parity Reviewer"
        },
        {
          id: "referral_pathway",
          status: "not_applicable",
          decidedAt: "2026-05-03 11:04",
          decidedBy: "Repository Parity Reviewer"
        },
        {
          id: "medication_decision",
          status: "confirmed",
          decidedAt: "2026-05-03 11:04",
          decidedBy: "Repository Parity Reviewer"
        }
      ],
      frozenArtifact: createFrozenArtifact(
        {
          ...created,
          status: "accepted",
          reviewSummary: {
            ...created.reviewSummary,
            lastDecision: "accept",
            lastDecisionAt: "2026-05-03 11:05",
            lastReviewer: "Repository Parity Reviewer",
            overrideReason: ""
          },
          humanGateDecisions: [
            {
              id: "red_flag_escalation",
              status: "not_applicable",
              decidedAt: "2026-05-03 11:04",
              decidedBy: "Repository Parity Reviewer"
            },
            {
              id: "referral_pathway",
              status: "not_applicable",
              decidedAt: "2026-05-03 11:04",
              decidedBy: "Repository Parity Reviewer"
            },
            {
              id: "medication_decision",
              status: "confirmed",
              decidedAt: "2026-05-03 11:04",
              decidedBy: "Repository Parity Reviewer"
            }
          ]
        },
        {
          frozenAt: "2026-05-03 11:05",
          frozenBy: "Repository Parity Reviewer"
        }
      )
    });
    const persistedUpdate = await updateReviewCase(updatedCase, scopeKey, ownerId);
    assert.equal(persistedUpdate.status, "accepted", "Update should return the persisted review state");
    const reloadedUpdate = await readReviewCaseById(created.id, scopeKey, ownerId);
    assert.equal(reloadedUpdate?.status, "accepted", "Update should persist accepted status");
    assert.equal(
      reloadedUpdate?.reviewSummary?.lastReviewer,
      "Repository Parity Reviewer",
      "Update should persist reviewer metadata"
    );
    assert.equal(
      reloadedUpdate?.frozenArtifact?.frozenBy,
      "Repository Parity Reviewer",
      "Update should persist frozen evidence artifacts"
    );
    assert.equal(
      reloadedUpdate?.humanGateDecisions?.length,
      3,
      "Update should persist explicit human-gate decisions"
    );
    assert.equal(
      reloadedUpdate?.frozenArtifact?.humanGateDecisions?.length,
      3,
      "Update should preserve human-gate decisions inside frozen evidence artifacts"
    );

    await assert.rejects(
      () => updateReviewCase({ ...updatedCase, userId: ownerId }, scopeKey, otherUserId),
      /Unauthorized/,
      "Update ownership checks should reject a different supplied user"
    );

    const resetCases = await resetReviewCases(scopeKey);
    assert.equal(resetCases.length, reviewCases.length, "Reset should return all seed cases");
    const afterReset = await readReviewCases(scopeKey);
    assert.equal(afterReset.length, reviewCases.length, "Reset should restore deterministic seed count");
    assert.equal(
      afterReset.some((item) => item.id === created.id),
      false,
      "Reset should remove created scoped proof cases"
    );
  } finally {
    await cleanupScope(scopeKey);
    await cleanupScope(secondaryScopeKey);
  }
}

async function run() {
  const databaseContract = buildDatabaseAdapterContract();
  const parityIds = databaseContract.requiredParityChecks.map((item) => item.id);
  assert.deepEqual(
    parityIds,
    requiredParityCheckIds,
    "Database adapter contract should name every required repository parity check"
  );
  assert.equal(databaseContract.activeAdapter, "json_file_repository");
  assert.equal(databaseContract.productionDatabaseConfigured, false);

  await runJsonRepositoryParitySuite();
}

run()
  .then(() => {
    console.log("Repository parity checks passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
