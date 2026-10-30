# Agent Runtime Verification — Milestone A1

**HEAD baseline:** `9abf04c`  
**Evidence date:** 2026-10-30  
**Schema:** `agent-execution-metadata-v1` (`lib/agents/execution-metadata.ts`)

Standardised fields (per agent + run bundle):  
`executionMode`, `modelProvider` / `modelId` / `modelVersion`, `agentVersion`, `promptId`/`promptVersion`, `rulesetId`/`rulesetVersion`, `status`, timings (`startedAt`/`completedAt`/`durationMs`), `careEpisodeId`, `correlationId`, `evidenceRefs`, `guardianOutcome`, `reviewStatus`, `errorCode` (+ `errorMessage`/`retryable`), always `ehrWrite:false` / `hitlRequired:true`.

---

## 14 agents — evidence matrix

| # | Agent | Runtime path | Mode honesty | Timeouts / errors | Metadata | Tests (A1+) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **CONDUCTOR** | `clinical-spine/orchestrate` → `clinical-proof/agent-orchestration` | `orchestrator` | Per-agent 8s / overall 30s; classified TIMEOUT | Bundle + conductor slot | agent-runtime-contract, clinical-proof-orchestration, spine-c | Supervisor only |
| 2 | **VOICE** | Intake / transcribe (partOf CANVAS) | `rules` | On failure → typed intake | Version pin present | agent-register, workflow-scenarios | Not CONDUCTOR parallel |
| 3 | **CANVAS** | `intake-generation` | `rules` | Fail closed on intake | Version pin | agent-register, workflow-scenarios | Deterministic intake |
| 4 | **SYNTHESIS** | `llm-synthesis` via CONDUCTOR | `deterministic`\|`llm` | Timeout + fail-closed retries=0 | Slot metadata | agent-runtime-contract, orchestration | LLM gated |
| 5 | **DrASSIST** | `llm-dr-assist` after parallel | `deterministic`\|`llm` | Same | Slot metadata | agent-runtime-contract (opt-in) | Coding only |
| 6 | **GUARDIAN** | `llm-guardian` + gateway | Agent draft + gateway outcome | Gateway BLOCK → no enqueue | `guardianOutcome` on spine | agent-runtime-contract BLOCK sample | Preserve fail-closed |
| 7 | **HORIZON** | `llm-oracle` (ORACLE slot) | Honest mode; alias map | Same | Metadata `agentId=HORIZON` | agent-runtime-contract, eval:agents 3/3 | Legacy ORACLE id in slots |
| 8 | **NEXUS** | `llm-nexus` + contracted GraphRAG | Always draft | Evidence required | Slot + contracted path | nexus-agent, orchestration | Dual path |
| 9 | **PATHWAY** | Post note+codes accept | `rules` | No draft from unreviewed | Version pin | agent-loop, intervention-draft | Not parallel |
| 10 | **BRIDGE** | After case accept | `rules` | Staging fail-visible | Version pin | demo-launch-d1 | `liveEmis:false` |
| 11 | **SHIELD** | Every run/decision | `rules` | Fail-visible dual-write | SHIELD payload carries correlation/careEpisode | clinical-proof-shield, spine | #92 integrity preserved |
| 12 | **COMPASS** | On-request `llm-equity` | `deterministic`\|`llm` | Aggregate only | Version pin | api-contracts | Not CONDUCTOR |
| 13 | **PRISM** | P4 scaffold eval only | `scaffold` | Never CONDUCTOR | Version pin scaffold | p4-prism-atlas-scaffold, phase2-status | **No expansion in A1** |
| 14 | **ATLAS** | P4 scaffold eval only | `scaffold` | Never CONDUCTOR | Version pin scaffold | p4-prism-atlas-scaffold, phase2-status | **No expansion in A1** |

---

## Contract samples exercised in A1

| Sample | Result | Evidence |
| --- | --- | --- |
| Valid CONDUCTOR run + complete metadata | PASS | `tests/agent-runtime-contract.test.ts` |
| Missing `patientId` / unknown patient | PASS → `MISSING_CONTEXT` / `UNKNOWN_PATIENT` | same |
| Timeout classification | PASS → `TIMEOUT` non-retryable | same |
| Guardian BLOCK → `mayEnqueueAgentDraft=false` | PASS | same + gateway unit |
| Duplicate idempotency key | PASS → `DUPLICATE_RUN` | process-local (durable → A2) |
| Cross-tenant `scopeKey` mismatch | PASS → `CROSS_TENANT` | same |
| eval:agents golden (deterministic) | PASS 3/3 | `npm run eval:agents` |

---

## Gaps deferred to A2+

- Persist full execution bundles into durable store (extend `agent_intel_runs` / SHIELD / care_episode events — not a new engine)
- CONDUCTOR failure-scenario drills with recorded recovery
- Expand contract suite beyond critical subset (VOICE/CANVAS/PATHWAY/BRIDGE/COMPASS deep samples)
- SHIELD consistency pass beyond #92 (diabetes + other domain decide routes audit)

---

## Honesty statements

- Deterministic runs under `ENABLE_LLM_*=false` claim `executionMode: deterministic` and `modelProvider: none` — never LLM.
- No autonomous prescribing; no live EHR writeback.
- Formal HCP evaluation remains Milestone B.
