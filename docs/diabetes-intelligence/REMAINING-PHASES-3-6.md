# Remaining work — Phases 2–6

After Phase 0 (docs + journey slice), Phase 1 (Patient 360 foundation), and Phase 2 (glucose intelligence synthetic):

## Phase 2 leftovers (productization)

- Live CGM vendor connectors + projection into `cgm_trusted_readings`
- Resolve `OQ-DIAB-1` modality schema with clinical lead
- Playwright E2E for glucose intelligence
- See [11-phase2-glucose-intelligence.md](./11-phase2-glucose-intelligence.md)

## Phase 1 leftovers (productization)

- Org FK + RLS proof for Patient 360 tables against live orgs
- Edit UX for structured clinical rows (beyond seed/recon)
- Single timeline projection with precision-health `/timeline`
- Playwright E2E for Patient 360


## Phase 3 — Clinician review depth

- Unify journey care-plan decisions with `review_cases` item decisions where appropriate
- SOAP/coding drafts attached to the same patient dossier
- Medication safety remains HITL; still no dose recommendation writes

## Phase 4 — Longitudinal operations

- Nurse/ops queues for `care_follow_up_tasks`
- Merge journey events into `/api/patients/[id]/timeline`
- Recall / outbound campaigns (capability still `planned`)

## Phase 5 — Agent intelligence

- Keep disease module rules-first; promote ML only under governance
- Strengthen AKSH_DIABETES loop evaluation
- Learning loop feedback into signal thresholds (with audit)

## Phase 6 — Readiness

- Complete CLINICAL_RELEASE checklist
- Org pilot with synthetic → shadow → live progression
- Update capability register only with evidence; keep LIVE_ORGANISATIONS honest
