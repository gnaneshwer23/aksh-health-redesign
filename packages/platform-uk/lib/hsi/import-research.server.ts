import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseHsiResearchBundle } from "./research-contract";

/** Offline release import only; no patient/API upload path. */
export function importHsiResearchArtifact(input: string, destination: string, allowLocalChanges = false) {
  if (statSync(input).size > 1_000_000) throw new Error("HSI research artifact exceeds size limit");
  const bundle = parseHsiResearchBundle(JSON.parse(readFileSync(input, "utf8")));
  if (bundle.producer.workingTree !== "clean" && !allowLocalChanges) throw new Error("Release import requires a clean producer revision");
  mkdirSync(dirname(destination), { recursive: true });
  const lock = `${destination}.lock`;
  let descriptor: number;
  try { descriptor = openSync(lock, "wx", 0o600); } catch { throw new Error("HSI snapshot is locked by another writer"); }
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    if (existsSync(destination)) {
      if (statSync(destination).size > 1_000_000) throw new Error("Existing HSI snapshot exceeds size limit");
      const current = parseHsiResearchBundle(JSON.parse(readFileSync(destination, "utf8")));
      const delta = Date.parse(bundle.generatedAt) - Date.parse(current.generatedAt);
      if (delta < 0 || (delta === 0 && JSON.stringify(bundle) !== JSON.stringify(current))) throw new Error("Stale or conflicting HSI snapshot");
      if (JSON.stringify(bundle) === JSON.stringify(current)) return { cards: bundle.cards.length, changed: false };
    }
    writeFileSync(temporary, `${JSON.stringify(bundle, null, 2)}\n`, { flag: "wx" });
    const file = openSync(temporary, "r");
    try { fsyncSync(file); } finally { closeSync(file); }
    renameSync(temporary, destination);
    return { cards: bundle.cards.length, changed: true };
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
    closeSync(descriptor);
    unlinkSync(lock);
  }
}
