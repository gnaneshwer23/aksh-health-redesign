import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import provenance from "../lib/hsi/sharedTechnology.provenance.json";
import { sortReviewQueueItems } from "../lib/dashboard/sort-review-queue";
import type { ReviewQueueItem } from "../lib/mock-data/types";

assert.equal(createHash("sha256").update(readFileSync("lib/hsi/sharedTechnology.ts")).digest("hex"), provenance.sha256);
assert.equal(provenance.executable, true);
assert.equal(provenance.includesProductData, false);
const make = (id: string, priority: ReviewQueueItem["priority"], agentType: ReviewQueueItem["agentType"], createdAt: string): ReviewQueueItem => ({
  id, priority, agentType, createdAt, patientId: "synthetic-test", patientName: "Synthetic test fixture", patientNhsNumber: "",
  title: "Test queue item", content: "Workflow ordering fixture", confidenceScore: null, evidenceSources: [],
  status: "Pending", editedContent: null, rejectionReason: null, auditEventId: null,
});
const items = [make("normal", "Normal", "SYNTHESIS", "2026-11-03T12:00:00Z"), make("urgent", "Urgent", "SYNTHESIS", "2026-11-03T12:00:00Z"), make("guardian", "Urgent", "GUARDIAN", "2026-11-01T12:00:00Z")];
const snapshot = JSON.stringify(items);
const sorted = sortReviewQueueItems(items);
assert.deepEqual(sorted.map((i) => i.id), ["guardian", "urgent", "normal"]);
assert.equal(JSON.stringify(items), snapshot);
assert.equal(sorted[0], items[2]);
console.log("PASS: Aksh executes pinned HSI queue ordering without mutating or moving product records");
