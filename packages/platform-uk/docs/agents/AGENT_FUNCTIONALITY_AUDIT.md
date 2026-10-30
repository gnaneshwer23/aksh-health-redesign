# Agent Functionality Audit — Aksh Health (UK)

**Date:** 2026-10-30  
**Branch:** `docs/agent-functionality-audit`  
**Base commit:** `43921aa` (`origin/main` — Merge PR #85 feat/ci20-agent-intel-wiring)  
**App:** `packages/platform-uk`  
**Scope:** Evidence-based inventory + A–F functional audit + maturity L0–L5.  
**Constraints observed:** No roadmap implementation; no merge/deploy; no PHI; no autonomous Rx; Guardian/SHIELD/tenant isolation not weakened.

**Legend — Verified vs Intended**

| Term | Meaning |
| --- | --- |
| **Verified** | Code path exists, invocable in-process or via API, exercised by tests run in this audit (or strongly evidenced by existing tests that we re-ran) |
| **Partial** | Built surface exists but incomplete wiring, alias drift, simulation-only, or not on CONDUCTOR path |
| **Intended** | Registered / marketed / planned; no runner or `trigger: never` |

---

## 1. Executive summary

Aksh Health registers **14 named agents** in `lib/agents/register.ts`. Twelve are `in_validation` / `simulation`; **PRISM** and **ATLAS** are `planned` / not built.

**Operational core (verified):** CONDUCTOR → clinical-spine façade → clinical-proof parallel fan-out of SYNTHESIS, GUARDIAN, HORIZON(ORACLE), NEXUS (+ optional DrASSIST), then HITL review queue, SHIELD audit, PATHWAY/BRIDGE post-accept.

**Not one continuous clinic journey:** intake, Front Desk booking, nurse vitals, connected-diabetes, and CONDUCTOR review remain parallel tracks (see `MULTI_STAKEHOLDER_WORKFLOW_AUDIT.md`).

**No Vercel Workflow DevKit** is integrated. `lib/workflow/` is HITL review-queue domain code. Durable orchestration is intentional-avoid (ADR), not missing by accident.

---

## 2. Inventory (14 agents — no double-counting)

### 2.1 Alias map (count once)

| Canonical (`register.id`) | Legacy / API / code ids | Notes |
| --- | --- | --- |
| HORIZON | ORACLE | Impl `llm-oracle.ts`; `/api/agents/horizon` re-exports oracle; `REVIEW_ORDER` still lists `ORACLE` |
| COMPASS | EQUITY | Impl `llm-equity.ts`; `/api/agents/compass` → equity |
| PATHWAY | REFERRAL | Queue/API still `REFERRAL`; `/api/agents/pathway` → referral |
| DrASSIST | DR_ASSIST / Dr.Assist | `modelFlag: "DR_ASSIST"` |
| VOICE (dictation) | ≠ VOICE CARE | `voice-care` is synthetic outbound escalation — **not** the VOICE agent |

### 2.2 Registry snapshot

| Agent | Status | Trigger | LLM flag | Verdict |
| --- | --- | --- | --- | --- |
| CONDUCTOR | in_validation | case_run | null | **Verified** supervisor |
| VOICE | in_validation | intake_session | null | **Partial** (ASR/transcribe path; not CONDUCTOR) |
| CANVAS | in_validation | intake_session | null | **Verified** deterministic intake |
| SYNTHESIS | in_validation | conductor_parallel | SYNTHESIS | **Verified** |
| DrASSIST | in_validation | conductor_after | DR_ASSIST | **Verified** (opt-in) |
| GUARDIAN | in_validation | conductor_parallel | GUARDIAN | **Verified** (≠ guardian-gateway) |
| HORIZON | in_validation | conductor_parallel | ORACLE | **Verified** under ORACLE identity |
| NEXUS | in_validation | conductor_parallel | NEXUS | **Verified** (dual paths) |
| PATHWAY | in_validation | after_note_and_codes_accepted | null | **Verified** packaging |
| BRIDGE | in_validation | after_case_accepted | null | **Verified** FHIR staging (`liveEmis: false`) |
| SHIELD | in_validation | every_event | null | **Verified** audit infra |
| COMPASS | in_validation | on_request | EQUITY | **Verified** on-demand API |
| PRISM | planned | never | null | **Intended only** |
| ATLAS | planned | never | null | **Intended only** |

### 2.3 Out-of-registry agent-shaped modules (do not count as the 14)

| Module | Path | Notes |
| --- | --- | --- |
| VOICE CARE | `lib/agents/voice-care.ts`, `app/api/agents/voice-care` | Synthetic escalation |
| Causal AI | `lib/precision-health/causal-ai.ts`, `app/api/agents/causal` | Hypothesis stub |
| Coaching (sleep/nutrition/exercise/mental-health) | `lib/precision-health/coaching.ts` + `/api/agents/*` | Deterministic coaching |
| Diabetes agent-intel `runAgentOrchestration` | `lib/diabetes-intelligence/agent-intel-assemble.ts` | **Name collision** — not clinical-proof CONDUCTOR |
| Connected diabetes journey | `lib/diabetes-intelligence/connected-journey-orchestrate.ts` | Domain seed/HITL pipeline |
| Context Engine | `lib/context-engine/` | Authorised context package |
| Guardian Gateway | `lib/guardian-gateway/` | PASS/REVIEW/BLOCK pre-enqueue gate |

### 2.4 Key source paths

| Area | Path |
| --- | --- |
| Register | `lib/agents/register.ts` |
| LLM runners | `lib/agents/llm-{synthesis,guardian,oracle,nexus,dr-assist,equity}.ts` |
| Clinical-proof runner | `lib/clinical-proof/agent-orchestration.ts` |
| Clinical-spine façade | `lib/clinical-spine/orchestrate.ts` |
| Contracts / NEXUS GraphRAG | `lib/agents/contracts/` |
| Agent APIs | `app/api/agents/` |
| HITL workflow | `lib/workflow/` |
| Readiness | `lib/agents/readiness.ts` |
| Phase-2 honesty | `lib/agents/phase2-capability-status.ts` |

---

## 3. Functional audit A–F (per agent)

Dimensions: **A** Implementation · **B** Intelligence · **C** Integration · **D** Reliability/safety · **E** Product experience · **F** Verification

### CONDUCTOR — L3

| Dim | Finding |
| --- | --- |
| A | Façade `runClinicalSpineOrchestrate` wraps `runAgentOrchestration`; register contract complete |
| B | Deterministic supervisor; no model |
| C | `/api/agents/orchestrate`, clinical-review route; enqueue + SHIELD |
| D | Per-agent 8s / overall 30s timeouts; fail-closed; no cancel/retry/durable resume |
| E | `ClinicalOrchestratePanel`, AgentControlPanel |
| F | **PASS** `clinical-proof-orchestration`, `clinical-spine-phase-c`, `e2e-platform-agents`, `agent-loop` (2026-10-30) |

### VOICE — L2

| Dim | Finding |
| --- | --- |
| A | Intake ASR via `/api/transcribe` + UI mic; `partOf: CANVAS` |
| B | Deterministic / Deepgram when keyed; else labelled simulated transcript |
| C | Not in CONDUCTOR; separate from VOICE CARE |
| D | On failure: typed intake continues (register) |
| E | VoiceRecorder / GP mic panels |
| F | Evidence cited `workflow-scenarios` **PASS**; no dedicated VOICE unit suite re-run as CONDUCTOR peer |

### CANVAS — L3

| Dim | Finding |
| --- | --- |
| A | `lib/intake-generation.ts` → `createReviewCaseFromIntake` |
| B | Heuristic/deterministic (directory wrongly hints LLM) |
| C | Classic `/intake` → review cases; **no** `/api/agents/canvas` |
| D | Trace per inferred field required |
| E | Intake UX; marketing ProductCanvas is narrative only |
| F | **PASS** `workflow-scenarios`, `export-mapping` (via workflow suite) |

### SYNTHESIS — L3

| Dim | Finding |
| --- | --- |
| A | `llm-synthesis.ts` + API route |
| B | LLM when `ENABLE_LLM_SYNTHESIS` + AI configured; else deterministic SOAP; production workspace forces LLM off |
| C | CONDUCTOR parallel slot; review item `soap_note` |
| D | Fail-closed on orchestration timeout; HITL required |
| E | Review queue SOAP item |
| F | **PASS** orchestration tests; eval harness includes SYNTHESIS golden cases |

### DrASSIST — L3

| Dim | Finding |
| --- | --- |
| A | `llm-dr-assist.ts`; after parallel set |
| B | LLM optional; lexicon fallback |
| C | Spine default `includeDrAssist: false`; clinical-review may set true |
| D | Coding suggestions only; no prescribe |
| E | Diagnosis codes review item |
| F | **PASS** orchestration (with include); register evidence |

### GUARDIAN — L3

| Dim | Finding |
| --- | --- |
| A | `llm-guardian.ts` med-safety draft |
| B | LLM optional over graph/mock |
| C | CONDUCTOR parallel; humanGate `medication_decision` |
| D | Distinct from **guardian-gateway** policy gate — both verified |
| E | GuardianAlert panels |
| F | **PASS** `clinical-proof-hitl`, orchestration; hazard-trace in clinical-proof suite |

### HORIZON (ORACLE) — L3

| Dim | Finding |
| --- | --- |
| A | `llm-oracle.ts`; alias routes |
| B | Composite risk + factors; diabetes adds factors only |
| C | CONDUCTOR slot as ORACLE; review item `oracle_update` |
| D | No competing composite score (FR-AGT-020) |
| E | Risk draft in review queue |
| F | **PASS** orchestration; **PARTIAL** `eval:agents` — 2/3 golden cases (ORACLE mention check failed in one fixture under deterministic mode, EXIT 1) |

### NEXUS — L3

| Dim | Finding |
| --- | --- |
| A | Path A: `llm-nexus.ts` draft; Path B: `contracts/run-nexus.ts` GraphRAG contracted |
| B | Always draft; correlations only |
| C | Both paths used (CONDUCTOR + spine contracted) |
| D | Cannot trigger actions |
| E | Correlation draft in queue / gateway path |
| F | **PASS** `nexus-agent`, orchestration, spine-c |

### PATHWAY (REFERRAL) — L3

| Dim | Finding |
| --- | --- |
| A | `lib/referral-agent.ts` packaging |
| B | Deterministic rules |
| C | After note+codes accept; not CONDUCTOR parallel |
| D | ServiceRequest draft only; further accept required |
| E | Referral package review item |
| F | **PASS** `agent-loop`, `intervention-draft-shape`, diabetes escalation |

### BRIDGE — L2/L3

| Dim | Finding |
| --- | --- |
| A | `lib/bridge-staging.ts` FHIR R4 staging |
| B | Deterministic |
| C | After case accept; no `/api/agents/bridge` |
| D | `liveEmis: false` hard; ehrWriteAttempted false |
| E | Staging feedback to reviewer |
| F | **PASS** `demo-launch-d1` |

### SHIELD — L3

| Dim | Finding |
| --- | --- |
| A | `lib/shield-audit.ts` + repository append-only |
| B | Deterministic audit |
| C | Spine CONDUCTOR run + decisions; gaps on some diabetes-intel domain decisions |
| D | Dual-write fail-visible on review path |
| E | Audit APIs `/api/audit/shield` |
| F | **PASS** `clinical-proof-shield` (noted `postgres_not_configured` for durable write in local run — fail-visible path exercised) |

### COMPASS (EQUITY) — L2

| Dim | Finding |
| --- | --- |
| A | `llm-equity.ts` + API |
| B | Aggregate brief; small-cell suppression |
| C | On-request only; not CONDUCTOR |
| D | Never names a patient |
| E | Population lead surfaces |
| F | **PASS** `api-contracts`; thinner dedicated suite than core peers |

### PRISM — L0

| Dim | Finding |
| --- | --- |
| A–E | Status stub only (`phase2-capability-status`); no runner/API |
| F | **PASS** phase2 honesty tests (`built:false`, `wired:false`, `live:false`) |

### ATLAS — L0

| Dim | Finding |
| --- | --- |
| A–E | Status stub only; federated-research stub is **not** ATLAS |
| F | **PASS** phase2 honesty tests |

---

## 4. Maturity scale (L0–L5)

| Level | Definition (this audit) |
| --- | --- |
| L0 | Registered/planned only; no runner |
| L1 | Stub / marketing / honesty module |
| L2 | Runnable path exists; limited integration or thin tests |
| L3 | Integrated into product path with HITL + tests (simulation) |
| L4 | Validated against release criteria (decided drafts + CSO targets + sign-offs) |
| L5 | Production-approved for real patients |

**None reach L4/L5:** `evaluateReadiness` requires CSO-confirmed targets and sign-offs; register keeps all runnable agents in `simulation`. LLM forced off in real workspace (`llm-gate`).

### Maturity table

| Agent | Maturity | Evidence summary |
| --- | --- | --- |
| CONDUCTOR | **L3** | Spine + proof + tests PASS |
| VOICE | **L2** | Transcribe/intake partial; not orchestrated |
| CANVAS | **L3** | Intake → review case verified |
| SYNTHESIS | **L3** | Parallel slot + HITL + tests |
| DrASSIST | **L3** | After-parallel + tests (opt-in) |
| GUARDIAN | **L3** | Parallel + HITL + gateway companion |
| HORIZON | **L3** | Parallel as ORACLE; eval partial fail |
| NEXUS | **L3** | Dual paths tested |
| PATHWAY | **L3** | Post-accept packaging + loop test |
| BRIDGE | **L3** | Staging after accept; sim only |
| SHIELD | **L3** | Audit infra; diabetes SHIELD gaps remain |
| COMPASS | **L2** | On-request API; thinner journey integration |
| PRISM | **L0** | Planned |
| ATLAS | **L0** | Planned |

---

## 5. Tests executed (this audit)

Environment: worktree `aksh-health-agent-audit`; `node_modules` symlinked from sibling redesign checkout for dependency resolution. Local Postgres/Neo4j not required for most unit paths; SHIELD durable write reported `postgres_not_configured` (expected fail-visible).

| Command | Result |
| --- | --- |
| `npx tsx tests/agent-register.test.ts` | **PASS** — 14 contracts |
| `npx tsx tests/agent-readiness.test.ts` | **PASS** |
| `npx tsx tests/llm-gate.test.ts` | **PASS** |
| `npx tsx tests/phase2-capability-status.test.ts` | **PASS** |
| `npx tsx tests/nexus-agent.test.ts` | **PASS** |
| `ENABLE_LLM_*=false npx tsx tests/clinical-proof-orchestration.test.ts` | **PASS** |
| `npx tsx tests/clinical-spine-phase-c.test.ts` | **PASS** |
| `npx tsx tests/e2e-platform-agents.test.ts` | **PASS** (in-process e2e, not Playwright browser) |
| `npx tsx tests/diabetes-agent-intelligence.test.ts` | **PASS** |
| `npx tsx tests/diabetes-agent-intel-ci20-wiring.test.ts` | **PASS** |
| `npx tsx tests/clinical-proof-shield.test.ts` | **PASS** |
| `npx tsx tests/agent-directory-classification.test.ts` | **PASS** |
| `npx tsx tests/agent-loop.test.ts` | **PASS** |
| `npx tsx tests/clinical-proof-hitl.test.ts` | **PASS** |
| `npx tsx tests/clinical-spine-diabetes.test.ts` | **PASS** |
| `npx tsx tests/intervention-draft-shape.test.ts` | **PASS** |
| `npx tsx tests/demo-launch-d1.test.ts` | **PASS** |
| `npx tsx tests/loop-outcomes.test.ts` | **PASS** |
| `npx tsx tests/api-contracts.test.ts` | **PASS** |
| `npx tsx tests/workflow-scenarios.test.ts` | **PASS** |
| `ENABLE_LLM_*=false npm run eval:agents` | **FAIL** EXIT 1 — passRate 67% (ORACLE mention check) |

### Not executed (limitations)

- Full `npm run test:clinical-proof` / `test:workflow` suite (long; DB-gated subsets)
- Playwright browser e2e (`e2e/platform-golden-agents.spec.ts`, HITL specs) — no local Next server / env harness in this audit pass
- Live LLM paths (`ENABLE_LLM_*=true`) — intentionally left off
- Production Vercel logs / workflow runs — N/A (no DevKit; no prod investigation requested)
- Neon/Postgres dual-write durability beyond fail-visible unit behaviour

---

## 6. Cross-cutting risks (honesty)

1. `AGENT_DIRECTORY.live: true` ≠ register `in_validation` / production go-live.  
2. Two `runAgentOrchestration` symbols (clinical-proof vs diabetes-intel).  
3. GUARDIAN agent ≠ guardian-gateway; two NEXUS paths.  
4. VOICE CARE ≠ VOICE.  
5. `/api/agents/*` hosts non-registry coaching/causal routes.  
6. Unit/in-process tests ≠ operational multi-stakeholder clinic (see journey audit).

---

## 7. Related deliverables

- `AGENT_INTEGRATION_GAP_MATRIX.md`
- `AGENT_ORCHESTRATION_ARCHITECTURE.md`
- `MULTI_STAKEHOLDER_WORKFLOW_AUDIT.md`
- `AGENT_IMPLEMENTATION_ROADMAP.md`
- `HCP_AGENT_EVALUATION_PLAN.md`
- Optional diag: `npx tsx scripts/agent-functionality-audit-diag.ts`
