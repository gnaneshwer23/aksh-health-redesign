import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const scopeKey = process.env.DEMO_EVIDENCE_SCOPE ?? "usr_demo_evidence_loop";
const timestamp = "03/05/2026, 12:30:00";
const signoffId = "benchmark-signoff-demo-evidence";
const readinessId = "readiness-demo-evidence";

async function readJson(fileName) {
  const raw = await readFile(path.join(dataDir, fileName), "utf8");
  return JSON.parse(raw);
}

async function writeJson(fileName, payload) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, fileName), JSON.stringify(payload, null, 2), "utf8");
}

function buildFeedbackState(userId) {
  return {
    userId,
    draft: {
      audience: "",
      sessionType: "",
      relatedCaseId: "",
      followUpOwner: "",
      dueDate: "",
      nextCheckpoint: "",
      overdueNote: "",
      readinessScore: "",
      strongestMoment: "",
      confusionPoint: "",
      objections: "",
      nextActions: "",
      savedAt: null
    },
    archive: []
  };
}

async function run() {
  const sharedCases = await readJson("review-cases.json");
  const benchmarkedCases = sharedCases.filter((item) => Boolean(item.expectedOutcome)).length;
  const signoff = {
    id: signoffId,
    userId: scopeKey,
    reviewerName: "Demo Evidence Reviewer",
    decision: "accepted_for_internal_evidence",
    followUpOwner: "",
    dueDate: "",
    notes: "Durable seeded sign-off for data-health and evidence-loop rehearsal.",
    signedAt: timestamp,
    generatedAt: timestamp,
    benchmarkedCases,
    passedCases: benchmarkedCases,
    failedCases: 0,
    openBenchmarkActions: 0,
    resolvedBenchmarkActions: 0
  };
  const readinessSnapshot = {
    id: readinessId,
    userId: scopeKey,
    savedAt: timestamp,
    artifactType: "aksh-uk-eu-evidence-readiness",
    generatedAt: timestamp,
    generatedBy: "Aksh Health UK/EU seeded demo evidence scope",
    syntheticOnly: true,
    gate: {
      status: "ready",
      label: "Ready for internal evidence",
      summary: "Benchmark, sign-off, data health, and operating queues are ready for internal evidence use.",
      blockers: [],
      followUps: [],
      checks: {
        benchmarkPassRate: 100,
        benchmarkFailed: 0,
        openBenchmarkActions: 0,
        stalledRemediationActions: 0,
        benchmarkSignoffStatus: "accepted_for_internal_evidence",
        dataHealthState: "clean_seed",
        buildGate: "npm run verify + npm run build passing"
      }
    },
    dataHealth: {
      seedCaseCount: sharedCases.length,
      presentSeedCount: sharedCases.length,
      missingSeedCount: 0,
      extraCaseCount: 0,
      openBenchmarkActions: 0,
      resolvedBenchmarkActions: 0,
      stalledRemediationActions: 0,
      openFeedbackItems: 0,
      benchmarkSignoffStatus: "accepted_for_internal_evidence",
      benchmarkSignedAt: timestamp,
      benchmarkSignedBy: "Demo Evidence Reviewer",
      state: "clean_seed"
    },
    benchmarkSummary: {
      total: benchmarkedCases,
      passed: benchmarkedCases,
      failed: 0,
      passRate: 100
    },
    actionSummary: {
      openBenchmarkActions: 0,
      highBenchmarkActions: 0,
      mediumBenchmarkActions: 0,
      lowBenchmarkActions: 0,
      resolvedBenchmarkActions: 0
    },
    signoff,
    blockers: [],
    followUps: []
  };

  await writeJson(`review-cases.${scopeKey}.json`, sharedCases);
  await writeJson(`feedback-state.${scopeKey}.json`, buildFeedbackState(scopeKey));
  await writeJson(`benchmark-signoffs.${scopeKey}.json`, {
    userId: scopeKey,
    draft: {
      reviewerName: signoff.reviewerName,
      decision: signoff.decision,
      followUpOwner: signoff.followUpOwner,
      dueDate: signoff.dueDate,
      notes: signoff.notes,
      signedAt: signoff.signedAt
    },
    archive: [signoff]
  });
  await writeJson(`readiness-history.${scopeKey}.json`, {
    userId: scopeKey,
    archive: [readinessSnapshot]
  });

  console.log(`Seeded durable demo evidence scope: ${scopeKey}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});