import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const seedFile = path.join(dataDir, "seed", "review-cases.seed.json");
const scopeKey = process.env.AKSH_DATA_SCOPE ?? "shared";
const resetAuxiliary = process.argv.includes("--with-auxiliary");

function resolveReviewCasesFile(scope) {
  return scope === "shared"
    ? path.join(dataDir, "review-cases.json")
    : path.join(dataDir, `review-cases.${scope}.json`);
}

function resolveAuxiliaryFile(prefix, scope) {
  return scope === "shared" ? path.join(dataDir, `${prefix}.json`) : path.join(dataDir, `${prefix}.${scope}.json`);
}

async function writeJson(targetPath, payload) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(payload, null, 2), "utf8");
}

async function run() {
  const seedRaw = await readFile(seedFile, "utf8");
  const seedCases = JSON.parse(seedRaw);
  const reviewCasesPath = resolveReviewCasesFile(scopeKey);

  await writeJson(reviewCasesPath, seedCases);

  if (resetAuxiliary) {
    await writeJson(resolveAuxiliaryFile("feedback-state", scopeKey), {
      userId: scopeKey === "shared" ? "anonymous" : scopeKey,
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
    });
    await writeJson(resolveAuxiliaryFile("benchmark-signoffs", scopeKey), {
      userId: scopeKey === "shared" ? "anonymous" : scopeKey,
      draft: {
        reviewerName: "",
        decision: "accepted_for_internal_evidence",
        followUpOwner: "",
        dueDate: "",
        notes: "",
        signedAt: ""
      },
      archive: []
    });
    await writeJson(resolveAuxiliaryFile("readiness-history", scopeKey), {
      userId: scopeKey === "shared" ? "anonymous" : scopeKey,
      archive: []
    });
  }

  console.log(`Reset scope "${scopeKey}" to deterministic synthetic seed (${seedCases.length} case(s)).`);
  if (resetAuxiliary) {
    console.log("Cleared feedback, benchmark sign-off, and readiness history for the same scope.");
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
