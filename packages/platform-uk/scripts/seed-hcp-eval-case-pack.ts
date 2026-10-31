/**
 * Write synthetic HCP eval case-pack artifact under data/seed/.
 * No Neon / Neo4j / production patient data.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getHcpCasePackManifest } from "../lib/eval/hcp-case-pack";

async function main() {
  const root = path.join(process.cwd(), "data", "seed");
  await mkdir(root, { recursive: true });
  const manifest = getHcpCasePackManifest();
  const out = path.join(root, "hcp-eval-case-pack.json");
  await writeFile(out, JSON.stringify(manifest, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        written: out,
        version: manifest.version,
        caseCount: manifest.caseCount,
        syntheticOnly: true,
        clinicalValidationClaim: false,
        ehrWrite: false,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
