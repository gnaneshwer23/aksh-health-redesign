/**
 * CLI entry for golden-case agent eval (HITL-safe).
 * Prefer: npm run eval:agents
 */
import { runGoldenEval } from "../lib/eval/score-agents";

async function main() {
  const args = process.argv.slice(2);
  const agentArg = args.find((a) => a.startsWith("--agent="))?.slice("--agent=".length);
  const caseArg = args.find((a) => a.startsWith("--case="))?.slice("--case=".length);

  const report = await runGoldenEval({
    agent: agentArg ? (agentArg.toUpperCase() as "SYNTHESIS" | "GUARDIAN" | "ORACLE") : undefined,
    caseIds: caseArg ? [caseArg] : undefined
  });

  console.log(JSON.stringify(report, null, 2));
  console.log(
    `\nEval ${report.passedCount}/${report.caseCount} passed (passRate=${(report.passRate * 100).toFixed(0)}%). ehrWrite=false`
  );

  if (report.failedCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
