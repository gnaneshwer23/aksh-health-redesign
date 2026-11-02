import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import artifact from "../data/hsi/research-bundle.json";
import { importHsiResearchArtifact } from "../lib/hsi/import-research.server";

const directory = mkdtempSync(join(tmpdir(), "aksh-hsi-import-"));
try {
  const source = join(directory, "input.json");
  const destination = join(directory, "snapshot.json");
  const save = (value: unknown) => writeFileSync(source, JSON.stringify(value));
  save(artifact);
  assert.equal(importHsiResearchArtifact(source, destination).changed, true);
  const original = readFileSync(destination, "utf8");
  assert.equal(importHsiResearchArtifact(source, destination).changed, false);
  save({ ...artifact, generatedAt: "2000-01-01T00:00:00.000Z" });
  assert.throws(() => importHsiResearchArtifact(source, destination), /Stale/);
  save({ ...artifact, containsPhi: true });
  assert.throws(() => importHsiResearchArtifact(source, destination));
  save({ ...artifact, producer: { ...artifact.producer, workingTree: "includes_local_changes" } });
  assert.throws(() => importHsiResearchArtifact(source, destination), /clean producer/);
  save(artifact);
  writeFileSync(`${destination}.lock`, "owned by test");
  assert.throws(() => importHsiResearchArtifact(source, destination), /locked/);
  assert.equal(readFileSync(destination, "utf8"), original);
  assert.ok(!existsSync(`${destination}.${process.pid}.tmp`));
  console.log("PASS: release import, repeat import, stale/unsafe/dirty rejection, lock contention and snapshot preservation.");
} finally { rmSync(directory, { recursive: true, force: true }); }
