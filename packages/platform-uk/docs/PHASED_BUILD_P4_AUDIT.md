# P4 Audit — Front ↔ back consistency (honesty pass)

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** Marketing, integrations, onboarding consent, product/compliance labels, chat grounding — aligned with API honesty (`liveEmis:false`, HITL, staging/sim, no fake MHRA/DCB certs).

## Exit criteria — PASS

| Criterion | Result | Evidence |
|---|---|---|
| Spot audit `/integrations`, `/how-it-works`, `/platform`, GP + Admin PH | **PASS** | Staging / designed-for language; pipeline HITL before staging; TrustMarquee “Designed for EMIS Web & SystmOne”; Partner panel unsigned / `certified:false` |
| No “SystmOne ready” / “live EMR pull” / signed DCB language | **PASS** | Grep clean on user-facing surfaces; ConsentForm DCB = rehearsal; DSPT checkbox not a submission claim |
| No invented cert badges on UK pages | **PASS** | `COMPLIANCE_BADGES` UK-only pathways (no HIPAA/ABDM); security “Honest limits” unchanged |
| Partner readiness `liveEmis:false` | **PASS** | `buildPartnerReadinessPack().honesty.liveEmis === false`; Phase F tests green |
| Partner gates reject `certified:true` | **PASS** | Existing Phase F / route contract (unchanged) |
| `npm run test:clinical-proof` | **PASS** | Exit 0 (2026-07-21) |
| `e2e/marketing.spec.ts` | **PASS** | 35 passed (2026-07-21) |

## What shipped

| Area | Change |
|---|---|
| `app/security/page.tsx` | “connected practices” → staging / adapter readiness |
| `app/integrations/page.tsx` | Metadata + subline + compliance note: `liveEmis:false` / staging-sim only |
| `lib/compliance-labels.ts` | Removed HIPAA/ABDM; UK GDPR, DSPT pathway, residency, FHIR staging, clinical safety, ISO pathway |
| `components/product/product-landing.tsx` | “NHS-ready” / “MHRA-aware” pills → Built for NHS / FHIR staging / HITL; no “ready for live integration” |
| `components/marketing/platform-page-content.tsx` | Capture layer + CTA: staging honesty, no live pull |
| `app/page.tsx` · `app/platform/page.tsx` · `app/contact/page.tsx` · audience metadata | Softened “FHIR R4 ready” / DCB “in progress” overclaims |
| `components/onboarding/ConsentForm.tsx` | DCB = rehearsal (not signed case); DSPT = obligations not submission; EMIS staging · liveEmis:false |
| `components/marketing/TrustMarquee.tsx` | “EMIS Web & SystmOne ready” → “Designed for EMIS Web & SystmOne” |
| `components/marketing/HowItWorksPageContent.tsx` | Capture/approve: staging · no live pull · liveEmis:false |
| `components/marketing/AgentGrid.tsx` | Twelve agents from `AGENT_DIRECTORY`; DCB rehearsal wording |
| `SafetyRouteCoachingGate` / `ScenarioRankingPanel` | User-facing ORACLE → HORIZON |
| `lib/chat/knowledge.ts` | HORIZON/PATHWAY/COMPASS; CONDUCTOR ≠ LangGraph; VOICE/DrASSIST sub-caps; liveEmis:false |
| `components/marketing/Navbar.tsx` | Unique mega-menu destinations (`#pipeline` vs `#journey`) |
| `components/marketing/Footer.tsx` | Restored “See demo” → `/demo/patel` |
| `e2e/marketing.spec.ts` | Trust/marquee + Twelve agents + exact heading matchers |

**Intentionally unchanged:** Internal API ids (`ORACLE`, `ENABLE_LLM_ORACLE`, `oracleScore`); PartnerReadinessPanel / Neo4j mock / Medplum dry-run banners; `liveEmis` hard-false.

## Manual UI honesty checklist

1. Trust strip / marquee: “Designed for” not “ready” for EMIS/SystmOne — **PASS**
2. Pipeline: HITL before staging language — **PASS** (`HowItWorksPageContent` / `EndToEndPipelineDiagram`)
3. Integrations: staging / sim; `liveEmis:false` visible — **PASS**
4. Consent: rehearsal / staging — not signed DCB0129 — **PASS**
5. Neo4j: mock banner when not live — **PASS** (prior; unchanged)
6. Medplum: dry-run when unset — **PASS** (clinical-proof Medplum + SystemSpinePanel)
7. Partner panel: unsigned / needs_partner — never certified unlock — **PASS**

## Fail-if checks (none triggered)

- No “SystmOne ready” / “live EMR pull” reintroduced
- Partner gates still reject `certified:true`
- No HIPAA/ABDM leakage on UK compliance ack surface
- No LangGraph marketing claim; ORACLE user-facing remains HORIZON via labels

## Verification evidence

```text
npm run test:clinical-proof → exit 0
  (incl. Phase F · orchestration · nexus · Medplum dry-run)

buildPartnerReadinessPack().honesty →
  liveEmis:false · autoRetrain:false · signedDcb0129:false · signedMhra:false · hitlRequired:true

npx playwright test e2e/marketing.spec.ts → 35 passed (exit 0)
```

## Next

**P5 — Staging hardening: Medplum + Deepgram (secrets-gated)** — user supplies `MEDPLUM_CLIENT_ID` / `MEDPLUM_CLIENT_SECRET` and Deepgram key; eng verifies smokes and honest simulated fallbacks. Still `liveEmis:false`.
