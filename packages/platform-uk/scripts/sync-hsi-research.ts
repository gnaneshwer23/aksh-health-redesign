/** Usage: npx tsx scripts/sync-hsi-research.ts /path/to/hsi-aksh-research.json */
import { readFileSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHsiResearchBundle } from "../lib/hsi/research-contract";

const input = process.argv[2];
if (!input) throw new Error("Pass the public HSI research artifact path. Never pass a patient export.");
const raw = readFileSync(resolve(input), "utf8");
if (Buffer.byteLength(raw) > 1_000_000) throw new Error("HSI research artifact exceeds size limit.");
const bundle = parseHsiResearchBundle(JSON.parse(raw));
const destination = fileURLToPath(new URL("../data/hsi/research-bundle.json", import.meta.url));
mkdirSync(dirname(destination), { recursive: true });
const temporary = `${destination}.${process.pid}.tmp`;
writeFileSync(temporary, `${JSON.stringify(bundle, null, 2)}\n`);
renameSync(temporary, destination);
console.log(`Imported ${bundle.cards.length} HSI research cards; no patient records or database writes.`);
