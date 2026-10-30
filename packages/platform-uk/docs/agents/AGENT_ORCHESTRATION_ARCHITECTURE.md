# Agent Orchestration Architecture

**Date:** 2026-10-30  
**App:** `packages/platform-uk`  
**Workflow skill note:** Assessed Vercel Workflow DevKit existence only — **not integrated**. Do not invent DevKit wiring.

---

## 1. Canonical recommendation (ONE architecture)

**Keep and extend:**

```
lib/agents/register.ts          ← contracts, REVIEW_ORDER, LOOP, prohibitions
        │
        ▼
lib/clinical-spine/orchestrate.ts   ← product CONDUCTOR façade (canonical)
        │  calls
        ▼
lib/clinical-proof/agent-orchestration.ts  ← sole parallel agent fan-out
        │  Promise.all
        ├── llm-synthesis / llm-guardian / llm-oracle / llm-nexus
        └── llm-dr-assist (after parallel, opt-in)
        │
        ▼ (spine post-steps)
 diabetes additive (flag) → Decision/safety route → twin (synthetic)
 → Context Engine package → contracted NEXUS → guardian-gateway
 → SHIELD (awaited) → enqueue (if mayEnqueueAgentDraft)
        │
        ▼
lib/workflow/* + review_cases     ← HITL Accept/Edit/Reject
        │
        ├── PATHWAY (after note+codes)
        ├── BRIDGE (after case accept)
        └── SHIELD (every decision) + learning events
```

**Diabetes-intelligence** remains a **domain seed / HITL pipeline**, not a second CONDUCTOR. Rename its `runAgentOrchestration` over time to avoid collision.

**Do not introduce** Temporal / LangGraph / Vercel Workflow DevKit until ADR trigger (multi-day resumable waits) fires.

---

## 2. Layer comparison

| Dimension | Register + LLM agents | clinical-proof | clinical-spine | diabetes-intelligence |
| --- | --- | --- | --- | --- |
| Role | Contracts + runners | Parallel fan-out | Product CONDUCTOR | Domain journey + deterministic drafts |
| Invokes LLM agents | Yes (gated) | **Yes** | Via proof | **No** (labels can mislead) |
| HTTP full-run | Per-agent routes | Library only | `/api/agents/orchestrate`, clinical-review | connected-diabetes, agent-intelligence |
| Shared context | Documented | `SharedPatientContext` | + context package + diabetes overrides | `agent-intel-context` + modules |
| Parallelism | Specified | Promise.all peers | Sequential post-steps | Connected sequential; reads may Promise.all |
| Timeout | Spec | 8s/agent, 30s overall | Passthrough; route maxDuration 60 | Route maxDuration; no per-step race |
| Cancel / retry | Spec fail-closed | Throw; no AbortController | No durable resume | Per-phase try/catch continue |
| Guardian agent | Yes | Yes | Via proof | Synthetic labels only |
| Guardian gateway | — | No | **Yes** | **Yes** |
| SHIELD run audit | Expected | No | **Yes** (CONDUCTOR) | File/module; weaker |
| Review queue | — | Flags only | **Yes** review_cases | Separate domain queues |
| Idempotency | — | Pure result | Referral item ids; review version 409 | Seed replace; pipeline reuse |
| Durable workflow | No | No | No | No |
| Tests (re-run) | register, readiness | orchestration PASS | spine-c PASS | diab-intel + ci20 PASS |

---

## 3. Capability checklist (canonical path)

| Capability | Status | Evidence |
| --- | --- | --- |
| Shared patient context | **Verified** | `SharedPatientContext` + patientId/label asserts |
| Fixed order / deps | **Verified** | Parallel peers; DrASSIST after; diabetes additive after |
| Parallel fan-out | **Verified** | Promise.all in clinical-proof |
| Timeout | **Verified** | withTimeout; fail-closed |
| Cancel | **Missing** | No AbortSignal propagation |
| Retry | **Missing** | No automatic retry (by design for clinical fail-closed) |
| Guardian agent | **Verified** | llm-guardian |
| Guardian gateway enqueue gate | **Verified** | `mayEnqueueAgentDraft` — BLOCK never enqueues |
| Review queue A/E/R | **Verified** | `decide-review-item` / case decision |
| Persistent decisions | **Verified** | review_cases + learning_events (+ SHIELD when DB up) |
| Downstream PATHWAY | **Verified** | after note+codes (`agent-loop` PASS) |
| Downstream BRIDGE | **Verified** | after case accept (`demo-launch-d1`) |
| SHIELD audit | **Verified** | spine + decisions; diabetes gaps |
| Recovery / idempotency | **Partial** | Optimistic concurrency; shield-audit-retry API; no durable orchestration resume |
| Cross-stakeholder visibility | **Partial** | Spine role APIs; Front Desk / diabetes not unified |

---

## 4. Naming collisions (must preserve in docs)

| Name | Real meaning |
| --- | --- |
| CONDUCTOR | Register supervisor; executed by clinical-spine |
| `runAgentOrchestration` (proof) | Parallel LLM/deterministic agents |
| `runAgentOrchestration` (diabetes) | Deterministic draft assemble — **different** |
| GUARDIAN | Med-safety draft agent |
| guardian-gateway | Pre-HITL policy gate |
| NEXUS llm-nexus | Orchestration draft slot |
| NEXUS contracted | GraphRAG findings under gateway |
| `lib/workflow` | HITL domain — **not** Vercel Workflow DevKit |

---

## 5. Vercel Workflow DevKit assessment

| Check | Result |
| --- | --- |
| `"use workflow"` / `"use step"` in sources | **None** |
| `@vercel/workflow` / `workflow` package dep | **Not** in app `package.json` (transitive `@workflow/serde` via AI SDK only) |
| `lib/workflow/` | HITL review queue / decide / finalization |
| ADR posture | Avoid Temporal / durable engines for now (`docs/ADR_TECH_STACK_MODERNIZATION.md`) |
| Implication | Orchestration is **request-scoped synchronous**. Adequate for draft generation + HITL. Not hang-debugging via `vercel workflow runs`. |

---

## 6. Context Engine & Guardian Gateway roles

### Context Engine (`lib/context-engine/`)

- Assembles authorised `ClinicalContextPackage` (patient, meds, labs, evidence, missing_information, uncertainties).
- Used by spine, diabetes assemble, GraphRAG, chat.
- SHIELD actor `"context-engine"` on assemble.

### Guardian Gateway (`lib/guardian-gateway/index.ts`)

- Independent of model: identity, purpose, model approval, grounding, missing info, injection, prohibited patterns → `PASS` | `REVIEW` | `BLOCK`.
- `BLOCK` → no enqueue (`lib/workflow/review-queue.ts`).
- Used by spine, diabetes agent-intel, evaluation-engine, patient chat — **not** by clinical-proof core alone.

---

## 7. Preserve-as-is invariants

1. `ehrWrite: false` / `liveEmis: false` / no autonomous prescribe.  
2. Fail-closed orchestration timeouts (FR-AGT-036/037).  
3. Diabetes module additive-only when flag on.  
4. PRISM/ATLAS never appear built/wired/live.  
5. LLM gated off in real workspace.  
6. Single parallel fan-out implementation (clinical-proof).

---

## 8. Consolidation steps (docs only — roadmap)

1. **P0:** Document + rename diabetes `runAgentOrchestration` (code later).  
2. **P0:** Route clinician-facing diabetes drafts through spine enqueue adapter when they should hit GP review worklist.  
3. **P1:** Canonical id aliases in REVIEW_ORDER without breaking legacy API routes.  
4. **P4:** Revisit durable workflow only if multi-day pause/resume becomes a product requirement.
