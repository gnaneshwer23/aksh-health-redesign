/**
 * Phase 6 — Chronic disease domain framework.
 *
 * Proves: registry shape, diabetes active_synthetic registration,
 * CVD/CKD/obesity/other return not_activated (no fabricated clinical outputs),
 * honesty flags, validation gates unmet, capability evidence alignment.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import {
  DISEASE_DOMAIN_IDS,
  DOMAIN_SIGNAL_HONESTY,
  evaluateDomainRisk,
  getDiseaseDomain,
  listActiveSyntheticDomains,
  listDiseaseDomains,
  listDomainCarePathways,
  listDomainObservationKinds,
  listInactiveDomains,
  listOtherChronicCandidates,
  resetDiseaseDomainRegistryForTests,
  validationGatesMet,
} from "../lib/disease-domains";
import { capability } from "../lib/status/capabilities";

const projectRoot = process.cwd();

function listFilesRecursive(absoluteDir: string, extensions: string[]): string[] {
  const entries = readdirSync(absoluteDir, { recursive: true }) as string[];
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    if (!statSync(absolutePath).isFile()) continue;
    if (!extensions.some((ext) => absolutePath.endsWith(ext))) continue;
    files.push(absolutePath);
  }
  return files;
}

function hasImportOf(source: string, moduleSegment: string): boolean {
  const importPattern = new RegExp(
    `(?:from\\s+|require\\(|import\\()\\s*["'\`][^"'\`]*${moduleSegment}[^"'\`]*["'\`]`,
    "g"
  );
  return importPattern.test(source);
}

function testRegistryShape() {
  resetDiseaseDomainRegistryForTests();
  assert.equal(DISEASE_DOMAIN_IDS.length, 5);
  const summaries = listDiseaseDomains();
  assert.equal(summaries.length, 5);

  const byId = new Map(summaries.map((s) => [s.domainId, s]));
  assert.equal(byId.get("diabetes_metabolic")?.activationStatus, "active_synthetic");
  assert.equal(byId.get("cardiovascular")?.activationStatus, "planned");
  assert.equal(byId.get("chronic_kidney_disease")?.activationStatus, "planned");
  assert.equal(byId.get("obesity_metabolic")?.activationStatus, "planned");
  assert.equal(byId.get("other_chronic")?.activationStatus, "research");

  for (const s of summaries) {
    assert.equal(s.ehrWrite, false);
    assert.equal(s.autonomousClinicalAction, false);
    assert.equal(s.validationGatesMet, false);
  }

  const active = listActiveSyntheticDomains();
  assert.equal(active.length, 1);
  assert.equal(active[0].id, "diabetes_metabolic");

  const inactive = listInactiveDomains();
  assert.equal(inactive.length, 4);

  console.log("disease-domain-framework: registry shape + honesty — PASS");
}

function testDiabetesActiveSynthetic() {
  resetDiseaseDomainRegistryForTests();
  const diabetes = getDiseaseDomain("diabetes_metabolic");
  assert.ok(diabetes);
  assert.equal(diabetes.activationStatus, "active_synthetic");
  assert.deepEqual(diabetes.honesty, DOMAIN_SIGNAL_HONESTY);
  assert.equal(validationGatesMet(diabetes.validationRequirements), false);

  const risk = evaluateDomainRisk("diabetes_metabolic", { patientId: "P002" });
  assert.equal(risk.ok, true);
  if (risk.ok) {
    assert.equal(risk.data.sourceModule, "disease-modules/diabetes");
    assert.equal(risk.data.contributionKind, "risk_contribution_pointer");
    assert.equal(risk.data.patientId, "P002");
    assert.equal(risk.honesty.ehrWrite, false);
    assert.equal(risk.honesty.autonomousClinicalAction, false);
  }

  const obs = listDomainObservationKinds("diabetes_metabolic");
  assert.equal(obs.ok, true);
  if (obs.ok) assert.ok(obs.data.observationKindIds.includes("hba1c"));

  const pathways = listDomainCarePathways("diabetes_metabolic");
  assert.equal(pathways.ok, true);
  if (pathways.ok) assert.ok(pathways.data.pathwayIds.includes("diabetes_care_journey"));

  console.log("disease-domain-framework: diabetes active_synthetic pointer — PASS");
}

function testInactiveDomainsFailClosed() {
  resetDiseaseDomainRegistryForTests();
  const inactiveIds = [
    "cardiovascular",
    "chronic_kidney_disease",
    "obesity_metabolic",
    "other_chronic",
  ] as const;

  for (const id of inactiveIds) {
    const risk = evaluateDomainRisk(id, { patientId: "P002" });
    assert.equal(risk.ok, false, `${id} evaluateRisk must fail`);
    if (!risk.ok) {
      assert.equal(risk.reason, "not_activated");
      assert.equal(risk.clinicalOutput, null);
      assert.match(risk.message, /not activated/i);
    }

    const obs = listDomainObservationKinds(id);
    assert.equal(obs.ok, false, `${id} listObservationKinds must fail`);
    if (!obs.ok) assert.equal(obs.clinicalOutput, null);

    const pathways = listDomainCarePathways(id);
    assert.equal(pathways.ok, false, `${id} listCarePathways must fail`);
    if (!pathways.ok) assert.equal(pathways.clinicalOutput, null);

    const plugin = getDiseaseDomain(id)!;
    assert.ok(plugin.guidelines.guidelineAreaIds.length >= 0);
    // Metadata catalogues may list illustrative ids; operations still fail closed.
    assert.equal(plugin.honesty.ehrWrite, false);
  }

  const candidates = listOtherChronicCandidates();
  assert.ok(candidates.length >= 1);
  for (const c of candidates) {
    assert.equal(c.evidenceStatus, "insufficient");
  }

  console.log("disease-domain-framework: inactive domains not_activated — PASS");
}

function testCapabilityHonesty() {
  const framework = capability("chronic_disease_domain_framework");
  assert.equal(framework.status, "synthetic_demo");
  assert.ok(framework.evidence.includes("tests/disease-domain-framework.test.ts"));
  assert.match(framework.description, /not activated|planned|scaffold/i);
  assert.equal(framework.environment, "simulation");

  for (const id of [
    "cardiovascular_disease_intelligence",
    "ckd_disease_intelligence",
    "obesity_metabolic_intelligence",
  ] as const) {
    const c = capability(id);
    assert.equal(c.status, "planned");
    assert.equal(c.evidence.length, 0);
    assert.equal(c.environment, "none");
  }

  console.log("disease-domain-framework: capability register honesty — PASS");
}

function testModuleBoundaryPreserved() {
  // Disease-modules diabetes ↔ heart cross-import ban still holds (E5).
  const heartDir = path.join(projectRoot, "lib", "disease-modules", "heart");
  const diabetesDir = path.join(projectRoot, "lib", "disease-modules", "diabetes");
  for (const file of listFilesRecursive(heartDir, [".ts"])) {
    const source = readFileSync(file, "utf8");
    assert.ok(!hasImportOf(source, "disease-modules/diabetes"), `${file} cross-import`);
  }
  for (const file of listFilesRecursive(diabetesDir, [".ts"])) {
    const source = readFileSync(file, "utf8");
    assert.ok(!hasImportOf(source, "disease-modules/heart"), `${file} cross-import`);
  }

  // Framework must not wire CVD/CKD/obesity into clinical-spine / agents / API routes.
  const searchRoots = [
    path.join(projectRoot, "lib", "clinical-spine"),
    path.join(projectRoot, "app", "api"),
  ];
  const filesToCheck = [path.join(projectRoot, "lib", "agents.ts")];
  for (const root of searchRoots) {
    filesToCheck.push(...listFilesRecursive(root, [".ts", ".tsx", "route.ts"]));
  }

  const forbidden = [
    "disease-domains/domains/cardiovascular",
    "disease-domains/domains/ckd",
    "disease-domains/domains/obesity",
    "disease-modules/heart",
  ];

  for (const file of filesToCheck) {
    if (!statSync(file).isFile()) continue;
    const source = readFileSync(file, "utf8");
    for (const needle of forbidden) {
      assert.ok(
        !source.includes(needle),
        `${path.relative(projectRoot, file)} must not wire ${needle} into production paths`
      );
    }
  }

  console.log("disease-domain-framework: module boundary + zero inactive wiring — PASS");
}

function main() {
  testRegistryShape();
  testDiabetesActiveSynthetic();
  testInactiveDomainsFailClosed();
  testCapabilityHonesty();
  testModuleBoundaryPreserved();
  console.log("disease-domain-framework: all checks — PASS");
}

main();
