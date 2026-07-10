import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const jsonMode = process.argv.includes("--json");

function scopeFromFile(name, prefix) {
  if (name === `${prefix}.json`) return "shared";
  const match = name.match(new RegExp(`^${prefix}\\.(.+)\\.json$`));
  return match?.[1] ?? null;
}

async function readJson(fileName, fallback) {
  try {
    const raw = await readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function summarizeReviewCases(cases, seedIds) {
  const presentSeedCount = cases.filter((item) => seedIds.has(item.id)).length;
  const extraCaseCount = cases.filter((item) => !seedIds.has(item.id)).length;
  const statusCounts = cases.reduce(
    (counts, item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
      return counts;
    },
    {}
  );
  const frozenArtifacts = cases.filter((item) => Boolean(item.frozenArtifact)).length;
  const lastDecisions = cases.filter((item) => Boolean(item.reviewSummary?.lastDecision)).length;
  const benchmarkActions = cases.flatMap((item) => item.benchmarkActionResolutions ?? []);
  const remediationActions = cases.flatMap((item) => item.remediationActionResolutions ?? []);

  return {
    totalCases: cases.length,
    presentSeedCount,
    missingSeedCount: Math.max(0, seedIds.size - presentSeedCount),
    extraCaseCount,
    statusCounts,
    frozenArtifacts,
    lastDecisions,
    benchmarkActions: {
      total: benchmarkActions.length,
      open: benchmarkActions.filter((item) => item.status !== "resolved").length,
      resolved: benchmarkActions.filter((item) => item.status === "resolved").length
    },
    remediationActions: {
      total: remediationActions.length,
      open: remediationActions.filter((item) => item.status !== "resolved").length,
      resolved: remediationActions.filter((item) => item.status === "resolved").length
    }
  };
}

function summarizeFeedback(state) {
  const archive = Array.isArray(state?.archive) ? state.archive : [];
  const open = archive.filter((item) => item.resolutionStatus !== "resolved");

  return {
    total: archive.length,
    open: open.length,
    resolved: archive.length - open.length,
    overdue: open.filter((item) => {
      if (!item.dueDate) return false;
      const dueDate = new Date(`${item.dueDate}T23:59:59`);
      return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();
    }).length
  };
}

function summarizeSignoff(state) {
  const archive = Array.isArray(state?.archive) ? state.archive : [];
  const latest = archive[0] ?? null;

  return {
    total: archive.length,
    latestDecision: latest?.decision ?? "unsigned",
    latestReviewer: latest?.reviewerName ?? null,
    latestSignedAt: latest?.signedAt ?? null
  };
}

function summarizeReadinessHistory(state) {
  const archive = Array.isArray(state?.archive) ? state.archive : [];
  const latest = archive[0] ?? null;

  return {
    total: archive.length,
    latestStatus: latest?.gate?.status ?? "no_snapshot",
    latestSavedAt: latest?.savedAt ?? null
  };
}

function classifyScope(review, feedback, signoff, readiness) {
  if (!review) return "no_review_store";
  if (review.missingSeedCount > 0) return "needs_review";
  if (
    review.extraCaseCount > 0 ||
    feedback.open > 0 ||
    feedback.total > 0 ||
    signoff.total > 0 ||
    readiness.total > 0 ||
    review.benchmarkActions.total > 0 ||
    review.remediationActions.total > 0
  ) {
    return "session_modified";
  }
  return "clean_seed";
}

function formatStatus(status) {
  if (status === "clean_seed") return "clean seed";
  if (status === "session_modified") return "session modified";
  if (status === "needs_review") return "needs review";
  return "no review store";
}

async function main() {
  const files = await readdir(dataDir);
  const reviewFiles = files.filter((name) => /^review-cases(?:\..+)?\.json$/.test(name)).sort();
  const feedbackFiles = files.filter((name) => /^feedback-state(?:\..+)?\.json$/.test(name)).sort();
  const signoffFiles = files.filter((name) => /^benchmark-signoffs(?:\..+)?\.json$/.test(name)).sort();
  const readinessFiles = files.filter((name) => /^readiness-history(?:\..+)?\.json$/.test(name)).sort();
  const sharedCases = await readJson("review-cases.json", []);
  const seedIds = new Set(Array.isArray(sharedCases) ? sharedCases.map((item) => item.id) : []);
  const scopes = new Set(["shared"]);

  for (const file of reviewFiles) scopes.add(scopeFromFile(file, "review-cases"));
  for (const file of feedbackFiles) scopes.add(scopeFromFile(file, "feedback-state"));
  for (const file of signoffFiles) scopes.add(scopeFromFile(file, "benchmark-signoffs"));
  for (const file of readinessFiles) scopes.add(scopeFromFile(file, "readiness-history"));
  scopes.delete(null);

  const summaries = [];

  for (const scope of [...scopes].sort((left, right) => (left === "shared" ? -1 : right === "shared" ? 1 : left.localeCompare(right)))) {
    const suffix = scope === "shared" ? "" : `.${scope}`;
    const cases = await readJson(`review-cases${suffix}.json`, null);
    const feedbackState = await readJson(`feedback-state${suffix}.json`, { archive: [] });
    const signoffState = await readJson(`benchmark-signoffs${suffix}.json`, { archive: [] });
    const readinessState = await readJson(`readiness-history${suffix}.json`, { archive: [] });
    const review = Array.isArray(cases) ? summarizeReviewCases(cases, seedIds) : null;
    const feedback = summarizeFeedback(feedbackState);
    const signoff = summarizeSignoff(signoffState);
    const readiness = summarizeReadinessHistory(readinessState);

    summaries.push({
      scope,
      state: classifyScope(review, feedback, signoff, readiness),
      review,
      feedback,
      signoff,
      readiness,
      files: {
        reviewCases: files.includes(`review-cases${suffix}.json`),
        feedbackState: files.includes(`feedback-state${suffix}.json`),
        benchmarkSignoffs: files.includes(`benchmark-signoffs${suffix}.json`),
        readinessHistory: files.includes(`readiness-history${suffix}.json`)
      }
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    syntheticOnly: true,
    dataDir,
    fileCounts: {
      reviewCases: reviewFiles.length,
      feedbackState: feedbackFiles.length,
      benchmarkSignoffs: signoffFiles.length,
      readinessHistory: readinessFiles.length
    },
    scopes: summaries,
    resetPolicy: {
      destructiveActionTaken: false,
      guidance: "This command is a read-only preview. Use app reset actions for the active demo cohort, and manually archive scoped JSON files only after confirming they are not needed."
    }
  };

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("Aksh Health UK/EU data health preview");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Data folder: ${dataDir}`);
  console.log("");
  console.log("Files");
  console.log(`- Review case stores: ${report.fileCounts.reviewCases}`);
  console.log(`- Feedback stores: ${report.fileCounts.feedbackState}`);
  console.log(`- Benchmark sign-off stores: ${report.fileCounts.benchmarkSignoffs}`);
  console.log(`- Readiness history stores: ${report.fileCounts.readinessHistory}`);
  console.log("");
  console.log("Scopes");

  for (const item of summaries) {
    const review = item.review;
    console.log(`- ${item.scope}: ${formatStatus(item.state)}`);
    if (review) {
      console.log(
        `  cases=${review.totalCases}, seeds=${review.presentSeedCount}/${seedIds.size}, extra=${review.extraCaseCount}, frozen=${review.frozenArtifacts}, decisions=${review.lastDecisions}`
      );
      console.log(
        `  statuses=${Object.entries(review.statusCounts)
          .map(([status, count]) => `${status}:${count}`)
          .join(", ")}`
      );
      console.log(
        `  benchmark_actions=open:${review.benchmarkActions.open}, resolved:${review.benchmarkActions.resolved}; remediation_actions=open:${review.remediationActions.open}, resolved:${review.remediationActions.resolved}`
      );
    }
    console.log(
      `  feedback=open:${item.feedback.open}, resolved:${item.feedback.resolved}, overdue:${item.feedback.overdue}; signoff=${item.signoff.latestDecision}; readiness=${item.readiness.latestStatus}`
    );
  }

  console.log("");
  console.log("Reset policy");
  console.log("- Read-only preview only; no files were changed.");
  console.log("- Use app reset actions for the active demo cohort.");
  console.log("- Manually archive/delete scoped files only after evidence history is no longer needed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
