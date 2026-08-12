/**
 * Generate Part-52 Master Journey trace report.
 *
 * Usage:
 *   npm run report:master
 *   npm run report:master -- --skip-durable
 */

import {
  renderMasterJourneyMarkdown,
  runMasterJourney,
} from "../lib/e2e/master-journey";

function parseArgs(argv: string[]) {
  return {
    skipDurable: argv.includes("--skip-durable"),
    correlationId: argv.find((a) => a.startsWith("--correlation="))?.split("=")[1],
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const result = await runMasterJourney({
    seed: 20260812,
    skipDurableWrites: args.skipDurable,
    correlationId: args.correlationId,
    writeArtifacts: true,
  });

  const md = renderMasterJourneyMarkdown(result);
  console.log(md.split("\n").slice(0, 40).join("\n"));
  console.log(`\n… (${result.steps.length} steps) overall=${result.overall}`);
  console.log(`Artifacts under docs/reports/E2E_MASTER_JOURNEY_*.{md,json}`);
  console.log(`correlationId=${result.correlationId}`);

  if (result.overall !== "PASS") {
    process.exit(1);
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
