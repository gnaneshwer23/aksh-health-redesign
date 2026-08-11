/**
 * E5 (docs/PHASED_BUILD_PLAN_E.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-5): Heart module typed-stub
 * scaffold — zero wiring, zero flag.
 *
 * Covers:
 *  1. HEART_MODULE_IDS is a non-empty, deduplicated array.
 *  2. HEART_SIGNAL_HONESTY matches the literal shape (hitlRequired: true,
 *     ehrWrite: false, autoRetrain: false, physiologicalTwin: false).
 *  3. Source-text grep: no file under lib/disease-modules/heart/ imports
 *     from lib/disease-modules/diabetes/, and vice versa (module-boundary
 *     rule, restates Diabetes's own FR-DIAB-006).
 *  4. Source-text grep: the heart module is not imported anywhere under
 *     lib/clinical-spine/, lib/agents.ts, or any app/api/**\/route.ts —
 *     genuinely zero wiring, not just "wiring not yet tested".
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { HEART_MODULE_FEED_TARGET, HEART_MODULE_IDS, HEART_SIGNAL_HONESTY } from "../lib/disease-modules/heart/types";

const projectRoot = process.cwd();

function listFilesRecursive(absoluteDir: string, extensions: string[]): string[] {
  const entries = readdirSync(absoluteDir, { recursive: true }) as string[];
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    if (!statSync(absolutePath).isFile()) continue;
    if (!extensions.some((extension) => absolutePath.endsWith(extension))) continue;
    files.push(absolutePath);
  }

  return files;
}

function testModuleIdsShape() {
  assert.ok(Array.isArray(HEART_MODULE_IDS), "HEART_MODULE_IDS must be an array");
  assert.ok(HEART_MODULE_IDS.length > 0, "HEART_MODULE_IDS must be non-empty");

  const unique = new Set(HEART_MODULE_IDS);
  assert.equal(unique.size, HEART_MODULE_IDS.length, "HEART_MODULE_IDS must contain no duplicates");

  HEART_MODULE_IDS.forEach((id) => {
    assert.ok(HEART_MODULE_FEED_TARGET[id], `HEART_MODULE_FEED_TARGET must have an entry for ${id}`);
    assert.ok(
      ["HORIZON", "GUARDIAN", "coaching_surface"].includes(HEART_MODULE_FEED_TARGET[id]),
      `HEART_MODULE_FEED_TARGET[${id}] must be one of the existing platform surfaces, not a new agent/orchestrator path`
    );
  });

  console.log(`Heart module stub: HEART_MODULE_IDS is a non-empty, deduplicated array of ${HEART_MODULE_IDS.length} illustrative signal areas.`);
}

function testSignalHonestyShape() {
  assert.deepEqual(
    HEART_SIGNAL_HONESTY,
    {
      hitlRequired: true,
      ehrWrite: false,
      autoRetrain: false,
      physiologicalTwin: false
    },
    "HEART_SIGNAL_HONESTY must be byte-identical in shape to DIABETES_SIGNAL_HONESTY"
  );

  console.log("Heart module stub: HEART_SIGNAL_HONESTY matches the required literal shape (HITL required, no EHR write, no auto-retrain, no physiological twin).");
}

/**
 * Matches an actual `import`/`require`/dynamic-`import(` statement whose
 * module specifier contains the given disease-module segment — not a
 * prose/doc-comment mention of the same path (this file's own header
 * comment, and diabetes/types.ts's own header comment, both mention the
 * sibling module by path in prose, which must not be misread as an import).
 */
function hasImportOf(source: string, moduleSegment: string): boolean {
  const importPattern = new RegExp(
    `(?:from\\s+|require\\(|import\\()\\s*["'\`][^"'\`]*${moduleSegment}[^"'\`]*["'\`]`,
    "g"
  );
  return importPattern.test(source);
}

function testNoCrossImportsWithDiabetes() {
  const heartDir = path.join(projectRoot, "lib", "disease-modules", "heart");
  const diabetesDir = path.join(projectRoot, "lib", "disease-modules", "diabetes");

  const heartFiles = listFilesRecursive(heartDir, [".ts", ".tsx"]);
  const diabetesFiles = listFilesRecursive(diabetesDir, [".ts", ".tsx"]);

  assert.ok(heartFiles.length > 0, "lib/disease-modules/heart/ must contain at least one file");
  assert.ok(diabetesFiles.length > 0, "lib/disease-modules/diabetes/ must contain at least one file");

  for (const file of heartFiles) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !hasImportOf(source, "disease-modules/diabetes"),
      `${path.relative(projectRoot, file)} must not import from lib/disease-modules/diabetes/*`
    );
  }

  for (const file of diabetesFiles) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !hasImportOf(source, "disease-modules/heart"),
      `${path.relative(projectRoot, file)} must not import from lib/disease-modules/heart/*`
    );
  }

  console.log("Heart module stub: zero cross-imports between heart/ and diabetes/ module directories (grep-verified).");
}

function testZeroWiring() {
  const searchRoots: Array<{ absoluteDir: string; extensions: string[] }> = [
    { absoluteDir: path.join(projectRoot, "lib", "clinical-spine"), extensions: [".ts", ".tsx"] },
    { absoluteDir: path.join(projectRoot, "app", "api"), extensions: ["route.ts", "route.tsx"] }
  ];

  const filesToCheck: string[] = [path.join(projectRoot, "lib", "agents.ts")];

  for (const { absoluteDir, extensions } of searchRoots) {
    filesToCheck.push(...listFilesRecursive(absoluteDir, extensions));
  }

  for (const file of filesToCheck) {
    const source = readFileSync(file, "utf8");
    assert.ok(
      !/disease-modules\/heart/.test(source),
      `${path.relative(projectRoot, file)} must not reference lib/disease-modules/heart — E5 wires nothing into CONDUCTOR/HORIZON/GUARDIAN/agent-directory/API routes`
    );
  }

  console.log(
    `Heart module stub: zero wiring confirmed — no reference to lib/disease-modules/heart in lib/agents.ts, any lib/clinical-spine/*, or any app/api/**/route.ts (${filesToCheck.length} files checked).`
  );
}

function main() {
  testModuleIdsShape();
  testSignalHonestyShape();
  testNoCrossImportsWithDiabetes();
  testZeroWiring();
}

main();
