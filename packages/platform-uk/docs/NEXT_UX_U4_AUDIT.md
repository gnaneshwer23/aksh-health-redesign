# U4 Audit — GP dashboard demo polish

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Hero clinical demo on GP dashboard — Agent Control ↔ U1 copy; first-run → review → Accept → export/sim  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_UX_U3_AUDIT.md`](./NEXT_UX_U3_AUDIT.md) · [`DEMO_LAUNCH_D1_AUDIT.md`](./DEMO_LAUNCH_D1_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U4 overall** | **PASS** |
| **Agent Control ↔ U1 copy** | **PASS** — `AGENT_JOB_IN_LOOP` + sub-caps on CANVAS / BRIDGE / CONDUCTOR / HORIZON / SYNTHESIS / PATHWAY |
| **One-click hero path** | **PASS** — `GpHeroDemoPath` + first-run CTAs → queue → pilot Accept → Bundle export |
| **Honesty** | **PASS** — DemoDataBanner · Neo4j mock · `liveEmis:false` · no “written to record” overclaim |
| **Fail conditions avoided** | **PASS** — no `liveEmis` flip · no PRISM/ATLAS live · VOICE/Dr.Assist remain sub-caps |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| `/demo/script` + GP path rehearsable in &lt;10 minutes | **PASS** | Hero strip on GP + review queue; demo script GP panel + `00:30` stop |
| Existing GP smoke / e2e green | **PASS** | U4 unit + route-smoke assertions; clinical-proof suite green |

## What shipped

| Surface | Change |
|---|---|
| `lib/marketing/agent-job-in-loop.ts` | (unchanged source) Agent Control now imports job blurbs + sub-cap copy |
| `components/dashboard/AgentControlPanel.tsx` | U1-aligned blurbs; HORIZON panel id; BRIDGE CTAs to queue + FHIR export |
| `components/dashboard/GpHeroDemoPath.tsx` | **New** — Review → Accept → Export beats + `/demo/script` |
| `app/dashboard/gp/page.tsx` | Hero path under DemoDataBanner / Neo4j honesty |
| `app/dashboard/gp/review-queue/page.tsx` | Hero path + DemoDataBanner for public demo |
| `components/dashboard/ReviewQueue.tsx` | Accept / Export CTAs + BRIDGE honesty line |
| `components/dashboard/ReviewQueueItem.tsx` | Accept toast: staged via BRIDGE · `liveEmis:false` |
| `lib/product-journey.ts` | GP first-run → review queue + `/demo/script`; CANVAS/CONDUCTOR agents |
| `components/demo/DemoLaunchScript.tsx` | GP hero panel + `00:30` stop + quick links |
| `components/dashboard/DemoDataBanner.tsx` | Explicit `liveEmis:false` + demo script link |
| `tests/next-ux-u4.test.ts` | U4 matrix assertions |

## Manual verify (&lt;10 min GP hero)

1. Open `/demo/script` — use **GP hero path** panel (or stop `00:30`).  
2. `/dashboard/gp` — see DemoDataBanner (if public) / Neo4j honesty + `gp-hero-demo-path`.  
3. Agent Control: CANVAS / BRIDGE / CONDUCTOR / HORIZON; VOICE + Dr.Assist labelled sub-caps with U1 jobs.  
4. Click beat **1 · Review queue** → `/dashboard/gp/review-queue`.  
5. Beat **2 · Accept** → `/review/pilot?demo=1` — Accept one case (HITL + SHIELD + BRIDGE).  
6. Beat **3 · Export** → `/cases/case-005/evidence?demo=1` — Download FHIR Bundle (handoff · `liveEmis:false`).  
7. Confirm no live EMIS / “connected to the GP record” language.

## Honesty invariants held

- `liveEmis:false` on Agent Control, hero path, first-run, review queue, demo script, DemoDataBanner  
- VOICE / Dr.Assist = sub-caps (not peer directory agents)  
- HORIZON (ex-ORACLE) naming  
- DemoDataBanner + Neo4jMockModeBanner retained on GP home  
- Accept copy: BRIDGE staging / sim — not “written to live record”

## Tests run

```text
npx tsx tests/next-ux-u4.test.ts
npx tsx tests/onboarding-role-paths.test.ts
tsc -p tsconfig.tests.json && node .tmp-tests/tests/route-smoke.test.js
npm run test:clinical-proof
```

## Next

**U5** — Nurse + pharmacist dashboards (3-beat nurse demo; pharmacist med-safety HITL path).

Do **not** start U5 until this audit stays PASS on `main`.
