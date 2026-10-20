/**
 * Rule registry (P1-5): every registered rule has a source, version and sign-off state, and its threshold is still in
 * the code exactly as registered. A threshold changed in code without updating the registry fails here.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { LAB_RULE_VERSION, LAB_RULES } from "../lib/disease-modules/diabetes/complications";
import { RULES } from "../lib/rules/registry";
import { ORG_TARGETS } from "../lib/rules/targets";

const root = path.join(__dirname, "..");
const ids = RULES.map((r) => r.id);
assert.equal(new Set(ids).size, ids.length, "rule ids are unique");
for (const r of RULES) {
  for (const k of ["statement", "source", "sourceDetail", "version", "effectiveFrom"] as const) assert.ok(r[k].trim(), `${r.id}: ${k}`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.effectiveFrom), `${r.id}: effectiveFrom is a date`);
  assert.ok(r.usedBy.length, `${r.id}: says where it is used`);
  const file = path.join(root, r.codeRef.file);
  assert.ok(existsSync(file), `${r.id}: ${r.codeRef.file} exists`);
  assert.ok(readFileSync(file, "utf8").includes(r.codeRef.contains), `${r.id}: ${r.codeRef.file} still contains "${r.codeRef.contains}" — update the registry when a threshold changes`);
}
// Every laboratory rule carries the version the complication signals report.
for (const r of RULES.filter((x) => x.codeRef.file.endsWith("complications.ts"))) assert.equal(r.version, LAB_RULE_VERSION, `${r.id}: version matches LAB_RULE_VERSION`);
// Organisation targets and their rules point at each other.
for (const t of Object.values(ORG_TARGETS)) {
  const r = RULES.find((x) => x.id === t.ruleId);
  assert.ok(r, `${t.ruleId} (target ${t.key}) is registered`);
  assert.equal(r!.parameter, t.key);
  assert.ok(t.options.some((o) => o.value === t.defaultValue), `${t.key}: default is one of the options`);
}
for (const r of RULES.filter((x) => x.parameter)) assert.equal(ORG_TARGETS[r.parameter!].ruleId, r.id);
// Every rule the complication checks apply is registered.
for (const def of Object.values(LAB_RULES)) for (const r of def!.rules) assert.ok(ids.includes(r.ruleId), `${r.ruleId} is registered`);
// Clinical thresholds await sign-off; only data-quality and workflow rules are operational.
for (const r of RULES.filter((x) => x.signOff === "operational")) assert.ok(["data_quality", "access"].includes(r.area), `${r.id}: only non-clinical rules are operational`);
console.log(`rule-registry: ${RULES.length} rules with source, version and sign-off; every threshold still in the code — PASS`);
