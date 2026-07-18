#!/usr/bin/env node
/**
 * Evidence pack generator — writes inspectable snapshots into docs/evidence-pack/generated/
 * (gitignored). Never invents PASS for partner-blocked integrations.
 *
 * Usage: npm run evidence:pack
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "docs/evidence-pack/generated");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(name, data) {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`wrote ${path.relative(root, file)}`);
  return file;
}

function writeMd(name, body) {
  const file = path.join(outDir, name);
  fs.writeFileSync(file, body.endsWith("\n") ? body : `${body}\n`, "utf8");
  console.log(`wrote ${path.relative(root, file)}`);
  return file;
}

function parseJsonFromStdout(stdout) {
  const jsonStart = stdout.indexOf("{");
  const jsonEnd = stdout.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    return JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
  }
  return null;
}

function loadLocalEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function deterministicEnv() {
  return {
    ...process.env,
    ENABLE_LLM_SYNTHESIS: "false",
    ENABLE_LLM_GUARDIAN: "false",
    ENABLE_LLM_ORACLE: "false",
    ENABLE_LLM_DR_ASSIST: "false"
  };
}

async function main() {
  ensureDir(outDir);
  loadLocalEnv();
  const generatedAt = new Date().toISOString();
  console.log(`Aksh Health evidence pack — ${generatedAt}`);
  console.log("Honesty rule: never fake-pass live EMIS / CIS2 / Mirth.\n");

  // --- 1. SHIELD export sample ---
  writeJson("shield-export-sample.json", {
    artifactType: "aksh-uk-shield-export-sample",
    generatedAt,
    syntheticOnly: true,
    appendOnly: true,
    note: "Sample shape of SHIELD audit export. Live list requires DATABASE_URL + authenticated GET /api/audit/shield.",
    sampleEvents: [
      {
        id: "sample-evt-001",
        timestamp: generatedAt,
        user: "clinician@example.nhs.uk",
        agent: "GUARDIAN",
        action: "SHIELD: GUARDIAN draft generated (deterministic/mock)",
        resource: "Mr James Patel (P002)",
        contentHash: "sha256:sample-not-a-real-hash",
        prevEventId: null
      },
      {
        id: "sample-evt-002",
        timestamp: generatedAt,
        user: "clinician@example.nhs.uk",
        agent: "SHIELD",
        action: "HITL Accept → FHIR stage (sim)",
        resource: "Bundle/clinical-proof-accept",
        contentHash: "sha256:sample-chain-hash",
        prevEventId: "sample-evt-001"
      }
    ],
    liveWriteBack: false,
    partnerBlocked: ["emis-live-writeback"]
  });

  // --- 2. Agent eval report ---
  const evalResult = spawnSync("npx", ["tsx", "scripts/eval-agents.ts"], {
    cwd: root,
    encoding: "utf8",
    env: deterministicEnv()
  });
  const evalReport =
    parseJsonFromStdout(evalResult.stdout || "") ??
    {
      kind: "aksh-agent-golden-eval",
      generatedAt,
      error: "Failed to parse eval stdout",
      stderr: (evalResult.stderr || "").slice(0, 2000),
      exitCode: evalResult.status
    };
  writeJson("agent-eval-report.json", evalReport);

  // --- 3. RBAC matrix snapshot ---
  const roleSmokePath = path.join(root, "docs/ROLE_SMOKE_MATRIX.md");
  const qaJsonPath = path.join(root, "docs/qa-traceability-matrix.json");
  const qaMatrix = fs.existsSync(qaJsonPath)
    ? JSON.parse(fs.readFileSync(qaJsonPath, "utf8"))
    : null;
  const rbacReqs = (qaMatrix?.requirements ?? []).filter((r) =>
    ["REQ-021", "REQ-022", "REQ-023"].includes(r.id)
  );
  writeJson("rbac-matrix-snapshot.json", {
    artifactType: "aksh-uk-rbac-matrix-snapshot",
    generatedAt,
    roles: [
      "gp",
      "nurse",
      "pharmacist",
      "practice-manager",
      "ics-lead",
      "hospital-executive",
      "patient",
      "researcher"
    ],
    publicAllowlist: ["/dashboard/gp", "/dashboard/ics", "/dashboard/hospital"],
    evidenceDocs: ["docs/ROLE_SMOKE_MATRIX.md", "e2e/clinical-proof-rbac.spec.ts"],
    roleSmokeDocPresent: fs.existsSync(roleSmokePath),
    traceability: rbacReqs,
    note: "Snapshot only — regenerate after RBAC/middleware changes."
  });

  // --- 4. /api/health snapshot ---
  const healthBase =
    process.env.EVIDENCE_HEALTH_URL?.trim() ||
    process.env.PLAYWRIGHT_BASE_URL?.trim() ||
    "http://127.0.0.1:3000";
  let healthLive = null;
  let healthProbeError = null;
  try {
    const res = await fetch(`${healthBase.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      healthLive = await res.json();
    } else {
      healthProbeError = `HTTP ${res.status}`;
    }
  } catch (error) {
    healthProbeError = String(error?.message ?? error);
  }
  writeJson("health-snapshot.json", {
    artifactType: "aksh-uk-health-snapshot",
    generatedAt,
    probedUrl: `${healthBase.replace(/\/$/, "")}/api/health`,
    live: healthLive,
    probeError: healthProbeError,
    contract: {
      status: ["ok", "degraded"],
      database: { configured: "boolean", connected: "boolean", mode: ["live", "mock", "unconfigured"] },
      neo4j: {
        configured: "boolean",
        connected: "boolean",
        mode: ["live", "mock", "unconfigured"],
        note: "Honest mock when Aura paused"
      }
    },
    note: healthLive
      ? "Live probe succeeded."
      : "Server not reachable — contract snapshot only. Start `npm run dev` or set EVIDENCE_HEALTH_URL."
  });

  // --- 5. FHIR validation summary ---
  const fhirRun = spawnSync("npx", ["tsx", "scripts/evidence-fhir-summary.ts"], {
    cwd: root,
    encoding: "utf8",
    env: deterministicEnv()
  });
  const fhirSummary =
    parseJsonFromStdout(fhirRun.stdout || "") ??
    {
      artifactType: "aksh-uk-fhir-validation-summary",
      generatedAt,
      error: "FHIR summary generation failed",
      stderr: (fhirRun.stderr || "").slice(0, 2000),
      exitCode: fhirRun.status
    };
  writeJson("fhir-validation-summary.json", fhirSummary);

  // --- 6. Clinical-proof gap summary ---
  writeJson("clinical-proof-gap-summary.json", {
    artifactType: "aksh-uk-clinical-proof-gap-summary",
    generatedAt,
    sprint: "C",
    completionLevels: {
      uiComplete: "met",
      functionallyComplete:
        "met (agents, HITL chain, multi-patient, orchestration, learning recorder, perf smoke SLOs, FHIR R4 CI)",
      integratedComplete:
        "partial (Neon real; Neo4j honest mock when Aura down; EMIS/Mirth/CIS2 not live; Medplum disabled by default)",
      productionReady: "not met"
    },
    passHighlights: [
      "Multi-patient golden paths (7 non-Patel + Patel dedicated)",
      "Agent orchestration (SYNTHESIS+GUARDIAN+ORACLE+DrASSIST)",
      "FHIR R4 Zod CI + HITL Accept→stage→sim",
      "Continuous-learning recorder (no auto-retrain)",
      "Perf smoke SLO contracts (soft)",
      "Hazard template linked to clinical-proof test IDs",
      "SHIELD append-only API contract",
      "Evidence pack generator"
    ],
    blockedPartner: [
      { id: "EMIS live write-back", status: "BLOCKED: partner" },
      { id: "SystmOne write-back", status: "BLOCKED: partner" },
      { id: "CIS2 / NHS login", status: "BLOCKED: partner" }
    ],
    gaps: [
      { id: "Mirth / HL7 v2", status: "GAP" },
      { id: "Pen test", status: "GAP" },
      { id: "Formal performance / load (beyond smoke)", status: "GAP" },
      { id: "Governed model release SOP (learning recorder exists)", status: "MANUAL" },
      { id: "HL7 Java FHIR Validator JAR in CI", status: "optional" }
    ],
    neo4j: {
      status: "see-health-snapshot",
      note: "clinical-proof-graph uses live|mock honestly"
    },
    liveEmisWriteBack: false,
    traceability: qaMatrix?.counts ?? null
  });

  // --- Manifest ---
  const files = fs
    .readdirSync(outDir)
    .filter((f) => !f.startsWith("."))
    .sort();
  writeMd(
    "MANIFEST.md",
    `# Generated evidence pack

Generated: ${generatedAt}

| File | Purpose |
| --- | --- |
| \`shield-export-sample.json\` | SHIELD audit export sample shape |
| \`agent-eval-report.json\` | Golden agent eval (\`npm run eval:agents\`) |
| \`rbac-matrix-snapshot.json\` | RBAC / role smoke snapshot |
| \`health-snapshot.json\` | \`/api/health\` probe or contract |
| \`fhir-validation-summary.json\` | Zod FHIR R4 validation of proof fixtures |
| \`clinical-proof-gap-summary.json\` | Honest gap register snapshot |

Regenerate: \`npm run evidence:pack\`

Files in this folder are **gitignored** (noisy / environment-specific). Commit the generator + README instructions, not the snapshots, unless a release explicitly pins them.
`
  );

  writeJson("_manifest.json", {
    artifactType: "aksh-uk-evidence-pack-manifest",
    generatedAt,
    files,
    liveEmisWriteBack: false
  });

  console.log(`\nEvidence pack complete → ${path.relative(root, outDir)} (${files.length} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
