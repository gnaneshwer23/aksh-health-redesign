/**
 * Read-only diagnostic harness for the agent functionality audit.
 * Prints register inventory, aliases, and Phase-2 honesty.
 * Does NOT call LLMs, mutate DB, or change production behaviour.
 *
 * Usage (from packages/platform-uk):
 *   npx tsx scripts/agent-functionality-audit-diag.ts
 */
import { getAtlasCapabilityStatus, getPrismCapabilityStatus } from "../lib/agents/phase2-capability-status";
import { AGENTS, LOOP, PROHIBITED_FOR_ALL, REVIEW_ORDER } from "../lib/agents/register";

console.log("=== Aksh Health agent functionality audit diag (read-only) ===");
console.log(`agents: ${AGENTS.length}`);
console.log(`prohibited_for_all: ${PROHIBITED_FOR_ALL.length} patterns`);
console.log("");
console.log("id\tstatus\ttrigger\tmodelFlag\tlegacyIds\tpartOf");
for (const a of AGENTS) {
  console.log(
    [a.id, a.status, a.trigger, a.modelFlag ?? "null", a.legacyIds.join("|") || "-", a.partOf ?? "-"].join("\t")
  );
}
console.log("");
console.log("REVIEW_ORDER.normal:", REVIEW_ORDER.normal.join(" → "));
console.log("REVIEW_ORDER.urgent:", REVIEW_ORDER.urgent.join(" → "));
console.log("");
console.log(
  "LOOP steps:",
  LOOP.map((s) => `${s.step}:${s.actor}`).join(" | ")
);
console.log("");
console.log("PRISM honesty:", getPrismCapabilityStatus());
console.log("ATLAS honesty:", getAtlasCapabilityStatus());
console.log("");
console.log("Done. No mutations performed.");
