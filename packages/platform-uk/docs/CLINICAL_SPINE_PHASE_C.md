# Clinical spine — Phase C

**Status:** Shipped in-repo (synthetic / HITL drafts)  
**Honesty:** `liveEmis: false` · `autoRetrain: false` · `physiologicalTwin: false` · `ehrWrite: false`

## Goal

Intelligence on the **same spine**: agents + twin ranking + coaching invoked from **clinical / patient flows**, not only the whole-loop demo.

## Checklist

- [x] GP patient + review queue: **Orchestrate** (SYNTHESIS → GUARDIAN → ORACLE)
- [x] Results on patient page; GUARDIAN first when urgent; all drafts HITL
- [x] Twin scenario ranking after ORACLE (`simulationMode: synthetic_rules`; HITL before plan promotion)
- [x] Safety route → coaching: low-risk branch on patient companion; clinical / urgent stay clinician-side
- [x] Causal hypothesis panel on clinician UI (GP + hospital)
- [x] ORACLE / risk-state model card visible (clinical owner may remain UNASSIGNED)
- [x] Tests: `tests/clinical-spine-phase-c.test.ts` in `npm run test:clinical-proof`
- [ ] Named clinical owner for ORACLE (external — CSO)
- [ ] Partner DPIA / live modality / EMIS write-back (parallel track — not this phase)

## APIs

| Endpoint | Role |
|----------|------|
| `GET/POST /api/agents/orchestrate` | Clinical-spine multi-agent run + twin ranking + safety route |
| `GET /api/patients/[id]/safety-route` | Companion coaching gate |
| Existing `/api/agents/oracle`, twin simulate, causal | Unchanged honesty flags |

## How to verify

```bash
cd packages/platform-uk
npx tsx tests/clinical-spine-phase-c.test.ts
npm run test:clinical-proof
```

Manual UI:

1. GP → patient detail → **Orchestrate** → review drafts in `reviewOrder` (GUARDIAN first if Urgent) → Accept/Reject (SHIELD only).
2. Confirm twin ranking seeds after Orchestrate (`synthetic_rules` · physiologicalTwin: false).
3. Patient companion → Health → safety route banner; coaching only when `low_risk_coaching`.
4. ORACLE panel / risk-state shows model card (owner UNASSIGNED OK).

## Phase D next

Stakeholders + delivery on the same events — see `docs/CLINICAL_SPINE_PHASE_D.md`. Partner DPIA / live modality / EMIS remain a **parallel** track — still `liveEmis: false` until signed.
