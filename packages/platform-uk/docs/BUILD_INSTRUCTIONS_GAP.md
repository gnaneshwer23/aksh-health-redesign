# Build Instructions Gap Audit — Layers 1–15 vs Live Codebase

**Date:** July 2026
**Source doc:** "AKSH HEALTH — COMPLETE BUILD INSTRUCTIONS" (July 2026)
**Audited against:** `packages/platform-uk` on `main` (post Clinical Spine Phase F)

## Headline

The build-instructions doc assumes the platform is a UI shell with no auth, no backend, no
agents. That is out of date. Layers 1–11 and 14 are already live in some form — often beyond
the doc's spec (hash-chained durable audit, HITL invariant tests, tenant isolation, Medplum
dry-run). The doc's stack choices (Supabase, direct Anthropic SDK, LangGraph) conflict with
the working stack (NextAuth + Neon Postgres, Vercel AI Gateway, deterministic orchestrate).
**We keep the working stack and implement gaps only.**

## Layer-by-layer status

| Layer | Doc says build | Current state | Status | Adaptation |
|---|---|---|---|---|
| 1 — Auth | Supabase auth, fix `/signin` `/signup` "Loading…" | NextAuth (credentials + optional clinical OAuth), bcrypt users in Neon (`aksh.users`), email verification, password reset, role/onboarding-aware middleware. `/signin` and `/signup` render server-side skeleton + real client form (no Loading-only screen). | **DONE** | Do **not** switch to Supabase. Keep NextAuth + Neon. |
| 2 — DB schema | 6 Supabase tables + RLS | Neon migrations 001–010: users, profiles, onboarding, pilot apps, tokens, SHIELD, learning_events, **practices** (synthetic ODS seed), **consent_grants** (durable mirror). File store remains consent SoT; Neon best-effort dual-write. | **DONE** (P1) | Applied on target Neon 2026-07-21. No Supabase / RLS rewrite. |
| 3 — Onboarding → DB | Supabase upsert per step | `aksh.onboarding_progress` synced per step via `/api/onboarding`; middleware gates dashboards on `onboardingComplete`. | **DONE** | None. |
| 4 — Neo4j graph | AuraDB client, seed, 2 routes | `lib/neo4j` driver + queries, `scripts/seed-neo4j.ts`, `/api/neo4j/{patient,guardian,ics-population,health}`, honest mock-fallback banner, live smoke. | **DONE** | `/api/neo4j/patient` serves the doc's "horizon" route role. |
| 5 — CANVAS (intake) | Mock-data fetch helper | `lib/intake-generation.ts` + orchestration shared patient context; **CANVAS** labelled in GP Agent Control + pipeline. VOICE is a dictation sub-capability feeding CANVAS (not a peer directory agent). | **DONE** (P3 naming) | Keep sub-capability framing; do not add VOICE to `AGENT_DIRECTORY`. |
| 6 — SYNTHESIS | Direct Anthropic SDK | `lib/agents/llm-synthesis.ts` via **Vercel AI Gateway** with deterministic fallback; `/api/agents/synthesis`. | **DONE** | Keep AI Gateway; do not add direct Anthropic SDK. |
| 7 — GUARDIAN | Neo4j interactions + Claude | `lib/agents/llm-guardian.ts` + `/api/neo4j/guardian` (INTERACTS_WITH graph) + `/api/agents/guardian`. | **DONE** | None. |
| 8 — HORIZON (risk) | Neo4j + Claude factors | Live as **ORACLE**: `lib/agents/llm-oracle.ts`, model card, 14-day admission risk. | **DONE** (naming) | Rename user-facing labels ORACLE → **HORIZON** (Oracle Corp trademark). Keep internal ids/env aliases for API/test compat. |
| 9 — CONDUCTOR | LangGraph pipeline | `lib/clinical-spine/orchestrate.ts` + `lib/clinical-proof/agent-orchestration.ts`: SYNTHESIS → GUARDIAN → ORACLE/NEXUS (+ optional DrASSIST coding sub-capability), safety-route, queue priority, SHIELD. GP UI labels Orchestrate as **CONDUCTOR**. Deterministic, tested, honest flags. | **DONE** (P3 naming) | Do **not** introduce LangGraph. |
| 10 — SHIELD | Supabase insert-only table | Append-only `aksh.shield_audit_events` with prev-event hash chain, integrity CLI, clinical-proof HITL chain tests. Exceeds doc spec. | **DONE** | None. |
| 11 — BRIDGE (FHIR) | Medplum staging | `lib/medplum-client.ts`, staged-FHIR + EHR write-back simulation, Medplum rehearsal smoke, `liveEmis:false` everywhere. GP Agent Control + pipeline label staging as **BRIDGE**. | **DONE** (dry-run; P3 naming) | Live Medplum writes blocked on `MEDPLUM_CLIENT_ID/SECRET`. |
| 12 — PATHWAY (referrals) | Claude referral drafts | Live as **REFERRAL**: `lib/referral-agent.ts` + `/api/agents/referral`, ServiceRequest drafts after Accept. | **DONE** (naming) | Rename labels REFERRAL → **PATHWAY**. |
| 13 — NEXUS (clinical intelligence) | Claude correlation agent | `lib/agents/llm-nexus.ts` · `/api/agents/nexus` · **in default CONDUCTOR** (`agent-orchestration` + clinical-spine orchestrate). Draft-only + HITL + SHIELD. | **DONE** (P2) | Keep draft-only; do not claim live EMR write. |
| 14 — COMPASS (population) | Neo4j aggregate route | Live as **EQUITY** + `/api/neo4j/ics-population` (risk distribution, IMD) feeding ICS dashboard. | **DONE** (naming) | Rename labels EQUITY → **COMPASS**. |
| 15 — EHR (EMIS/SystmOne) | Separate 3-week sprint | EMIS staging simulation only; `liveEmis:false`, `autoRetrain:false`. | **DEFERRED** (correct) | Stays deferred. Requires EMIS Partner Programme + CIS2 + Mirth on-prem. Never claim live. |

## Stack conflicts — decisions

| Doc assumes | Reality | Decision |
|---|---|---|
| Supabase auth + Postgres + RLS | NextAuth + Neon Postgres (`aksh` schema), tenant scoping in app layer | Keep NextAuth/Neon. Supabase would be a rip-and-replace of working, tested auth for zero product gain. |
| Direct `@anthropic-ai/sdk` | Vercel AI Gateway (`ai` SDK, `openai/gpt-5.4-mini` models) with deterministic fallbacks | Keep AI Gateway — one key, evals + fallbacks already wired. |
| LangGraph CONDUCTOR | Deterministic Phase-C orchestrate with safety routing + tests | Keep orchestrate; name it CONDUCTOR. LangGraph adds deps and non-determinism to a certified-path pipeline. |
| Supabase `audit_events` | Hash-chained append-only Neon SHIELD trail | Keep Neon SHIELD (stronger than doc spec). |
| `src/app/` paths | `app/` at package root | Use existing paths. |

## Naming migration (per Agent Naming Reference, 12 agents)

ORACLE→**HORIZON**, EQUITY→**COMPASS**, REFERRAL→**PATHWAY** (renames);
**CANVAS**, **BRIDGE**, **NEXUS**, **CONDUCTOR** (newly named existing capabilities);
**PRISM**, **ATLAS** (Phase 2 roadmap — not built, do not fake);
SYNTHESIS, GUARDIAN, SHIELD unchanged.

Rename scope this session: user-facing labels (dashboards, marketing, onboarding, resources).
Internal ids, env vars (`ENABLE_LLM_ORACLE`), API field names (`oracleScore`) keep working as
aliases so existing API consumers and the clinical-proof suite stay stable.

## Next: phased build (remaining only)

See [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) — P0–P7 with audit gates.
Do **not** rebuild DONE layers; product spine → agents → front/back → partner/EHR last.

## Gaps executed this session

1. `docs/BUILD_INSTRUCTIONS_GAP.md` (this file).
2. Label renames ORACLE→HORIZON, EQUITY→COMPASS, REFERRAL→PATHWAY across UI surfaces, with alias resolution in `lib/agents.ts`.
3. Canonical 12-agent registry (`AGENT_DIRECTORY`) in `lib/agents.ts`.
4. **NEXUS** clinical intelligence agent: `lib/agents/llm-nexus.ts` + `POST /api/agents/nexus` (AI Gateway + deterministic fallback, draft-only, SHIELD-audited).
5. Neon migrations `009_practices.sql` (ODS lookup, seeded) and `010_consent_grants.sql` + best-effort durable mirror of consent grants — **DONE (P1)**; re-apply with `npm run db:migrate:p1`.

## Blocked on secrets / user decisions

- `MEDPLUM_CLIENT_ID` / **real** `MEDPLUM_CLIENT_SECRET` — local UUIDs return Medplum OAuth `Invalid client` (P5 degraded rehearsal). Layer 11 stays dry-run / flag-gated until a real Client Application secret works. See [`PHASED_BUILD_P5_AUDIT.md`](./PHASED_BUILD_P5_AUDIT.md).
- `DEEPGRAM_API_KEY` — on Vercel Preview/Production; missing locally → labelled simulated ASR (P5). Copy into `.env.local` for local live VOICE.
- Layer 15 — EMIS Partner Programme approval, NHS CIS2, Mirth Connect (organisational, not code).
- No Supabase or Anthropic keys needed — stack decision above removes both dependencies.
