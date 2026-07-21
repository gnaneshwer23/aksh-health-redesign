# HOW TO BUILD AKSH HEALTH

**Date:** July 2026  
**Audience:** founders, GPs, and engineers who want a plain-English map of what is real  
**Codebase:** `packages/platform-uk` on `main`  
**Status:** Phased paperwork **P0–P7 PASS** (live EMIS flip still **NO-GO**)

> **Start here if an older “COMPLETE BUILD INSTRUCTIONS” doc told you nothing is connected.**  
> That picture is out of date. Do **not** rebuild from zero with Supabase, LangGraph, or a required direct Anthropic SDK. Keep the working stack and finish what is still external.

Detailed layer table: [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md)  
Phase audits: [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md)

---

## The one sentence

Aksh Health is a **GP-as-valve** clinical assist layer: agents may **draft**, the clinician must **Accept / Edit / Reject**, **SHIELD** records the decision, and nothing writes live to EMIS until partners and a signed go/no-go say so.

---

## Honest picture (July 2026)

### What IS connected

1. **Auth** — Real sign-in / sign-up (NextAuth + Neon), not a Loading-only shell. Roles, onboarding gates, email verification paths exist.
2. **Database** — Neon Postgres (`aksh` schema): users, profiles, onboarding, practices seed, consent grants mirror, **SHIELD** hash-chained audit.
3. **Agents + AI** — Draft agents run via **Vercel AI Gateway** with deterministic fallbacks when the gateway is unavailable. Not “fake UI only.”
4. **CONDUCTOR** — Clinical-spine **orchestrate** (deterministic pipeline). Includes SYNTHESIS → GUARDIAN → HORIZON → **NEXUS** (+ optional coding assist). **Not LangGraph.**
5. **Neo4j** — Live Aura/driver + seed scripts; if credentials are missing, the UI shows an **honest mock** banner (not a silent lie).
6. **HITL + SHIELD** — Accept/Edit/Reject is mandatory on the clinical path; decisions append to Neon SHIELD with a hash chain.
7. **Medplum / BRIDGE** — Staging / dry-run FHIR path wired; `liveEmis: false` everywhere. OAuth may fail until a **real** Medplum Client Secret is set.
8. **GP branding** — CANVAS (intake), BRIDGE (staging FHIR), CONDUCTOR (orchestrate), HORIZON / PATHWAY / COMPASS naming in the product UI.

### What is NOT connected (yet) — and that is intentional

1. **Live EMIS / SystmOne write-back** — Still simulation / staging. Code hard-blocks `liveEmis` flip until signed partner go/no-go.
2. **IM1 / Partner Programme / CIS2 / Mirth** — Organisational and partner work, not a weekend code sprint. Pack is ready; emails/sign-offs are yours.
3. **Medplum live OAuth** — Needs a real Client Application secret; local UUID stubs return `Invalid client`.
4. **Local Deepgram VOICE** — Key may exist on Vercel; locally ASR is often **labelled simulated**.
5. **PRISM / ATLAS** — Phase 2 roadmap agents; do **not** market as live.
6. **MHRA / DCB / DTAC “certified”** — Templates and honesty flags exist; **no invented signatures**.

### Ignore from older docs (unless you are deliberately migrating)

| Older doc said | Reality — do this instead |
|---|---|
| Fix Supabase Loading on `/signin` | Already NextAuth + Neon forms |
| Build 6 Supabase tables + RLS | Already Neon migrations; keep app-layer tenant scoping |
| Wire direct Anthropic SDK | Keep **AI Gateway** + fallbacks |
| Build LangGraph CONDUCTOR | Keep **`lib/clinical-spine/orchestrate.ts`** |
| SHIELD = simple Supabase insert | Keep **hash-chained Neon SHIELD** (stronger) |
| Week 1 rebuild from UI shell | **Wrong baseline** — P0–P7 eng spine is done |

---

## Mental model: the GP is the valve

```text
Capture (CANVAS / VOICE assist)
    → Draft agents (SYNTHESIS, GUARDIAN, HORIZON, NEXUS, PATHWAY, …)
    → CONDUCTOR orchestrates + prioritises (GUARDIAN-first when urgent)
    → Clinician HITL: Accept / Edit / Reject
    → SHIELD audit (hash chain)
    → BRIDGE staging / sim FHIR
    → Live EMIS only after partner go/no-go  ← still closed
```

**Truths that must never be broken**

- **HITL is mandatory** — no autonomous clinical EHR write.
- **SHIELD records the human decision** — drafts alone are not “filed.”
- **GUARDIAN-first when safety is urgent** — interactions and safety routing beat convenience.
- **`liveEmis: false`** until signed go/no-go; marketing must say staging / designed-for, not live write-back.
- **Honesty banners** when Neo4j is mock, Medplum is dry-run, or VOICE is simulated.

---

## The pieces — what they actually are

### 1. Auth (Layer 1) — NextAuth + Neon

People sign in with credentials stored in Neon (`aksh.users`), bcrypt hashes, optional clinical OAuth hooks. Middleware knows role and onboarding completion.  
**Not Supabase Auth.** Do not rip this out.

### 2. Product data (Layer 2–3) — Neon

Onboarding progress, profiles, practices (synthetic ODS seed — not live EMIS practice sync), consent grants (file store + Neon best-effort dual-write).  
**Not a Supabase RLS rewrite.**

### 3. Graph (Layer 4) — Neo4j

Patient / guardian interaction / ICS population routes. Seed script exists. Mock fallback is labelled when live graph is unavailable.

### 4. Intake — CANVAS (+ VOICE sub-capability)

Structured intake / note generation feeds the pipeline. VOICE is dictation assist into CANVAS — **not** a 13th peer agent in the Phase-1 directory.

### 5. Draft agents — AI Gateway

SYNTHESIS, GUARDIAN, HORIZON (was ORACLE), NEXUS, PATHWAY (was REFERRAL), COMPASS (was EQUITY population side), etc. Models go through **Vercel AI Gateway**; if the gateway fails, deterministic fallbacks keep demos and tests honest.  
**Do not require** a direct Anthropic SDK as the platform default.

### 6. CONDUCTOR — clinical-spine orchestrate

One deterministic orchestrator runs the agent sequence, safety-route, review queue, and SHIELD hooks. GP UI calls this **CONDUCTOR**.  
**Do not introduce LangGraph** for certification-path determinism.

### 7. SHIELD — durable audit

Append-only Neon table with previous-event hash chain, integrity checks, and clinical-proof tests that HITL decisions are recorded. This is the compliance spine for “who decided what.”

### 8. BRIDGE — Medplum staging

FHIR staging / EHR write-back **simulation**. Live partner EMR is separate and still off. Without a real Medplum secret, OAuth stays degraded — banners must say so.

### 9. Partner / EMR (Layer 15) — external critical path

EMIS Partner Programme, IM1 feasibility, CIS2, Mirth, DPIA/DPA, named CSO, partner UAT, signed go/no-go. In-repo: readiness APIs, Admin Partner panel, outreach emails.  
**Eng does not flip `liveEmis` because “the code feels ready.”**

---

## Map: already ships vs still external

| Already ships in product / eng | Still external or optional |
|---|---|
| NextAuth + Neon auth & onboarding | Real Medplum Client Secret (staging OAuth) |
| SHIELD hash-chain + HITL invariants | Local Deepgram key for live ASR |
| CONDUCTOR + NEXUS in default path | IM1 email + Partner Programme |
| Neo4j client + honest mock | CIS2 / Mirth / signed DPIA–DPA–CSO |
| Medplum dry-run / BRIDGE sim | Signed EMR go/no-go → eng `liveEmis` checklist |
| P0–P7 paperwork + clinical-proof suite | MHRA / DCB / DTAC funded route (templates only) |
| CANVAS / BRIDGE / CONDUCTOR GP labels | PRISM / ATLAS (Phase 2) |

---

## What to do next (not Week 1 from zero)

Full ordered plan: [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) (phases **N1–N10**).

1. **Read** [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) and **send** the IM1 feasibility email (and progress EMIS Partner Programme) — **N1**.
2. **Obtain** a real **Medplum Client Secret** if you want staging OAuth green (optional for demos; required for serious FHIR rehearsal) — **N2**.
3. **Optionally** copy `DEEPGRAM_API_KEY` into local `.env.local` for live VOICE ASR — **N2**.
4. **Keep** running honesty checks: `npm run test:clinical-proof`, partner readiness `liveEmis === false`.
5. **Do not** start a Supabase / LangGraph rebuild. Fail any plan that proposes it.

When partner artefacts and a signed go/no-go exist, eng follows the controlled `liveEmis` flip checklist (**N7**) — last, not first.

---

## Where to go deeper

| Doc | Use when |
|---|---|
| [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) | **What’s next** after P0–P7 (N1–N10) |
| [`BUILD_INSTRUCTIONS_GAP.md`](./BUILD_INSTRUCTIONS_GAP.md) | Layer-by-layer vs old instructions |
| [`PHASED_BUILD_AND_AUDIT_PLAN.md`](./PHASED_BUILD_AND_AUDIT_PLAN.md) | P0–P7 gates and what “done” means |
| [`PHASED_BUILD_P7_AUDIT.md`](./PHASED_BUILD_P7_AUDIT.md) | Paperwork PASS vs live NO-GO |
| [`P7_PARTNER_OUTREACH_PACK.md`](./P7_PARTNER_OUTREACH_PACK.md) | Emails and external checklist |
| [`CLINICAL_SPINE_PHASE_F.md`](./CLINICAL_SPINE_PHASE_F.md) | Partner readiness APIs / Admin panel |
| [`E2E_CLINICAL_PROOF.md`](./E2E_CLINICAL_PROOF.md) | Proof harness definition of done |

---

*This document replaces the “nothing is wired” narrative for Aksh UK. The product spine is built; the remaining work is secrets, partners, and honest go-live — not a greenfield rebuild.*
