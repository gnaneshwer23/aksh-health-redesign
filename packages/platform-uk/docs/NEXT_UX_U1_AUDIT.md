# U1 Audit — Landing: agents + how they work

**Date:** 2026-07-23  
**Branch:** `main`  
**Scope:** Marketing surfaces for the 12-agent + Capture→Draft→Approve→Stage story  
**Companion:** [`NEXT_UX_STAKEHOLDER_BUILD.md`](./NEXT_UX_STAKEHOLDER_BUILD.md) · [`NEXT_BUILD_N4_AUDIT.md`](./NEXT_BUILD_N4_AUDIT.md)

## Status

| Gate | Result |
|---|---|
| **U1 overall** | **PASS** |
| **2-minute marketing script** | **PASS** — home → `/how-it-works#two-minute-script` → `/platform#agents` → `/demo/script` |
| **Per-agent job-in-loop** | **PASS** — `lib/marketing/agent-job-in-loop.ts` + AgentGrid stage groups |
| **Honesty** | **PASS** — HORIZON (ex-ORACLE); VOICE/Dr.Assist sub-caps; PRISM/ATLAS Phase 2; `liveEmis:false` |
| **Fail conditions avoided** | **PASS** — no “14 agents”, no JSL live, no PRISM/ATLAS live, no live EMR write claims |

## Exit criteria (from plan)

| Criterion | Result | Notes |
|---|---|---|
| Manual 2-minute script from home → how-it-works → platform without opening a dashboard | **PASS** | Script section on `/how-it-works`; agent chips on home; job blurbs on `/platform` |
| Marketing e2e still green | **PASS** | Honesty + section assertions extended |
| No honesty regressions | **PASS** | N4 locks retained; sub-cap callout band; Formerly ORACLE on HORIZON |

## What shipped

| Surface | Change |
|---|---|
| `lib/marketing/agent-job-in-loop.ts` | Job-in-loop blurbs, sub-caps, `TWO_MINUTE_MARKETING_SCRIPT` |
| `components/marketing/AgentGrid.tsx` | Stage-grouped cards with job blurbs; sub-cap band; demo script CTA |
| `components/marketing/platform-page-content.tsx` | Capture→Draft→Approve→Stage layers naming agents; `/demo/script` CTAs |
| `components/marketing/HowItWorksPageContent.tsx` | Two-minute script; agents-named-in-loop; agent-named stage copy |
| `components/marketing/PlatformFlowSection.tsx` | Home agent chips + platform / demo script links |
| `app/how-it-works/page.tsx` | Hero/CTA wired to script + `/demo/script` |
| `e2e/marketing.spec.ts` | Assertions for script, HORIZON rename, sub-caps, demo links |

## Manual 2-minute script (demo host)

1. **`/`** — Capture → draft → approve; agent chips (CANVAS…SHIELD); liveEmis:false.  
2. **`/how-it-works#two-minute-script`** — Read the four beats aloud.  
3. **`/how-it-works#pipeline`** — Point at CONDUCTOR → HITL → BRIDGE staging.  
4. **`/platform#agents`** — Job-in-loop per agent; Phase 2 badges on PRISM/ATLAS; VOICE/Dr.Assist under CANVAS/SYNTHESIS.  
5. **`/demo/script`** — Optional rehearse without claiming live EHR.

## Honesty invariants held

- `AGENT_DIRECTORY` still 12 peers · VOICE/DrASSIST excluded  
- HORIZON labelled (formerly ORACLE) — not ORACLE as peer name  
- PRISM / ATLAS `live:false` · Phase 2 badges  
- John Snow Labs NLP **not wired**  
- `liveEmis:false` in hero/CTA/HITL copy  
- No “14 agents” language  

## Tests run

```text
npx playwright test e2e/marketing.spec.ts \
  --grep "homepage shows platform flow|how-it-works page loads|platform page loads|platform agent grid"
```

(Full marketing suite recommended before demo day.)

## Next

**U2** — Audience `for-*` pages agent-mapped (which agents help **me**, what do I approve?).

Do **not** start U3 until U2 exit criteria pass.
