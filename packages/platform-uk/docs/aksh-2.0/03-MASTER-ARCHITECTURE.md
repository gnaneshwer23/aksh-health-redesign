# Aksh Health 2.0 — Master Architecture (implemented baseline)

Principles: human authority; bounded agents; GraphRAG as shared context; only approved model versions; provenance + uncertainty; least-privilege; no autonomous prescribing or EHR write-back.

## Implemented V1 modules

| Service | Path |
|---------|------|
| Context Engine | `lib/context-engine/` |
| GraphRAG | `lib/graphrag/` |
| Agent contracts | `lib/agents/contracts/` |
| Guardian gateway | `lib/guardian-gateway/` |
| Model registry | `lib/model-registry/` |
| Evaluation engine | `lib/evaluation-engine/` |
| Workspace UI | `components/dashboard/ClinicalIntelligenceWorkspace.tsx` |

Honesty: `liveEmis:false` · HITL required · diabetes-first · PRISM/ATLAS unbuilt.
