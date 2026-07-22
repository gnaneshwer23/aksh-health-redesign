# N4 Audit — Sub-capability honesty + DrASSIST / coding assist clarity

**Date:** 2026-07-22  
**Branch:** `main`  
**Scope:** Lock VOICE / DrASSIST(/JSL) as **sub-capabilities**; keep PRISM / ATLAS Phase 2 / `live:false`; no peer 13th/14th agents; `liveEmis:false` hard.

## Status

| Gate | Result |
|---|---|
| **N4 overall** | **PASS** |
| **Roster honesty (VOICE / Dr.Assist)** | **PASS** — framed as CANVAS / SYNTHESIS sub-capabilities |
| **JSL NLP** | **PASS** — explicitly **Phase 2 / not wired** (no live product claim) |
| **PRISM / ATLAS** | **PASS** — `AGENT_DIRECTORY` `phase:2, live:false`; marketing Phase 2 badges |
| **12-agent Phase-1 story** | **PASS** — AgentGrid + resources + e2e |
| **`liveEmis`** | **`false`** (unchanged; do not flip) |

## Exit criteria (from [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) N4)

| Criterion | Result | Notes |
|---|---|---|
| Roster honesty matches agent table (VOICE/DrASSIST sub-caps; PRISM/ATLAS Phase 2) | **PASS** | Directory + GP/marketing/docs aligned |
| Marketing E2E still asserts 12-agent Phase-1 story | **PASS** | `e2e/marketing.spec.ts` roster tests green 2026-07-22 |
| Manual: VOICE / DrASSIST = sub-capability; PRISM/ATLAS = Phase 2 / not live | **PASS** | Agent Control, AgentGrid, how-it-works pipeline, resources |
| Fail if PRISM/ATLAS marked live | **PASS** | `live:false` unchanged |
| Fail if VOICE/DrASSIST added as peer Phase-1 agents | **PASS** | Still excluded from `AGENT_DIRECTORY` |
| Fail if JSL claimed as integrated product | **PASS** | Copy + roadmap: **not wired** |

## Audit gate N4

- [x] `e2e/marketing.spec.ts` green (12-agent honesty) — resources + platform AgentGrid assertions
- [x] Manual / structural: VOICE / DrASSIST copy = sub-capability; PRISM/ATLAS = Phase 2 / not live
- [x] `npm run test:clinical-proof` exit 0 — **PASS** 2026-07-22
- [x] Phase C + route-smoke roster locks (no VOICE/DrASSIST in directory; no “Seven agents”; JSL not wired)

## Residual overclaims fixed this pass

| Surface | Before | After |
|---|---|---|
| `app/resources/page.tsx` | “Seven agents: VOICE, SYNTHESIS, Dr.Assist…” | Twelve Phase-1 directory agents; VOICE/Dr.Assist sub-caps; JSL not wired |
| `components/gp/voice-mic-panel.tsx` | “feeds VOICE agent” | Feeds CANVAS · sub-capability |
| `components/onboarding/PreferencesPanel.tsx` | “VOICE agent” | “VOICE dictation (CANVAS sub-capability)” |
| `components/marketing/AgentGrid.tsx` | PRISM/ATLAS roadmap only | + VOICE/Dr.Assist not peer 13th/14th |
| `components/dashboard/AgentControlPanel.tsx` | Coding sub-cap copy | + JSL **not wired** |
| `lib/agents.ts` `CLINICAL_AGENT_META.DrASSIST` | Peer exclusion only | + JSL path not wired |
| `lib/roadmap.ts` M3 / budget | JSL listed as partial license | Honest: JSL microservice **not wired** |
| `docs/HOW_TO_BUILD_AKSH_HEALTH.md` · `BUILD_INSTRUCTIONS_GAP.md` · flowchart gap | Thin / legacy seven-agent language | Sub-cap + JSL not wired locked |
| `lib/chat/knowledge.ts` · pipeline diagram | Partial | JSL not wired; PRISM/ATLAS not built |

**Intentionally unchanged:** `AGENT_DIRECTORY` membership (12 entries) · `liveEmis:false` · no LangGraph · no peer promotion of VOICE/DrASSIST · no coding-depth expansion (honesty pass only).

## Tests run (2026-07-22)

```text
npm run test:clinical-proof          → exit 0
npx tsx tests/clinical-spine-phase-c.test.ts → Phase C OK
npx tsx tests/route-smoke.test.ts    → Route and UI smoke OK
npx playwright test e2e/marketing.spec.ts \
  --grep "resources page keeps 12-agent|platform agent grid keeps Phase-2|platform page loads"
  → 3 passed
```

## Consistency vs roster table

| Name | Claim | Evidence |
|---|---|---|
| Phase-1 12 | Live drafts + HITL | `AGENT_DIRECTORY` · AgentGrid “Twelve agents” |
| VOICE | Sub-capability → CANVAS | GP panel · voice-mic · pipeline feed box |
| DrASSIST / JSL | Coding sub-cap · JSL not wired | Agent Control · meta · roadmap · chat knowledge |
| PRISM | Phase 2 · not live | `live:false` · PHASE 2 badge |
| ATLAS | Phase 2 · not live | `live:false` · PHASE 2 — Roadmap badge |

## Next recommendation

- **N3** when Medplum OAuth is green (real Client Secret) — BRIDGE staging rehearsal.
- Else **N5** when Partner sandbox credentials exist — flagged wire, still `liveEmis:false`.
- Do **not** start N7 / `liveEmis` flip; do **not** pull N8/N9 (PRISM/ATLAS) without product decision.
