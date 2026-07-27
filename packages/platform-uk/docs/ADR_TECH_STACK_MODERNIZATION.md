# ADR: Tech Stack Modernization Decision (Aksh Health 2.0)

**Status:** Accepted (decision record — no infra provisioned by this document)
**Date:** 27 July 2026
**Context docs:** `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` (A) · `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` (B)
**This is:** Option C from the Aksh Health 2.0 readiness brief — the third and final document in the A/B/C triad.

---

## Status

Accepted. This ADR settles keep / add-later / avoid-now for the stack modernization list in the Aksh Health 2.0 vision, so future proposals to add NestJS, FastAPI, Temporal, LangGraph, Kafka, Redis, GraphQL, Qdrant, or ClickHouse resolve against this document instead of being re-litigated each time.

## Context

The Aksh Health 2.0 vision proposes a substantially larger stack across five areas:

- **Frontend:** Next.js, React, TS, Tailwind, shadcn, React Flow, Mapbox, ECharts, Three.js
- **Backend:** NestJS, FastAPI, Temporal, LangGraph, Kafka, Redis, GraphQL
- **Data:** PostgreSQL, Neo4j, Qdrant, ClickHouse, FHIR Server, MinIO
- **AI:** OpenAI, Claude, Gemini, Llama, BiomedCLIP, MedGemma, medical embeddings/rerankers
- **Knowledge:** FHIR, SNOMED, LOINC, RxNorm, ICD, ontology, KG
- **Research:** PubMed, ClinicalTrials.gov, DrugBank, Open Targets, BioPortal

This is not the first time this exercise has run. Two prior audits reached the same structural conclusion against two earlier vision docs:

- `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` (parent repo) — TechDoc proposed Supabase, Cognito, Weaviate, Mirth, Kafka MSK, LangGraph on EKS; concluded "what exists today is a credible synthetic proof... not the production stack the TechDoc describes," and sequenced additions as phases rather than a rewrite.
- `docs/BUILD_INSTRUCTIONS_GAP.md` — a "complete build instructions" doc assumed Supabase auth, direct Anthropic SDK, and a LangGraph CONDUCTOR. Explicit decision: **"We keep the working stack and implement gaps only."**

The Diabetes spec (B) is a live test of this principle: its v0 and v1 phases were designed to need **zero new infrastructure**. This ADR generalizes that same discipline to the rest of the proposed stack.

## Decision

Adopt three buckets — **Keep now**, **Add later (named trigger)**, **Avoid now (with precedent)** — evaluated per component below. The governing rule: **infrastructure is added when a concrete, observed bottleneck demands it, not when a vision document lists it.**

---

## Frontend

| Component | Bucket | Notes |
| --- | --- | --- |
| Next.js (App Router), React, TypeScript | **Keep** | Already the entire product. 56 routes, tested, deployed. |
| Tailwind CSS | **Keep** | Already in use; per workspace rule, stay on 3.4 if/when any InsForge-adjacent tooling is touched — not relevant to this stack otherwise. |
| shadcn/ui-style components | **Keep** | `@radix-ui/*` primitives + `class-variance-authority` + `tailwind-merge` already provide this pattern in `package.json`; no new component library needed. |
| React Flow | **Add later** | Trigger: a real need to render an interactive agent/pipeline graph editor (e.g. a CONDUCTOR flow visualizer). Not needed for Diabetes v0/v1, which has no new UI graph surface. |
| Mapbox | **Add later** | Trigger: a real geographic visualization requirement (e.g. ICS population maps beyond the current IMD/aggregate cards). COMPASS/ICS dashboards currently use `recharts`, which is sufficient for current chart needs. |
| ECharts | **Avoid now** | `recharts` is already installed and used across dashboards (`package.json`). Adding a second charting library duplicates capability without a named gap it fills. |
| Three.js | **Avoid now** | No 3D visualization requirement exists anywhere in the product (clinical review UI, dashboards, patient companion). Revisit only if a specific 3D use case (e.g. anatomical visualization) is scoped and approved by a clinical lead. |

## Backend

| Component | Bucket | Notes |
| --- | --- | --- |
| Next.js API routes (current backend) | **Keep** | All 19+ API routes run here today. Single deploy unit, single auth boundary, single audit trail (SHIELD). |
| **NestJS** | **Avoid now** | Would mean forking the backend into a second service with its own deploy, auth boundary, and observability — before any load or team-structure reason exists to split it. `ENABLE_FASTAPI_SYNTHESIS` (see below) is the *only* externalization boundary the product currently needs, and it's optional and off by default. **Trigger to revisit:** a second consuming client (e.g. a mobile app or partner integration) needs an API contract independent of the Next.js app's own routes. |
| **FastAPI** | **Avoid now (already decided)** | Precedent: `lib/fastapi-synthesis.ts` + `integration-config.ts` already define FastAPI as an **optional external synthesis adapter contract** (`ENABLE_FASTAPI_SYNTHESIS`, defaults `false`). This is not "we haven't adopted FastAPI yet" — it's "FastAPI is modeled as an optional boundary, deliberately not the backend." No change proposed. |
| **Temporal** | **Avoid now** | The current pipeline (CONDUCTOR: SYNTHESIS → GUARDIAN → HORIZON/NEXUS → safety-route → SHIELD) is synchronous, deterministic, and completes within a single request. Temporal solves durable, long-running, retry-heavy workflows — a real need only if the Diabetes v2 model path or a future async care-coordination workflow spans days with resumable state. **Trigger to revisit:** a workflow genuinely needs to survive process restarts across multi-day waits (e.g. "wait 30 days for outcome, then resume"). Note: the continuous-learning loop already handles delayed outcomes today via an **append-only eventual-outcome link** (`docs/CONTINUOUS_LEARNING.md`), not a running workflow — so this trigger has not yet fired. |
| **LangGraph** | **Avoid now (already decided, twice)** | Precedent: `docs/BUILD_INSTRUCTIONS_GAP.md` — "Do **not** introduce LangGraph" — and `docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md` gap table, which listed LangGraph as a TechDoc requirement not adopted. CONDUCTOR (`lib/clinical-spine/orchestrate.ts`) is deterministic and tested; LangGraph's agent-graph non-determinism is a liability, not a feature, in a HITL clinical safety pipeline that needs predictable, auditable control flow. This decision is reaffirmed, not revisited, by Aksh Health 2.0. |
| **Kafka** | **Avoid now** | No multi-service event fanout exists — everything is one Next.js app calling functions in-process. Kafka is infrastructure for a problem (cross-service event distribution) this architecture doesn't have. **Trigger to revisit:** a second independent service (not a Next.js API route) needs to react to clinical events asynchronously — e.g. a future standalone ingestion service for real CGM device streams (Diabetes v2+). |
| **Redis** | **Add later** | Trigger: a demonstrated cache-miss performance problem on a specific read path (e.g. dashboard aggregate queries at real multi-practice scale). Current JSON/Postgres reads at synthetic-cohort scale (100 patients) show no such problem. Cheap to add later; not worth the operational surface now. |
| **GraphQL** | **Avoid now** | Would only pay off with multiple independent external consumers needing flexible querying. Today there is exactly one consumer (this Next.js app's own UI) of its own REST-shaped API routes. **Trigger to revisit:** a genuine third-party or partner integration needs a query layer this product doesn't control the shape of. |

## Data

| Component | Bucket | Notes |
| --- | --- | --- |
| **PostgreSQL (Neon)** | **Keep** | Source of truth for users, onboarding, consent grants, learning events, SHIELD audit, practices. Migrations 001–010 already applied. |
| **Neo4j (Aura)** | **Keep** | Live driver + queries (`lib/neo4j/`) with an honest mock-fallback banner when offline. This *is* the KG layer referenced in the vision's Knowledge section — already built, not missing. |
| **Qdrant** | **Avoid now — pgvector first if/when triggered** | No embedding/RAG use case exists in the product today (no literature search, no similar-case retrieval). **Trigger to revisit:** Layer 4 (Research Intelligence) or a "similar encounters" feature needs vector search. Even then, the documented precedent (`docs/AKSH_PLATFORM_IMPLEMENTATION_PLAN.md`: *"Use pgvector interim per INDIA strategy D7; Weaviate M14+"*) is to extend the existing Neon Postgres with `pgvector` before adopting a dedicated vector database — one fewer service to operate, and Postgres is already the system of record. |
| **ClickHouse** | **Avoid now** | A ClickHouse MCP tool is available in this development environment's tool catalog — that is a developer-tooling availability fact, **not** a signal that the product needs a ClickHouse deployment. Current population/ICS analytics (`buildPopulationRiskState`, COMPASS aggregates) run on a 100-patient synthetic cohort via Postgres/Neo4j aggregation with no observed latency or scale problem. **Trigger to revisit:** population analytics genuinely outgrow Postgres aggregation at real multi-practice, multi-thousand-patient scale — not before. |
| **FHIR Server (e.g. Medplum, self-hosted)** | **Keep partial, expand later** | `lib/medplum-client.ts` already exists as a dry-run/rehearsal client; `ENABLE_MEDPLUM_SYNC` defaults off, blocked on a real `MEDPLUM_CLIENT_SECRET` (`docs/BUILT_VS_REMAINING_AUDIT.md`). This is a partner/credential blocker, not a stack decision — no new FHIR server technology choice needed. |
| **MinIO (object storage)** | **Add later** | Trigger: a real need for binary/blob storage (e.g. actual imaging pixel data, actual document uploads beyond current JSON/Postgres payloads). Current evidence artifacts and exports are JSON/PDF-shaped and fit existing storage. Imaging today is explicitly **metadata-only** (`imagingMetaSampleSchema`, `dicomPresent: false`) by design — adding object storage now would imply a capability (real image storage) this product has deliberately not built yet. |

## AI models

| Component | Bucket | Notes |
| --- | --- | --- |
| Vercel AI Gateway (current routing layer) | **Keep** | Already routes to `openai/gpt-5.4-mini` with deterministic fallbacks across SYNTHESIS, GUARDIAN, HORIZON, NEXUS. One key, evals + fallbacks already wired (`docs/BUILD_INSTRUCTIONS_GAP.md`). |
| OpenAI, Claude, Gemini, Llama (as interchangeable model choices) | **Keep — already model-agnostic** | The AI Gateway pattern already supports swapping underlying models without an architecture change; this is a model-selection decision per agent, not a stack addition. No direct-SDK integration (e.g. `@anthropic-ai/sdk`) is being added — precedent: `docs/BUILD_INSTRUCTIONS_GAP.md` keeps AI Gateway over direct SDKs. |
| BiomedCLIP, MedGemma (specialized medical multimodal models) | **Avoid now** | No imaging-pixel or multimodal clinical input pipeline exists (imaging stays metadata-only; PRISM is explicitly Phase 2, not built). Adopting a specialized multimodal model now has no consuming feature. **Trigger to revisit:** PRISM (Imaging Intelligence Agent) is scoped and a real image pipeline is approved. |
| Medical embeddings / rerankers | **Add later** | Trigger: same as Qdrant/pgvector above — a real retrieval use case (Layer 4 Research, or literature-grounded clinical drafting) must exist first. Model choice should be decided at that time, not pre-selected now. |

## Knowledge / terminology

| Component | Bucket | Notes |
| --- | --- | --- |
| FHIR (R4-shaped resources) | **Keep** | Already the export/evidence shape across the product (`lib/export-mapping.ts`, FHIR-shaped drafts, CI schema checks). Evidence-grade today, not integration-grade — that gap is about live write-back credentials (Track B), not the FHIR standard choice. |
| SNOMED / ICD-10 coding | **Keep partial** | Dr.Assist produces diagnosis-code drafts today (`lib/agents/llm-dr-assist.ts`) with deterministic/AI Gateway drafts; John Snow Labs NLP is explicitly **not wired** (`docs/BUILD_INSTRUCTIONS_GAP.md`) — this is a known, honestly labeled gap, not a stack decision to make here. |
| LOINC, RxNorm | **Add later** | Trigger: a real need for structured lab/medication code normalization beyond current free-text `codeText`/`valueText` fields in `labSampleSchema`/`clinicalSampleSchema`. The Diabetes spec's HbA1c signal (B, area #2) works today on existing free-text lab fields without this. |
| Formal ontology / KG beyond Neo4j's current scope | **Avoid now** | Neo4j already serves the KG role for patient/guardian/population queries. A separate ontology layer (e.g. formal SNOMED/ICD graph reasoning) has no consuming feature yet. |

## Research APIs (PubMed, ClinicalTrials.gov, DrugBank, Open Targets, BioPortal)

**Avoid now, all of them.** These map to Layer 4 (Research Intelligence), which the Layer Map ADR (A) marks **Partial — policy exists, pipeline does not** (`docs/RESEARCH_EVALUATION_BOUNDARY.md`, `lib/precision-health/federated-research.ts`). Integrating external research APIs before the research evaluation pipeline itself is real would mean building data connectors with nothing yet to connect them to. **Trigger to revisit:** ATLAS (Clinical Research Agent, currently Phase 2 / not built) is scoped, and a specific research task (e.g. literature grounding for a Diabetes prevention signal) is defined and clinically approved.

---

## Tie-in: Diabetes Spec (B) v0/v1/v2

- **v0 (stub types) and v1 (rules/demo signals)** in `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` ship entirely on the **Keep now** row: Next.js, Neon, Neo4j, AI Gateway, Zod. No component from the "Add later" or "Avoid now" buckets is required to complete either phase.
- **v2 (models under governance)** — if a real ML model replaces a v1 rule (e.g. a real hypo-risk classifier) — still routes through the **existing** AI Gateway and the **existing** G-ML-1/2/3 gates (`lib/repositories/governed-evaluation-repository.ts`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`). This ADR does not introduce a new model-serving stack (no dedicated inference infra, no MLOps platform) for v2 — that would only become relevant if a model's compute/latency profile genuinely outgrows AI Gateway routing, which has not been observed.
- If v2 or a later disease module surfaces a genuine trigger from the tables above (e.g. real CGM time-series volume justifying ClickHouse, or literature grounding justifying pgvector/Qdrant), it should be evaluated as a **targeted addition against that specific bottleneck**, not as adoption of the full proposed stack.

## What is NOT changing

- **HITL remains mandatory** for every clinical-facing draft — no stack choice in this ADR touches this.
- **`liveEmis: false`** stays hard. No integration technology choice (Kafka, FHIR server, etc.) implies or unblocks a live EHR write.
- **`autoRetrain: false`** and the G-ML-1/2/3 governed release gates stay exactly as specified — no AI/model stack addition bypasses them.
- **CONDUCTOR stays deterministic.** LangGraph is not adopted, for the same reasons already documented twice in this codebase.
- **SHIELD stays the sole audit system.** No new event bus or logging platform replaces it.
- **No new certifications implied.** Nothing in this ADR affects the Track A/B split in `docs/BUILT_VS_REMAINING_AUDIT.md`.

## Consequences

1. Future proposals to add any of NestJS, FastAPI-as-backend, Temporal, LangGraph, Kafka, GraphQL, Qdrant, or ClickHouse should be checked against this ADR's named trigger first. If the trigger hasn't fired, the addition is premature — cite this document rather than re-debating from scratch.
2. Redis, MinIO, React Flow, Mapbox, LOINC/RxNorm normalization, and medical embeddings are acknowledged as reasonable **future** additions — each has a named, checkable trigger above, not a blanket "not now."
3. The A/B/C triad is now complete:
   - **A** — `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` (naming/layer reframing)
   - **B** — `docs/DISEASE_INTELLIGENCE_DIABETES_SPEC.md` (first disease module spec)
   - **C** — this document (stack decision)
4. **Natural next step (D):** scaffold the Diabetes module boundaries in the repo (`lib/disease-modules/diabetes/` typed stubs per spec B, v0 phase) — light code, no infra, mirrors how `lib/precision-health/` was originally seeded. This is a build step, not a documentation step, and should only proceed if requested.
