# Phase 3 Regulatory Path Pack (unsigned templates)

**Date:** 18 Jul 2026  
**Product:** Aksh Health UK — Precision Health OS scaffolding  
**Status:** **Unsigned templates / checklists only** — not DTAC submission, not DCB0129 sign-off, not MHRA approval, not a completed DPIA.

Use this pack to track what must be funded and signed before any Phase 3 marketing claim (living twin, live omics, causal AI as proof, federated learning on real PHI, payer/pharma pipes).

---

## 1. DTAC (Digital Technology Assessment Criteria)

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Clinical safety | CSO | UNSIGNED | Align with DCB0129 clinical safety case scope |
| Data protection | IG lead | UNSIGNED | DPIA + records of processing for new modalities |
| Technical security | Security lead | UNSIGNED | Pen test / SOC evidence as required by buyer |
| Interoperability | Engineering | UNSIGNED | FHIR / Partner path honest — see Phase 2 checklist |
| Usability & accessibility | Product | UNSIGNED | WCAG evidence for claimed clinical UIs |

**Exit for claims:** Buyer-accepted DTAC pack (or successor framework) with named signatories — not this scaffold.

---

## 2. DCB0129 Clinical Safety (manufacturer)

| Hazard / control theme | Evidence link (in-repo) | Sign-off |
| --- | --- | --- |
| Autonomous EHR write | Clinical-proof HITL + zero-write tests | UNSIGNED |
| Misnamed physiological twin | Twin sim `physiologicalTwin:false` / UI copy | UNSIGNED |
| Causal overclaim | Causal stub disclaimer + model card UNASSIGNED | UNSIGNED |
| Federated patient export | Ethics gate + `patientLevelExport:false` default | UNSIGNED |
| Omics / imaging binary misuse | Metadata-only schemas; `dicomPresent`/`rawOmicsPresent` false | UNSIGNED |

**Template statement (do not treat as signed):**  
> This software remains under clinical safety case development. Scenario ranking and causal outputs are hypothesis / synthetic-rules scaffolding and must not be used as standalone clinical decisions without HITL.

---

## 3. MHRA clinical decision support (CDS) pathway

| Question | Current honest answer |
| --- | --- |
| Is software claiming to diagnose/treat? | No — HITL drafts and synthetic ranking only |
| Is a living digital twin claimed? | No — `physiologicalTwin: false` |
| Is causal AI claimed as proven? | No — “hypothesis only, not causal proof” |
| Regulatory class / route selected? | **Not selected** — CSO + legal must choose before pilots that influence care |

**Blocked until:** Named intended purpose, clinical evaluation plan, and MHRA route decision (or documented exemption rationale).

---

## 4. DPIA checklist (new Phase 3 processing)

- [ ] Imaging metadata purpose codes + retention (no pixel store unless separately DPIA’d)
- [ ] Omics panel metadata purpose codes (no raw genome store unless separately DPIA’d)
- [ ] Environment / OpenWeather processing basis + minimisation
- [ ] Federated research ethics + lawful basis; no patient-level export by default
- [ ] Pharma RWE / payer VBC secondary use (commercial) — separate DPIA if ever live
- [ ] Model cards with clinical owners for ORACLE, causal stub, twin ranking

---

## 5. Federated learning governance

| Control | Scaffold behaviour | Real Phase 3 need |
| --- | --- | --- |
| Ethics gate | `FEDERATED_RESEARCH_ETHICS_APPROVED` env | REC / HRA / local ethics approval artefacts |
| Aggregate only | Synthetic cohort stats | Site DPAs + secure aggregation design |
| No patient export default | `patientLevelExport: false` | Explicit export SOP + audit |
| Live FL infra | `liveFederatedLearning: false` | Partner FL stack + threat model |

---

## 6. Related in-repo docs

- [`PRECISION_HEALTH_DELIVERY_ROADMAP.md`](./PRECISION_HEALTH_DELIVERY_ROADMAP.md)
- [`PHASE2_PARTNER_CHECKLIST.md`](./PHASE2_PARTNER_CHECKLIST.md)
- [`PRECISION_HEALTH_FLOWCHART_GAP.md`](./PRECISION_HEALTH_FLOWCHART_GAP.md)

---

## One-line honesty

> **This file is a regulatory path checklist template. It does not constitute DTAC approval, DCB0129 sign-off, MHRA clearance, or a completed DPIA.**
