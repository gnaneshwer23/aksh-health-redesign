/** Usage: npx tsx scripts/sync-hsi-research.ts /path/to/hsi-aksh-research.json */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { importHsiResearchArtifact } from "../lib/hsi/import-research.server";

const input = process.argv[2];
if (!input) throw new Error("Pass the public HSI research artifact path. Never pass a patient export.");
const destination = fileURLToPath(new URL("../data/hsi/research-bundle.json", import.meta.url));
const result = importHsiResearchArtifact(resolve(input), destination, process.argv.includes("--allow-local-changes"));
console.log(`Validated ${result.cards} HSI research cards; changed=${result.changed}; no patient records or database writes.`);
