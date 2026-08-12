# Aksh Health — Clinical Activity End-to-End Results

**Product framing:** Diabetes clinic / primary-care diabetes care coordination (not an NHS product claim).  
**Date:** 2026-08-12  
**Package:** `packages/platform-uk`  
**Base commit (pre go-live):** `ec14f9d` + working-tree Nightingale/UI/Ask Aksh/P0–P2 + HbA1c DETECT fix  
**Correlation ID:** `aksh-master-20260812-3189b586`  
**Golden patient:** **P002 Mr James Patel** (progressive T2D; CKD/eGFR context in sims)  
**Machine-readable:** `docs/e2e/AKSH-E2E-RESULTS.json`  
**Master trace:** `docs/reports/E2E_MASTER_JOURNEY_20260812.md`

Frozen loop under test:

```
CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
PATIENT STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING
```

---

## Verdict

**Yes — Aksh executes a realistic synthetic diabetes clinical loop end-to-end under honesty class `SIMULATED END-TO-END` / engineering `INTERNAL TEST READY`.**

- **Master Journey `AKSH-E2E-MASTER-001`:** **PASS 25/25** (one `correlationId`, canonical identity P002).
- **Not claimed:** clinically validated · autonomous care ready · live EMR/EPS/lab · MHRA/CQC.
- **Ideal script first break (live VOICE → live EHR → live prescribing):** **FAIL / NOT IMPLEMENTED** as connected live actors — kept separate from Master PASS.
- **P0 identity/safety:** none open for Track A after this run. **P1 DETECT integrity** (duplicate HbA1c timestamps → false `stable`) **fixed and re-verified**.

---

## Environment

| Item | Value |
| --- | --- |
| App | Aksh Health UK platform |
| Prod probe | https://akshhealth.com/api/health — Postgres **live**, Neo4j **live** (connected) |
| Seed | `20260812` · source `AKSH_E2E_TEST` · synthetic |
| Scale executed | **100** patients (generator); brief asked 120 — shortfall documented |
| HITL | mandatory · `autoRetrain:false` · `ehrWrite:false` · `liveEmis:false` |

---

## Master Journey (connected)

| # | Id | Layer | Class | Status |
| --- | --- | --- | --- | --- |
| 1–25 | MJ-01 … MJ-25 | CONNECT→LEARN + provenance | LIVE / PARTIAL / SIMULATED / CONTRACT | **PASS** |

Highlights: identity P002 (+ alias E2P021) · HbA1c 6.8→8.4 · CONDUCTOR Urgent · SYNTHESIS/GUARDIAN/ORACLE/NEXUS · HITL Accept · health-plan · outcomes/learning · SHIELD scope · **SIMULATED** lab delay/complete · **SIMULATED** pharmacy→care-team · nurse follow-up sim · no autonomous ACT.

`connectedResult` for Master = **PASS**. Downstream isolated goldens were not substituted for Master.

---

## Capability classification (diabetes-focused)

| Capability | Classification | Notes |
| --- | --- | --- |
| Patient identity (P002 unify) | **LIVE** | P1-ID-001 resolved |
| Consent (onboarding grants) | **PARTIAL** | Mid-journey revoke not Master-wired |
| Appointments / no-show | **NOT IMPLEMENTED** | Connected FAIL for ideal script |
| VOICE live mic capture | **NOT IMPLEMENTED** | Sub-capability; deterministic docs path used |
| SYNTHESIS / CONDUCTOR / NEXUS | **LIVE** (deterministic in Master) | LLM flag-gated; Master disables LLM |
| Patient State facts | **LIVE** (Neon) | Append-only |
| Lab order/result actors | **SIMULATED** | `liveNhsLab:false` |
| Change detection / HbA1c trend | **LIVE** | Dedupe fix this run |
| Diabetes module signals | **LIVE** (rules) | Flag-gated; coaching explanatory-only |
| CGM device adapter | **NOT IMPLEMENTED** | Golden CGM hypo **SIMULATED** |
| ORACLE/HORIZON risk | **LIVE** (rules/LLM optional) | |
| GUARDIAN med safety | **LIVE** | Allergy/DDI paths in goldens |
| SHIELD audit | **LIVE** | Failures surface (not silent) |
| HITL Decide Accept/Edit/Reject | **LIVE** | |
| Prescription / EPS | **NOT IMPLEMENTED** | Pharmacy **SIMULATED** |
| PATHWAY/REFERRAL | **PARTIAL** | Draft/coordination; not live specialist EHR |
| EQUITY/COMPASS barriers | **PARTIAL** | |
| Digital twin | **LIVE** (synthetic_rules) | Honesty gate blocks physiological claim |
| Learning events | **LIVE** | `autoRetrain:false` |
| Neo4j graph | **LIVE** in prod probe | May mock if disconnected |
| EMIS / Medplum live write | **NOT IMPLEMENTED** | `liveEmis:false` |
| Heart module | **STUB** | Types only |
| PRISM / ATLAS | **NOT IMPLEMENTED** | Phase 2 `live:false` |
| RBAC enforce in prod | **PARTIAL** | `productionRbacEnforced:false` |

Named agents preserved: VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE/HORIZON, REFERRAL/PATHWAY, EQUITY/COMPASS, SHIELD, CONDUCTOR, CANVAS, BRIDGE, NEXUS (+ PRISM/ATLAS phase 2).

---

## Bugs found / fixed this run

### P0 — identity / safety / security / integrity

_None open_ for synthetic Track A.

### P1 — fixed

- **P1-DETECT-HBA1C-DUP** — Re-ingesting golden HbA1c series for P002 created duplicate same-`recordedAt` points; two-point trend collapsed to false **`stable`** and decision snapshots drifted toward `routine_coaching`.  
  **Fix:** dedupe by `recordedAt` in `lib/disease-modules/diabetes/hba1c.ts` and ingest loader.  
  **Proof:** `tests/diabetes-hba1c-dedupe.test.ts` PASS; `clinical-spine-diabetes` with Neon PASS (worsening retained); Master re-run PASS 25/25.

### P2 — open / documented

- Live VOICE, appointments/no-show, live CGM, live EMR/EPS, 120-patient scale (100 max honest).
- `productionRbacEnforced:false`; dedicated prompt-injection red-team pack incomplete (tenant deny + Ask Aksh scoping PASS).

### P3

- Preference-conflict scenario not Master-wired (HITL reject covers related safety).

---

## Scale

| Requested | Executed | Note |
| --- | --- | --- |
| 120 patients × org matrix | **100** | Generator + Patient State scale assertions; do not invent 120 PASS |

---

## Explicit answers (11)

1. **Can a synthetic patient complete the full Aksh clinical loop without manual DB manipulation?**  
   **Yes** — Master Journey PASS 25/25 for P002 under one correlationId (lab/pharmacy SIMULATED; no live EMR write).

2. **What is genuinely LIVE?**  
   Neon Patient State / learning / SHIELD dual-write path · deterministic CONDUCTOR + decision/HITL · diabetes rules signals · prod Postgres + Neo4j (probe) · identity unification.

3. **What is SIMULATED?**  
   Lab stakeholder delay/complete · pharmacy→care-team · nurse directory follow-up · CGM hypo golden · EHR write-back honesty (`ehrWrite:false`).

4. **What is STUB / BROKEN / NOT IMPLEMENTED?**  
   Heart **STUB** · PRISM/ATLAS **NOT IMPLEMENTED** · live VOICE / live CGM adapter / appointments-no-show / live EMIS-EPS-lab **NOT IMPLEMENTED**. Nothing critical in the synthetic HITL loop marked **BROKEN** after the HbA1c fix.

5. **Where does the connected chain first break?**  
   Against the **ideal live** script: first at **live VOICE / live EHR write** (then live prescribing). Against **implemented Master Journey:** **does not break** (PASS 25/25).

6. **Can Patient State remain consistent across the journey?**  
   **Yes** for Master correlation scope; **was** vulnerable to duplicate HbA1c ingest timestamps — **fixed**.

7. **Can SHIELD reconstruct the full intelligence trace?**  
   **Partial/Yes for Master scope** — scopeKey + learning/shield dual-write on journey; not a full 43-step live actor provenance graph.

8. **Do medication, allergy and critical-result safety controls block unsafe progression?**  
   **Yes** in goldens/Master (GUARDIAN slots, HITL required, critical lab sim routing, no auto-ACT).

9. **Do all role permissions remain correct throughout?**  
   **Pass for defined RBAC negatives**; production enforcement still **PARTIAL** (`productionRbacEnforced:false`). Lab/pharmacy are sims, not first-class roles.

10. **Does follow-up create a measurable outcome and a new Patient State?**  
    **Yes** in Master (outcome learning event + improvement detection + diabetes Accept learning).

11. **What minimum fixes before controlled pilot testing?**  
    Live EMR partner path with explicit `liveEmis` flip · durable RBAC/CIS2 · appointment/no-show + care-coordinator task model · live CGM modality decision (OQ-DIAB-1) · prospective clinical validation protocol · Neo4j/ops SLOs under real clinic load. **Not** auto-retrain.

---

## Honesty class (final)

| Axis | Result |
| --- | --- |
| Engineering | **INTERNAL TEST READY** |
| Workflow | **SIMULATED END-TO-END** |
| Clinical evidence | **UNVALIDATED** |
| Functions E2E? | **YES — synthetic diabetes Master Journey** (not live clinic EMR E2E) |

---

## Go-live gate

- Master Journey / critical diabetes loop documented: **PASS**  
- Unfixed P0 identity/safety: **none**  
- Typecheck: **PASS**  
- Proceed to commit + production deploy (`akshhealth.com` / `main`).

_End of clinical activity end-to-end results._
