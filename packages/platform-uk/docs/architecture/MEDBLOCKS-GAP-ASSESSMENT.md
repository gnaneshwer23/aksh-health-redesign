# Medblocks vs Aksh (`platform-uk`) — Technology Gap Assessment

**Date:** 2026-08-26  
**Scope:** Assess whether Medblocks ([github.com/medblocks](https://github.com/medblocks), [medblocks.com](https://medblocks.com)) fills technology gaps vs Aksh Health `packages/platform-uk`, or is unnecessary given current product constraints.  
**Method:** Code + vision/product docs read (`VOLUME_I`, `product-journey`, e2e reports, FHIR/EHR adapters, Patient State, diabetes module, ADR tech stack). No application code changed.  
**Verdict (one line):** **Do not add Medblocks now** — Aksh’s blocking gaps are diabetes intelligence, HITL clinic ops, and deferred live EMR; Medblocks is an openEHR/FHIR form & CDR toolkit that overlaps FHIR rehearsal and does not advance Patient State → Decision → Learning.

---

## 1. Product constraints (binding)

| Constraint | Implication for Medblocks |
| --- | --- |
| Diabetes-specific care coordination | Medblocks is standards/forms infra — not diabetes signal/risk/HITL product |
| Region-adaptable later (not NHS-locked) | openEHR/EHRbase stacks are often region-CDR-centric; Aksh already has region-agnostic `simulated_ehr_v1` |
| Simulated clinic operational; live EMR deferred | Live SMART/HAPI/Patient Access is Track B; Aksh intentionally stages FHIR with `liveEmis:false` |
| Vision loop: PATIENT STATE → INTELLIGENCE → DECISION → INTERVENTION → LEARNING | Medblocks addresses capture/interop edges, not Aksh’s domains 1–5 core |

---

## 2. Aksh current tech map

| Capability | What Aksh has today | Maturity |
| --- | --- | --- |
| **Clinical forms / UI capture** | CANVAS / intake: free-text → structured draft (`lib/intake-generation.ts`); React review/HITL UI; patient check-in companion — **not** openEHR web-template forms or Lit Questionnaire components | Sufficient for simulated clinic |
| **FHIR** | R4-shaped evidence/staging: `lib/clinical-proof/fhir-*`, `staged-fhir.ts`, BRIDGE Neon staging (`011_fhir_staging_bundles.sql`), export on Accept; honesty: internal evidence ≠ live writeback | Strong (Track A) |
| **openEHR** | **None** — not in stack ADR Keep list; no compositions, no EHRbase | Absent by design |
| **EHR adapters** | Region-agnostic sim: `lib/e2e/ehr-adapter.ts` (`simulated_ehr_v1`); EMIS staging + Medplum dry-run (`liveEmis:false`); `lib/data-interop/adapter-contract.ts` (all staged, empty live allow-list) | Sim complete; live deferred |
| **Vitals / CGM** | Simulated CGM hypo/safety (`lib/e2e/cgm-sim.ts`); diabetes glucose/HbA1c via Patient State ingest + fixtures; modality samples — **no** live Dexcom/Libre | Sim operational |
| **SMART on FHIR** | **Not implemented** (marketing explicitly avoids claiming SMART/NHS App); Medplum OAuth rehearsal only | Deferred |
| **Terminology** | Dr.Assist SNOMED/ICD-10 **drafts** (deterministic + LLM); John Snow Labs **not wired**; LOINC/RxNorm = ADR “Add later” | Partial drafts only |
| **Patient State** | Append-only facts + snapshot (`lib/patient-state/*`), Postgres/file; diabetes ingest tests; e2e LEARN steps — still wiring deeper into all Intelligence reads | Foundation live |
| **Agents / loop** | 12-agent directory + CONDUCTOR spine, diabetes 9-signal module, HITL, SHIELD, governed learning (`autoRetrain:false`) | Core product differentiator |

Evidence anchors: Master E2E (CGM, EHR adapter, learning PASS); `docs/e2e/AKSH-VISION-PAIRED-JOURNEY-20260813.md`; `docs/ADR_TECH_STACK_MODERNIZATION.md` (FHIR Keep; LOINC Add-later; no openEHR).

---

## 3. Medblocks capability map (external)

| Asset | What it is | Diabetes / Aksh-loop relevance |
| --- | --- | --- |
| **medblocks-ui** | Lit web components; openEHR FLAT compositions; experimental FHIR Questionnaire forms; some SNOMED search widgets | Capture UX for CDR-style apps — parallel stack to React HITL |
| **EHRbase tutorials / openEHR sync** | openEHR clinical data repository patterns | New persistence paradigm Aksh does not use |
| **SMART on FHIR demos / HAPI** | Launch context + FHIR server demos | Overlaps future Track B; Aksh already chose Medplum rehearsal |
| **openFHIR** (→ openFHIR/openfhir) | openEHR ↔ FHIR mapping engine | Only valuable if Aksh adopts openEHR |
| **Commercial Patient Access / normalize-to-FHIR** | Patient portal connect + FHIR-normalized pulls | Useful when live multi-source ingest is in scope — not while sim clinic is the bar |

Medblocks is **not** diabetes-specific and does **not** implement Patient State versioning, CONDUCTOR, HITL gates, diabetes signals, or governed learning.

---

## 4. Recommendation matrix

| Medblocks asset | Verdict | Rationale |
| --- | --- | --- |
| **medblocks-ui (Lit forms)** | **SKIP** | Overlaps CANVAS/intake + React review; introduces Lit + openEHR path binding into a Next/React app with no openEHR CDR. Cost >> benefit for diabetes HITL UX. |
| **EHRbase / openEHR CDR stack** | **SKIP** | Aksh persistence = Postgres Patient State + case/review artifacts + FHIR staging. Dual CDR (openEHR + FHIR) is a strategic fork, not a gap fill. |
| **openFHIR mapping** | **SKIP** (unless openEHR adopted) | Mapping without an openEHR source/sink is unused infrastructure. |
| **SMART on FHIR demos** | **CONSIDER LATER** | When a live EMR partner requires SMART launch. Until then, Medplum OAuth + staged FHIR cover rehearsal; e2e honesty forbids live claims. |
| **HAPI FHIR server** | **CONSIDER LATER** (low priority) | ADR already: keep/expand Medplum (or self-host HAPI) as FHIR staging quality — optional eng follow-up, not product-critical while sim clinic passes. Prefer one FHIR rehearsal target, not Medblocks + Medplum + HAPI. |
| **Patient Access / normalize-to-FHIR (commercial)** | **CONSIDER LATER** | Trigger: real patient-authorized multi-EHR pull into Patient State. Does not unblock diabetes Intelligence/Decision today. Evaluate against building on Medplum/FHIR ingest when Track B starts. |
| **SNOMED widgets in medblocks-ui** | **SKIP** for now | Partial terminology drafts exist; certified terminology server / LOINC-RxNorm has a named ADR trigger — don’t bolt Lit widgets for that alone. |

---

## 5. Gap vs overlap vs nice-to-have

| Theme | Classification | Notes |
| --- | --- | --- |
| FHIR R4 staging / export | **Overlap** | Aksh BRIDGE + clinical-proof FHIR already deliver Track A |
| Form-driven clinical capture | **Overlap (different stack)** | Medblocks = template/CDR forms; Aksh = intake + HITL React |
| openEHR | **Nice-to-have only if strategy changes** | Not a current product requirement |
| SMART / live patient FHIR access | **Nice-to-have → later Track B** | Real gap eventually; Medblocks one option among Medplum/SMART libs |
| Diabetes signals, Decision, Learning, HITL | **Aksh-only** | Medblocks does not close these |
| Region-agnostic sim EHR | **Aksh already ahead for constraints** | `simulated_ehr_v1` matches “sim now, region later” |

---

## 6. Gaps Aksh actually has that Medblocks does **not** solve

Do not over-index on Medblocks for these real gaps:

1. **Deeper Patient State → Intelligence wiring** — facts exist; not all diabetes/agent reads are fully Patient-State-sourced yet.  
2. **Diabetes v1 signal quality & CONDUCTOR wiring** — disease module / journey completeness, not form widgets.  
3. **Decision domain separation** — safety-route / queue logic still orchestration-adjacent.  
4. **Certified terminology / LOINC-RxNorm normalization** — ADR Add-later; Medblocks UI search ≠ terminology service.  
5. **Live CGM / lab / pharmacy vendor feeds** — need device/partner adapters; not openEHR forms.  
6. **Live EMR write-back / partner credentials** — governance + contracts (`liveEmis:false`); Medblocks does not remove that.  
7. **Clinical validation / regulatory evidence** — outside any UI library.  
8. **Unified clinician workspace polish** — product/UX debt in Volume I Ch. 12/18, not Lit components.

---

## 7. Verdict

**Do we need Medblocks now?** **No.** Adding Medblocks would pull the stack toward openEHR/Lit/CDR patterns that conflict with the Keep-now ADR (Next/React, Postgres Patient State, FHIR-shaped staging via BRIDGE/Medplum) and would not accelerate the diabetes care-coordination loop that defines Aksh. Revisit **only** when a concrete Track B trigger fires: partner-mandated SMART launch, commercial Patient Access for multi-source FHIR ingest, or an explicit product decision to adopt openEHR as a second clinical persistence model (currently unwarranted).

**Default action:** **SKIP** Medblocks for the simulated-clinic / diabetes-first phase; keep FHIR rehearsal on the existing Medplum/BRIDGE path; invest engineering in Patient State consumers, diabetes Intelligence, and HITL clinic coherence instead.
