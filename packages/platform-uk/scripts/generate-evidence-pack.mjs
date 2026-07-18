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
      "Evidence pack generator",
      "Authenticated Neo4j smoke (throwaway GP or SMOKE_GP_*)"
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
      { id: "HL7 Java FHIR Validator JAR in CI", status: "optional" },
      { id: "CSO clinical safety sign-off", status: "MANUAL" }
    ],
    neo4j: {
      status: "see-health-snapshot",
      note: "clinical-proof-graph uses live|mock honestly; smoke:neo4j asserts X-Data-Source"
    },
    liveEmisWriteBack: false,
    traceability: qaMatrix?.counts ?? null
  });

  // --- 7. Gate checklist paths (templates committed; sign-off remains MANUAL) ---
  const gateChecklists = [
    {
      id: "gate-1-platform-readiness",
      path: "docs/evidence-pack/gate-1-platform-readiness.md",
      commandHints: ["npm run test:clinical-proof", "npm run smoke:neo4j", "npm run evidence:pack"]
    },
    {
      id: "gate-2-clinical-safety",
      path: "docs/evidence-pack/gate-2-clinical-safety.md",
      commandHints: ["npm run test:e2e:clinical-proof", "docs/HAZARD_LOG_TEMPLATE.md"]
    },
    {
      id: "gate-3-pilot-authority",
      path: "docs/evidence-pack/gate-3-pilot-authority.md",
      commandHints: ["Pilot authority / CSO sign-off — MANUAL"]
    }
  ].map((gate) => ({
    ...gate,
    present: fs.existsSync(path.join(root, gate.path))
  }));
  writeJson("gate-checklist-paths.json", {
    artifactType: "aksh-uk-gate-checklist-paths",
    generatedAt,
    checklists: gateChecklists,
    note: "Paths only — CSO/authority signatures are never invented by this generator."
  });

  // --- 8. Neo4j smoke snapshot (runs smoke:neo4j; never fake-pass live) ---
  const neo4jSmoke = spawnSync("node", ["scripts/smoke-neo4j-live.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...deterministicEnv(),
      SMOKE_BASE_URL: healthBase.replace(/\/$/, ""),
      EVIDENCE_HEALTH_URL: healthBase.replace(/\/$/, "")
    },
    timeout: 60_000
  });
  writeJson("neo4j-smoke-snapshot.json", {
    artifactType: "aksh-uk-neo4j-smoke-snapshot",
    generatedAt,
    command: "npm run smoke:neo4j",
    probedBaseUrl: healthBase.replace(/\/$/, ""),
    exitCode: neo4jSmoke.status,
    passed: neo4jSmoke.status === 0,
    stdout: (neo4jSmoke.stdout || "").slice(0, 4000),
    stderr: (neo4jSmoke.stderr || "").slice(0, 2000),
    optionalOverrides: ["SMOKE_GP_EMAIL", "SMOKE_GP_PASSWORD", "E2E_TEST_PASSWORD"],
    note:
      neo4jSmoke.status === 0
        ? "Smoke passed (public ICS demo + authenticated X-Data-Source checks)."
        : "Smoke failed or target unreachable — do not treat Neo4j as live without a passing run."
  });

  // --- 9. Precision Health scaffold snapshot (honesty flags; no invented live streams) ---
  const phSummary = spawnSync(
    "npx",
    ["tsx", "scripts/evidence-precision-health-summary.ts"],
    {
      cwd: root,
      encoding: "utf8",
      env: deterministicEnv(),
      timeout: 30_000
    }
  );
  const phSnapshot =
    parseJsonFromStdout(phSummary.stdout || "") ??
    {
      artifactType: "aksh-uk-precision-health-scaffold-snapshot",
      generatedAt,
      error: "Precision Health summary generation failed",
      stderr: (phSummary.stderr || "").slice(0, 2000),
      exitCode: phSummary.status,
      liveEmis: false,
      physiologicalTwin: false
    };
  writeJson("precision-health-scaffold-snapshot.json", phSnapshot);

  // --- 10. Clinical-proof suite pointer / optional run ---
  // Full suite is slow; default records command + last gap summary. Set EVIDENCE_RUN_CLINICAL_PROOF=true to execute.
  let clinicalProofSuite = {
    artifactType: "aksh-uk-clinical-proof-suite-snapshot",
    generatedAt,
    command: "npm run test:clinical-proof",
    executed: false,
    exitCode: null,
    passed: null,
    note:
      "Not executed in this pack run. Re-run with EVIDENCE_RUN_CLINICAL_PROOF=true or run `npm run test:clinical-proof` and attach stdout.",
    relatedArtifacts: ["clinical-proof-gap-summary.json", "fhir-validation-summary.json"]
  };
  if (process.env.EVIDENCE_RUN_CLINICAL_PROOF === "true") {
    const cp = spawnSync("npm", ["run", "test:clinical-proof"], {
      cwd: root,
      encoding: "utf8",
      env: deterministicEnv(),
      timeout: 600_000
    });
    clinicalProofSuite = {
      ...clinicalProofSuite,
      executed: true,
      exitCode: cp.status,
      passed: cp.status === 0,
      note:
        cp.status === 0
          ? "Clinical-proof suite green in this pack run."
          : "Clinical-proof suite failed — do not treat Gate 1 as PASS without a green run.",
      stdoutTail: (cp.stdout || "").slice(-3000),
      stderrTail: (cp.stderr || "").slice(-2000)
    };
  }
  writeJson("clinical-proof-suite-snapshot.json", clinicalProofSuite);

  // --- 11. Gate checklist progress (UNSIGNED — never invent CSO signatures) ---
  const healthOk = Boolean(healthLive) && healthLive?.status !== "degraded";
  const agentEvalOk =
    evalReport &&
    typeof evalReport === "object" &&
    !evalReport.error &&
    (evalReport.failed === 0 || evalReport.pass === true || evalReport.passed === true);
  const neo4jOk = neo4jSmoke.status === 0;
  const fhirOk = fhirSummary && !fhirSummary.error;
  const liveEmisHonest =
    phSnapshot &&
    phSnapshot.liveEmis === false &&
    phSnapshot.physiologicalTwin === false;

  function gateItem(id, label, autoStatus, evidence, note) {
    return {
      id,
      label,
      autoStatus, // PASS_EVIDENCE | FAIL_EVIDENCE | GAP | BLOCKED_PARTNER | MANUAL_UNSIGNED
      signed: false,
      evidence,
      note
    };
  }

  const gate1Items = [
    gateItem(
      "G1-01",
      "Clinical-proof suite green",
      clinicalProofSuite.executed
        ? clinicalProofSuite.passed
          ? "PASS_EVIDENCE"
          : "FAIL_EVIDENCE"
        : "MANUAL_UNSIGNED",
      ["clinical-proof-suite-snapshot.json", "clinical-proof-gap-summary.json"],
      clinicalProofSuite.executed
        ? clinicalProofSuite.note
        : "Run `npm run test:clinical-proof` (or EVIDENCE_RUN_CLINICAL_PROOF=true) — unsigned eng check."
    ),
    gateItem(
      "G1-04",
      "Neo4j honesty",
      neo4jOk ? "PASS_EVIDENCE" : "FAIL_EVIDENCE",
      ["neo4j-smoke-snapshot.json", "health-snapshot.json"],
      neo4jOk ? "smoke:neo4j passed" : "Neo4j smoke failed or unreachable"
    ),
    gateItem(
      "G1-06",
      "EMIS not live",
      liveEmisHonest ? "PASS_EVIDENCE" : "FAIL_EVIDENCE",
      ["precision-health-scaffold-snapshot.json", "clinical-proof-gap-summary.json"],
      "liveEmis:false enforced in scaffold snapshot — not a Partner write-back PASS"
    ),
    gateItem(
      "G1-09",
      "Evidence pack generated",
      "PASS_EVIDENCE",
      ["_manifest.json", "MANIFEST.md"],
      "This generator run produced the pack — unsigned"
    ),
    gateItem(
      "G1-health",
      "/api/health probe",
      healthLive ? (healthOk ? "PASS_EVIDENCE" : "FAIL_EVIDENCE") : "GAP",
      ["health-snapshot.json"],
      healthLive ? "Live health probe present" : "Server not reachable during pack generation"
    ),
    gateItem(
      "G1-eval",
      "Agent eval harness",
      agentEvalOk ? "PASS_EVIDENCE" : "FAIL_EVIDENCE",
      ["agent-eval-report.json"],
      agentEvalOk ? "Eval report parsed without error" : "Eval failed or unparsable"
    ),
    gateItem(
      "G1-fhir",
      "FHIR validation summary",
      fhirOk ? "PASS_EVIDENCE" : "FAIL_EVIDENCE",
      ["fhir-validation-summary.json"],
      fhirOk ? "Zod FHIR summary ok" : "FHIR summary missing"
    )
  ];

  const gate2Items = [
    gateItem(
      "G2-01",
      "Clinical safety HITL e2e",
      "MANUAL_UNSIGNED",
      ["docs/evidence-pack/gate-2-clinical-safety.md"],
      "Requires `npm run test:e2e:clinical-proof` + CSO review — never auto-signed"
    ),
    gateItem(
      "G2-hazard",
      "Hazard log linkage",
      "MANUAL_UNSIGNED",
      ["docs/HAZARD_LOG_TEMPLATE.md"],
      "Template present in repo; signatures are MANUAL"
    )
  ];

  const gate3Items = [
    gateItem(
      "G3-01",
      "Pilot authority / CSO",
      "MANUAL_UNSIGNED",
      ["docs/evidence-pack/gate-3-pilot-authority.md"],
      "Authority signatures are never invented by this generator"
    ),
    gateItem(
      "G3-partner",
      "Partner EMR / CIS2 / Mirth",
      "BLOCKED_PARTNER",
      ["clinical-proof-gap-summary.json", "precision-health-scaffold-snapshot.json"],
      "liveEmis:false · Partner credentials external"
    )
  ];

  const allGateItems = [...gate1Items, ...gate2Items, ...gate3Items];
  const progressCounts = allGateItems.reduce(
    (acc, item) => {
      acc[item.autoStatus] = (acc[item.autoStatus] || 0) + 1;
      return acc;
    },
    {}
  );

  writeJson("gate-checklist-progress.json", {
    artifactType: "aksh-uk-gate-checklist-progress",
    generatedAt,
    signed: false,
    signaturesInvented: false,
    liveEmisWriteBack: false,
    physiologicalTwin: false,
    counts: progressCounts,
    gates: [
      { id: "gate-1-platform-readiness", items: gate1Items },
      { id: "gate-2-clinical-safety", items: gate2Items },
      { id: "gate-3-pilot-authority", items: gate3Items }
    ],
    note:
      "Auto-status is engineering evidence only. CSO / authority Pass? columns remain UNSIGNED until human sign-off."
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
| \`clinical-proof-suite-snapshot.json\` | Clinical-proof suite pointer / optional run |
| \`gate-checklist-paths.json\` | Gate 1–3 checklist template paths |
| \`gate-checklist-progress.json\` | Auto progress (UNSIGNED — no invented signatures) |
| \`neo4j-smoke-snapshot.json\` | Output of \`npm run smoke:neo4j\` |
| \`precision-health-scaffold-snapshot.json\` | PH connectors / twin / EMIS honesty flags |

Regenerate: \`npm run evidence:pack\`

Optional: \`EVIDENCE_RUN_CLINICAL_PROOF=true npm run evidence:pack\` to execute the full clinical-proof suite into the pack.

Files in this folder are **gitignored** (noisy / environment-specific). Commit the generator + README instructions, not the snapshots, unless a release explicitly pins them.
`
  );

  writeJson("_manifest.json", {
    artifactType: "aksh-uk-evidence-pack-manifest",
    generatedAt,
    files,
    liveEmisWriteBack: false,
    signaturesInvented: false
  });

  console.log(`\nEvidence pack complete → ${path.relative(root, outDir)} (${files.length} files)`);
  console.log(
    `Gate progress (unsigned): ${JSON.stringify(progressCounts)} — signaturesInvented:false`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
