# P3 Audit — GP UI brand + VOICE / DrASSIST positioning

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** Surface CANVAS / BRIDGE / CONDUCTOR where clinicians work; frame VOICE & Dr.Assist as intake/coding **sub-capabilities** under the 12-agent directory — not peer 13th/14th agents. Keep draft/HITL/SHIELD honesty · `liveEmis:false`.

## Exit criteria — PASS

| Criterion | Result | Evidence |
|---|---|---|
| GP dashboard shows CANVAS / BRIDGE / CONDUCTOR | **PASS** | `AgentControlPanel` brand strip + dedicated CANVAS / CONDUCTOR / BRIDGE panels (`gp-agent-brand-strip`, `gp-canvas-panel`, `gp-conductor-panel`, `gp-bridge-panel`) |
| VOICE / DrASSIST help text clarifies relationship | **PASS** | VOICE nested under CANVAS (“feeds CANVAS”); Dr.Assist nested under SYNTHESIS as coding support; meta copy in `CLINICAL_AGENT_META` |
| AgentGrid still 12 + Phase 2 | **PASS** | `AGENT_DIRECTORY` unchanged (12 entries); VOICE/DrASSIST **not** added as peers; marketing platform e2e “Twelve agents” heading green |
| Honesty: no “14 live agents”; `liveEmis:false`; HITL | **PASS** | Panel copy + Phase C / route-smoke asserts; staging toasts say BRIDGE · liveEmis:false |
| ORACLE → HORIZON label intact in GP UI | **PASS** | HORIZON card retained; no ORACLE user-facing regression |
| PRISM / ATLAS remain Phase 2 | **PASS** | Directory `live:false` unchanged |

## What shipped

| Area | Change |
|---|---|
| `components/dashboard/AgentControlPanel.tsx` | Brand strip CANVAS/BRIDGE/CONDUCTOR; CANVAS intake panel with VOICE sub-capability; CONDUCTOR link to Orchestrate; Dr.Assist under SYNTHESIS; BRIDGE staging honesty card; Accept toasts “Staged via BRIDGE” |
| `ClinicalOrchestratePanel.tsx` | Title **CONDUCTOR · Orchestrate**; Run CONDUCTOR CTA; BRIDGE staging note; Dr.Assist called optional sub-capability |
| `lib/agents.ts` | VOICE/DrASSIST meta = sub-capabilities; directory comment excludes them as peers |
| `EndToEndPipelineDiagram.tsx` | VOICE feeds CANVAS; Dr.Assist under SYNTHESIS; **BRIDGE · FHIR R4 staging** |
| `SystemSpinePanel.tsx` | Phase C copy: GP CONDUCTOR + CANVAS/BRIDGE labels |
| `docs/BUILD_INSTRUCTIONS_GAP.md` | Layers 5/9/11 → **DONE** (P3 naming) |
| Tests | Phase C + route-smoke assert brand labels, directory excludes VOICE/DrASSIST, no “14 live agents” |

**Not changed (intentionally):** `AGENT_DIRECTORY` membership · PRISM/ATLAS · `liveEmis` · LangGraph · peer promotion of VOICE/DrASSIST.

## Audit gate checklist

- [x] Manual / structural: GP Agent Control — CANVAS / BRIDGE / CONDUCTOR visible
- [x] Manual / structural: VOICE / DrASSIST described as supporting capabilities
- [x] `e2e/marketing.spec.ts` — platform “Twelve agents” section **PASS** 2026-07-21
- [x] `npm run test:clinical-proof` — **PASS** 2026-07-21 (exit 0)
- [x] Honesty: no “14 live agents” claim; `liveEmis:false` on GP surfaces

## Verification evidence

```text
npm run test:clinical-proof → exit 0
  Phase C clinical spine checks passed (... includes AgentControlPanel brand asserts)

npx playwright test e2e/marketing.spec.ts -g "platform page loads with cohesive sections"
  ✓ Marketing smoke › platform page loads with cohesive sections
```

## Consistency audit vs `/how-it-works#pipeline` + `AGENT_DIRECTORY`

| Label | Directory | Pipeline | GP Agent Control |
|---|---|---|---|
| CANVAS | Phase 1 live | LIVE intake card | Intake panel + brand strip |
| BRIDGE | Phase 1 live | LIVE + FHIR staging titled BRIDGE | Staging honesty panel + Accept copy |
| CONDUCTOR | Phase 1 live | Supervisor banner + bottom card | Panel + Orchestrate title |
| VOICE | **Not** in directory | Feeds CANVAS (sub-capability) | Nested under CANVAS |
| Dr.Assist | **Not** in directory | Under SYNTHESIS (sub-capability) | Nested under SYNTHESIS |
| PRISM / ATLAS | Phase 2 `live:false` | PHASE 2 badges | Not claimed live |

## Fail-if checks (none triggered)

- VOICE/DrASSIST not added to `AGENT_DIRECTORY` as live peers
- PRISM/ATLAS not marked live
- ORACLE label not reintroduced in GP Agent Control (HORIZON retained)
- No “14 live agents” marketing claim

## Next

**P4 — Front ↔ back consistency (honesty pass)** — tighten integrations / TrustMarquee / consent / residual copy so marketing and APIs tell the same Capture → Draft → Approve story with `liveEmis:false`.
