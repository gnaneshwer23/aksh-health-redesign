# 27 — Clinical Intelligence 2.0 gap matrix

**Date:** 30 October 2026  
**Sources:** `packages/platform-uk/docs/aksh-2.0/*`, `lib/context-engine`, `lib/graphrag`, `lib/agents/contracts`, `lib/guardian-gateway`, `lib/model-registry`, `lib/evaluation-engine`, `tests/aksh20-intelligence.test.ts`  
**Honesty:** Synthetic / `liveEmis:false` · not clinically validated · `LIVE_ORGANISATIONS=0`

The five outstanding CI 2.0 capabilities (relative to the 1.0 audit “Missing / Partial” north-star stack) are:

1. **Context Engine** (signed clinical context package)  
2. **GraphRAG** (hybrid retrieval over patient + guideline fixtures)  
3. **Bounded agent contracts** (PASS / REVIEW / BLOCK + tool/evidence fields)  
4. **Guardian gateway** (independent safety gate in front of HITL)  
5. **Model registry + evaluation engine** (approved-use + layered release checks)

| # | Capability | Classification | File-level evidence | Test results |
|---|------------|----------------|---------------------|--------------|
| 1 | Context Engine | **Implemented + tested** | `lib/context-engine/{assemble,policy,types,index}.ts`; `app/api/context/package/route.ts` | `aksh20-intelligence.test.ts` — assemble P002, deterministic id, ops role deny, API 200/403 |
| 2 | GraphRAG | **Implemented + tested** (fixture / mock-first; Aura Neo4j optional) | `lib/graphrag/{retrieve,fixtures,index}.ts` | Suite asserts guideline hits + provenance; `liveEmis:false` |
| 3 | Agent contracts | **Implemented + tested** | `lib/agents/contracts/{types,run-nexus,index}.ts` | `runContractedNexus` → `REVIEW`, `graph_retrieval` tool, evidence length > 0, HITL required |
| 4 | Guardian gateway | **Implemented + tested** | `lib/guardian-gateway/index.ts` | Independent of agent model; injection → `BLOCK`; nexus path → `REVIEW`; `mayEnqueueAgentDraft` wired |
| 5 | Model registry + evaluation engine | **Implemented + tested** | `lib/model-registry/index.ts`; `lib/evaluation-engine/index.ts` | Synthetic approval true / production false; `runEvaluationEngineV1("P002").passed === true` |

## Adjacent (not one of the five, but related)

| Item | Classification | Notes |
|------|----------------|-------|
| Clinical Intelligence Workspace UI | **Partial** | `components/dashboard/ClinicalIntelligenceWorkspace.tsx` exists; Document-09 single pane (evidence/uncertainty/graph) not fully unified with connected-diabetes chrome |
| Neo4j live knowledge graph | **Partial / operator-dependent** | Code works in mock; Aura resume is operator work (`docs/aksh-2.0/00-MASTER-INDEX.md`) |
| Connected diabetes phases 0–6 | **Implemented + tested** (synthetic) | Separate inventory — doc 17; not a substitute for CI 2.0 infrastructure |

## Gaps remaining (backlog seeds)

- ~~Wire Context Engine package into every connected-diabetes draft path~~ — **Done** (`runAgentOrchestration` assembles Context Engine + `enrichSharedContextFromClinicalPackage` before drafting).  
- Promote GraphRAG from fixtures to live ontology when Aura is resumed — still synthetic clinical claim.  
- ~~Extend Guardian gateway in front of Phase 5 agent-intel enqueue~~ — **Done** (`evaluateGuardianGateway` + `mayEnqueueAgentDraft`; BLOCK → no worklist drafts).  
- ~~Evaluation engine as a **CI release gate job**~~ — **Done** (`test:ci20:evaluation-gate` + required Actions job `CI 2.0 evaluation gate`; `test:aksh20:eval` remains in platform-unit-gates).  
- Do **not** flip `LIVE_ORGANISATIONS` or production model approvals without GOV-01…03.
