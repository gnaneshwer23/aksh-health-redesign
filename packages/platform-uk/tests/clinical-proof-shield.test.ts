import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { SHIELD_AUDIT_EVENTS_SQL } from "../lib/db/schema-sql";

function run() {
  const shieldRoutePath = path.join(process.cwd(), "app/api/audit/shield/route.ts");
  const source = fs.readFileSync(shieldRoutePath, "utf8");

  assert.ok(source.includes("export async function GET"), "SHIELD API must support GET");
  assert.ok(source.includes("export async function POST"), "SHIELD API must support append via POST");
  assert.equal(/export async function PUT/.test(source), false, "SHIELD must not expose PUT");
  assert.equal(/export async function DELETE/.test(source), false, "SHIELD must not expose DELETE");
  assert.equal(/export async function PATCH/.test(source), false, "SHIELD must not expose PATCH");

  assert.ok(SHIELD_AUDIT_EVENTS_SQL.includes("content_hash"), "Append-only chain should store content_hash");
  assert.ok(SHIELD_AUDIT_EVENTS_SQL.includes("prev_event_id"), "Append-only chain should store prev_event_id");

  const repoPath = path.join(process.cwd(), "lib/repositories/shield-audit-repository.ts");
  const repo = fs.readFileSync(repoPath, "utf8");
  assert.ok(repo.includes("INSERT INTO aksh.shield_audit_events"), "Persist path is INSERT-only");
  assert.equal(/\bUPDATE\s+aksh\.shield_audit_events\b/i.test(repo), false);
  assert.equal(/\bDELETE\s+FROM\s+aksh\.shield_audit_events\b/i.test(repo), false);

  console.log("SHIELD append-only API/schema contract passed.");
}

void run();
