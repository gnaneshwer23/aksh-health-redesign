# Clinical spine — Phase B

**Status:** Shipped in-repo (synthetic until partners)  
**Honesty:** `liveEmis: false` · `autoRetrain: false` · no invented live device streams

## Goal

Consent-gated **ingest from role UIs** (patient / GP, not admin-only) into the same Aksh spine: timeline + Neo4j MEASURED when live + SHIELD. Biomarker-lite on timeline. Connector status on admin system spine.

## Checklist

- [x] Patient companion ingest UI — connector picker (synthetic wearable / lifestyle / file_import)
- [x] GP patient detail ingest UI — same connectors, clinician mode
- [x] Consent check before ingest (UI + API gate)
- [x] Success refreshes patient timeline
- [x] Fitbit clearly disabled without `FITBIT_CLIENT_*` keys
- [x] Biomarker-lite (HR / steps / sleep / SpO₂ / activity) from ingested samples on timeline
- [x] Admin system spine shows connector registry status + Phase B role ingest paths
- [x] Nurse vitals note — “also appears on timeline” link (optional)
- [x] Tests: `tests/clinical-spine-phase-b.test.ts` in `npm run test:clinical-proof`
- [ ] Partner credentials for first live modality (external — not invented here)

## How to verify

```bash
cd packages/platform-uk
npx tsx tests/clinical-spine-phase-b.test.ts
npm run test:clinical-proof
```

Manual UI:

1. Sign in as patient → Health tab → grant care_delivery wearable/lifestyle → Ingest synthetic wearable → timeline shows biomarker chips.
2. Sign in as GP → open a patient → Consent grants → Role ingest → timeline refresh.
3. Admin → System spine → Connectors flag + Phase B role ingest paths note.
4. Confirm Fitbit row shows **Disabled (no keys)** when env unset.

## Phase C next

Intelligence on the spine (agents + twin ranking + coaching from clinical/patient flows) — see `docs/CLINICAL_SPINE_PHASE_C.md`. Partner DPIA / live modality / EMIS remain a **parallel** track — still `liveEmis: false` until signed.
