# Remaining work — after Phase 6 (+ Phase 1–5 leftovers)

After Phase 0 (docs + journey slice), Phase 1 (Patient 360 foundation), Phase 2 (glucose intelligence synthetic), Phase 3 (medication & personalised care synthetic), Phase 4 (continuous care synthetic), Phase 5 (agent intelligence synthetic), and Phase 6 (chronic disease domain framework):

## Phase 4 leftovers (productization)

- Org FK + RLS proof for continuous-care tables against live orgs
- Playwright E2E for continuous care / nurse queue
- Live schedule / recall connectors (outbound campaigns still `planned`)
- See [13-phase4-continuous-care.md](./13-phase4-continuous-care.md)

## Phase 3 leftovers (productization)

- Licensed / maintained drug-interaction source under governance (stub remains labeled until then)
- Org FK + RLS proof for medcare tables against live orgs
- Playwright E2E for medication & personalised care
- See [12-phase3-medication-personalised-care.md](./12-phase3-medication-personalised-care.md)

## Phase 2 leftovers (productization)

- Live CGM vendor connectors + projection into `cgm_trusted_readings`
- Resolve `OQ-DIAB-1` modality schema with clinical lead
- Playwright E2E for glucose intelligence
- See [11-phase2-glucose-intelligence.md](./11-phase2-glucose-intelligence.md)

## Phase 1 leftovers (productization)

- Org FK + RLS proof for Patient 360 tables against live orgs
- Edit UX for structured clinical rows (beyond seed/recon)
- Single timeline projection with precision-health `/timeline` (journey + continuous care already merged; modalities/cases remain)
- Playwright E2E for Patient 360

## Phase 4 — Continuous care / longitudinal operations — **shipped (synthetic)**

- Follow-up worklists, appointment coordination, patient-reported updates
- Notification preferences, staff escalation queues, completed-action tracking
- Care-plan progress monitoring; operational and safety analytics
- Nurse/ops queues for continuous-care follow-ups and escalations
- Journey + continuous-care events merged into `/api/patients/[id]/timeline`
- Recall / outbound campaigns (capability still `planned`)

## Phase 5 — Agent intelligence — **shipped (synthetic)**

- Governed drafting: history summary, clinical documentation, missing-info, evidence retrieval, follow-up drafts
- Clinician Accept/Edit/Reject gates; structured validation; model/prompt version pins
- Offline evaluation datasets / regression; shared patient context (no silos)
- Capability `diabetes_agent_intelligence` = `synthetic_demo`
- Leftovers: learning-loop → signal thresholds productization; optional gated LLM; Playwright E2E
- See [14-phase5-agent-intelligence.md](./14-phase5-agent-intelligence.md)

## Phase 6 — Future chronic disease expansion — **shipped (framework)**

- Reusable disease-domain plugin interfaces + registry (`lib/disease-domains/`)
- Diabetes/metabolic registered as `active_synthetic`; CVD / CKD / obesity scaffolds `planned` (`not_activated`); other chronic = research placeholder
- Capability `chronic_disease_domain_framework` = `synthetic_demo`; future disease caps remain `planned`
- See [15-phase6-disease-domains.md](./15-phase6-disease-domains.md)

## Post–Phase 6 readiness (still open)

- Complete CLINICAL_RELEASE checklist
- Org pilot with synthetic → shadow → live progression
- Promote CVD/CKD/obesity only after clinical-lead specs + validation gates
- Update capability register only with evidence; keep LIVE_ORGANISATIONS honest
