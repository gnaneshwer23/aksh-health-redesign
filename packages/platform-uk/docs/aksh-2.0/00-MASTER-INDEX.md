# Aksh Health 2.0 — Master Index

Working pack mapped from `Aksh_Health_2.0_Next_Steps_Document_Pack`.

**North star:** Application → Context Engine → Knowledge Graph + GraphRAG → bounded agents + approved models → Guardian gateway → clinician review → FHIR staging (`liveEmis:false`) → evaluation + audit.

**First use case:** Diabetes / cardiometabolic decision support on synthetic **P002 Mr James Patel**.

**Operator (graph live):** Resume Neo4j Aura `cbed9e8d`, then `npm run data:seed:neo4j`. Code must work in mock mode.

| Doc | File |
|-----|------|
| 01 Current state | [01-CURRENT-STATE-AUDIT-FROM-REPO.md](./01-CURRENT-STATE-AUDIT-FROM-REPO.md) |
| 02 Keep/Modify/Replace | [02-KEEP-MODIFY-REPLACE.md](./02-KEEP-MODIFY-REPLACE.md) |
| 03 Architecture | [03-MASTER-ARCHITECTURE.md](./03-MASTER-ARCHITECTURE.md) |
| Phase 1 — orchestration + Care Episode | [PHASE1_AGENT_ORCHESTRATION_CARE_EPISODE.md](./PHASE1_AGENT_ORCHESTRATION_CARE_EPISODE.md) |
| 90 Pilot protocol | [90-PILOT-PROTOCOL.md](./90-PILOT-PROTOCOL.md) |

**2026-10-30 note:** Document 01 still understates CI 2.0 layers that now exist in code (Context Engine, model registry, Guardian gateway, evaluation engine, GraphRAG). Prefer the Phase 1 report above for current capability classification until Document 01 is fully rewritten.
