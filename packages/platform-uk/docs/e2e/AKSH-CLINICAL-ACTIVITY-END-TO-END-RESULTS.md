# Aksh Health — Clinical Activity End-to-End Results

**Product framing:** Region-adaptable diabetes clinic / primary-care diabetes care coordination (not NHS-locked; region connectors come later).  
**Date:** 2026-08-12  
**Package:** `packages/platform-uk`  
**Base commit (pre this pass):** `95beeff`  
**Correlation ID:** `aksh-master-20260812-d731af5e`  
**Golden patient:** **P002 Mr James Patel** (progressive T2D; CKD/eGFR context in sims)  
**Machine-readable:** `docs/e2e/AKSH-E2E-RESULTS.json`  
**Master trace:** `docs/reports/E2E_MASTER_JOURNEY_20260812.md`

Frozen loop under test:

```
CONNECT → UNDERSTAND → DETECT → REASON → PREDICT → RECOMMEND → DECIDE → ACT → MONITOR → LEARN
PATIENT STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING
+ SIMULATED multi-stakeholder clinic (appointments, consent, VOICE, lab, pharmacy, referral, nurse, coordinator, CGM, twin, population)
```

---

## Verdict

**Yes — publication-ready for the simulated multi-stakeholder diabetes clinic** under honesty class `SIMULATED END-TO-END` / engineering `INTERNAL TEST READY`.

- **Master Journey `AKSH-E2E-MASTER-001`:** **PASS 35/35** (one `correlationId`, canonical identity P002, stakeholder matrix all Y).
- **Stakeholder clinic:** **PASS** — patient, GP, nurse, specialist, lab, pharmacy, care coordinator, admin, safety, population_ops each complete a diabetes-relevant job in the simulated layer.
- **Not claimed:** clinically validated · autonomous care ready · live mic/EHR/EPS/lab/CGM vendor feeds · MHRA/CQC.
- **Ideal live script** (live VOICE → live EHR → live prescribing): still **NOT IMPLEMENTED** as connected live actors — kept separate from Master PASS.
- Simulated stack completes cleanly: **no dead ends**, **no silent fake live success**, HITL retained for clinical decisions.

---

## Environment

| Item | Value |
| --- | --- |
| App | Aksh Health UK platform |
| Prod probe | https://akshhealth.com/api/health — Postgres **live**, Neo4j **live** (connected) |
| Seed | `20260812` · source `AKSH_E2E_TEST` · synthetic |
| Scale executed | **100** patients (cohort A–H targets); brief asked 120 — **max honest scale 100** (do not invent 120 PASS) |
| HITL | mandatory · `autoRetrain:false` · `ehrWrite:false` · `liveEmis:false` |
| Region model | organisationId + clinicId + `simulated_ehr_v1` adapter (region-agnostic) |

---

## Master Journey (connected)

| # | Id | Layer | Class | Status |
| --- | --- | --- | --- | --- |
| 1–35 | MJ-01 … MJ-35 | CONNECT→LEARN + stakeholder clinic + provenance | LIVE / PARTIAL / SIMULATED / CONTRACT | **PASS** |

Highlights: identity P002 (+ alias E2P021) · HbA1c 6.8→8.4 · CONDUCTOR Urgent · SYNTHESIS/GUARDIAN/ORACLE/NEXUS · HITL Accept · health-plan · outcomes/learning · SHIELD scope · **SIMULATED** lab delay/complete · **SIMULATED** pharmacy→care-team · **SIMULATED** nurse follow-up · **SIMULATED** appointment no-show · **SIMULATED** consent revoke · **SIMULATED** VOICE→SYNTHESIS · **SIMULATED** CGM hypo escalate · **SIMULATED** PATHWAY referral · coordinator tasks · notifications · digital twin `synthetic_rules` · population aggregate · EHR adapter staging · no autonomous ACT.

`connectedResult` for Master = **PASS**. Downstream isolated goldens were not substituted for Master.

---

## Stakeholder activity matrix (diabetes jobs)

| Role | Diabetes job | Can complete? | Class |
| --- | --- | --- | --- |
| Patient | Grant/revoke purpose-bound consent; appointment reminder path | **Y** | SIMULATED |
| GP | SIMULATED VOICE→SYNTHESIS draft + PATHWAY referral Accept-for-send (HITL) | **Y** | SIMULATED |
| Nurse | Complete diabetes follow-up after encounter draft | **Y** | SIMULATED |
| Specialist | Receive endocrinology referral draft (staged, not live send) | **Y** | SIMULATED |
| Lab | Delay then complete eGFR without fabricating delayed values | **Y** | SIMULATED |
| Pharmacy | Adherence failure → coordinator → clinician | **Y** | SIMULATED |
| Care coordinator | Close no-show chase + pharmacy coordination tasks | **Y** | SIMULATED |
| Admin | Organisation/clinic EHR adapter staging (region-agnostic) | **Y** | SIMULATED |
| Safety | CGM hypo escalate to clinician (no autonomous treatment) | **Y** | SIMULATED |
| Population ops | Synthetic population aggregate with small-cell suppression | **Y** | SIMULATED |

---

## Capability classification (diabetes-focused)

| Capability | Classification | Notes |
| --- | --- | --- |
| Patient identity (P002 unify) | **LIVE** | P1-ID-001 resolved |
| Consent (grant + mid-journey revoke) | **SIMULATED** | Operational in Master MJ-24 |
| Appointments / no-show | **SIMULATED** | Book→remind→no-show→coordinator close |
| VOICE live mic capture | **NOT IMPLEMENTED** | SIMULATED transcript path operational (MJ-25) |
| SYNTHESIS / CONDUCTOR / NEXUS | **LIVE** (deterministic in Master) | LLM flag-gated; Master disables LLM |
| Patient State facts | **LIVE** (Neon) | Append-only |
| Lab order/result actors | **SIMULATED** | `liveNhsLab:false` — operationally complete |
| Change detection / HbA1c trend | **LIVE** | Dedupe fix retained |
| Diabetes module signals | **LIVE** (rules) | Flag-gated; coaching explanatory-only |
| CGM device adapter | **SIMULATED** | Vendor feed still not live; hypo escalate operational |
| ORACLE/HORIZON risk | **LIVE** (rules/LLM optional) | |
| GUARDIAN med safety | **LIVE** | Allergy/DDI paths in goldens |
| SHIELD audit | **LIVE** | Failures surface (not silent) |
| HITL Decide Accept/Edit/Reject | **LIVE** | |
| Prescription / EPS | **NOT IMPLEMENTED** | Pharmacy **SIMULATED** operational |
| PATHWAY/REFERRAL | **SIMULATED** | Draft + HITL Accept-for-send; `eReferralWrite:false` |
| EQUITY/COMPASS barriers | **PARTIAL** | |
| Digital twin | **LIVE** (synthetic_rules) | Honesty gate blocks physiological claim |
| Learning events | **LIVE** | `autoRetrain:false` |
| Neo4j graph | **LIVE** in prod probe | May mock if disconnected |
| EMIS / Medplum live write | **NOT IMPLEMENTED** | `liveEmis:false` · simulated adapter stages only |
| Heart module | **STUB** | Types only — out of publication diabetes scope |
| PRISM / ATLAS | **NOT IMPLEMENTED** | Phase 2 `live:false` — out of publication diabetes scope |
| RBAC enforce in prod | **PARTIAL** | `productionRbacEnforced:false` |

Named agents preserved: VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE/HORIZON, REFERRAL/PATHWAY, EQUITY/COMPASS, SHIELD, CONDUCTOR, CANVAS, BRIDGE, NEXUS (+ PRISM/ATLAS phase 2).

---

## Gaps closed vs prior vision pass

| Prior gap | Status now |
| --- | --- |
| Appointments / no-show NOT IMPLEMENTED | **SIMULATED + operational** (MJ-23) |
| Consent mid-journey revoke not Master-wired | **SIMULATED + operational** (MJ-24) |
| Nurse follow-up thin (directory-only) | **Operational nurse follow-up** (MJ-20) |
| VOICE only “docs path” | **SIMULATED capture → SYNTHESIS draft** (MJ-25) |
| CGM adapter NOT IMPLEMENTED | **SIMULATED hypo → escalate** (MJ-26); live vendor still out |
| PATHWAY only “no auto-ACT” | **Referral draft + Accept-for-send** (MJ-22) |
| Lab/pharmacy sims not first-class clinic story | Wired into stakeholder clinic + matrix |
| NHS-primary framing risk | Region-agnostic org/clinic + `simulated_ehr_v1` |
| Master PASS while stakeholder stubs thin | Master **35/35** includes stakeholder matrix all Y |

---

## Bugs found / fixed this run

### P0 — identity / safety / security / integrity

_None open_ for synthetic Track A.

### P1 — fixed (prior) / retained

- **P1-DETECT-HBA1C-DUP** — retained; Master still shows worsening trajectory.

### P1 — fixed this pass

- **P1-STAKEHOLDER-THIN** — appointment/consent/VOICE/CGM/referral/coordinator/notification/nurse paths were stubs or missing for publication story → implemented as labelled SIMULATED, operationally complete clinic (`lib/e2e/*-sim.ts` + `stakeholder-clinic.ts`).

### P2 — open / documented (out of publication-ready simulated scope)

- Live VOICE mic, live CGM vendor feed, live EMR/EPS, 120-patient scale (100 max honest).
- `productionRbacEnforced:false`; dedicated prompt-injection red-team pack incomplete.
- Heart / PRISM / ATLAS remain stub/not implemented (explicitly out of diabetes publication scope).

### P3

- Preference-conflict scenario not Master-wired (HITL reject covers related safety).

---

## Scale

| Requested | Executed | Note |
| --- | --- | --- |
| 120 patients × org matrix | **100** | Cohort A–H target sum; max honest scale — do not invent 120 PASS |

---

## Explicit answers (11)

1. **Can a synthetic patient complete the full Aksh clinical loop without manual DB manipulation?**  
   **Yes** — Master Journey PASS 35/35 for P002 under one correlationId (lab/pharmacy/VOICE/CGM/appointments/referral SIMULATED; no live EMR write).

2. **What is genuinely LIVE?**  
   Neon Patient State / learning / SHIELD dual-write path · deterministic CONDUCTOR + decision/HITL · diabetes rules signals · digital twin ranking labelled `synthetic_rules` · prod Postgres + Neo4j (probe) · identity unification.

3. **What is SIMULATED?**  
   Lab delay/complete · pharmacy→care-team · nurse follow-up · appointment no-show · consent revoke · VOICE→SYNTHESIS · CGM hypo escalate · PATHWAY referral draft · coordinator tasks · notifications · EHR adapter staging · population aggregate.

4. **What is STUB / BROKEN / NOT IMPLEMENTED?**  
   Heart **STUB** · PRISM/ATLAS **NOT IMPLEMENTED** · live VOICE mic / live CGM vendor / live EMIS-EPS-lab **NOT IMPLEMENTED**. Nothing required for the publication simulated clinic marked **BROKEN**.

5. **Where does the connected chain first break?**  
   Against the **ideal live** script: first at **live VOICE / live EHR write** (then live prescribing). Against **implemented Master Journey + stakeholder clinic:** **does not break** (PASS 35/35).

6. **Can Patient State remain consistent across the journey?**  
   **Yes** for Master correlation scope; HbA1c dedupe fix retained.

7. **Can SHIELD reconstruct the full intelligence trace?**  
   **Partial/Yes for Master scope** — scopeKey + learning/shield dual-write on journey; stakeholder sims carry correlationId annotations.

8. **Do medication, allergy and critical-result safety controls block unsafe progression?**  
   **Yes** in goldens/Master (GUARDIAN slots, HITL required, CGM escalate, critical lab sim routing, no auto-ACT).

9. **Do all role permissions remain correct throughout?**  
   **Pass for defined RBAC negatives**; production enforcement still **PARTIAL** (`productionRbacEnforced:false`). Lab/pharmacy/coordinator jobs run in sim layer with honesty labels.

10. **Does follow-up create a measurable outcome and a new Patient State?**  
    **Yes** in Master (outcome learning event + improvement detection + diabetes Accept learning + lab fact on complete).

11. **What minimum fixes before controlled pilot testing?**  
    Live EMR partner path with explicit `liveEmis` flip · durable RBAC · live CGM modality decision (OQ-DIAB-1) · prospective clinical validation protocol · Neo4j/ops SLOs under real clinic load. **Not** auto-retrain. Simulated clinic publication bar is met without these.

---

## Honesty class (final)

| Axis | Result |
| --- | --- |
| Engineering | **INTERNAL TEST READY** |
| Workflow | **SIMULATED END-TO-END** (publication-ready simulated clinic) |
| Clinical evidence | **UNVALIDATED** |
| Functions E2E? | **YES — synthetic diabetes Master Journey + stakeholder clinic** (not live clinic EMR E2E) |

---

## Go-live gate

- Master Journey / stakeholder diabetes loop documented: **PASS 35/35**  
- Stakeholder matrix all Y: **PASS**  
- Unfixed P0 identity/safety: **none**  
- Proceed to commit + production deploy (`akshhealth.com` / `main`).

_End of clinical activity end-to-end results._
