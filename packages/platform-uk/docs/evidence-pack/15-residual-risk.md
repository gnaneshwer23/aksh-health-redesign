# Evidence artefact — residual risk

**Status:** Synced with Sprint C gap register (unsigned; not Gate 2 complete).

## Mirror of current residual risks

See also: `docs/HAZARD_LOG_TEMPLATE.md` residual risk register · `docs/E2E_CLINICAL_PROOF.md` honest gap register · `npm run evidence:pack` → `generated/clinical-proof-gap-summary.json`.

| Residual | Status | Owner |
| --- | --- | --- |
| EMIS / SystmOne live write-back | BLOCKED: partner | Partner + DPIA |
| CIS2 / NHS login | BLOCKED: partner | Partner |
| Neo4j Aura live graph | Live + seeded (ops) / honest mock if paused | Ops — keep Aura Running; `npm run smoke:neo4j` |
| CSO-signed hazard log | MANUAL / unsigned | CSO |
| Formal load / pen test | GAP | Security / ops |
| Continuous learning → governed model release | Recorder + outcome link PASS; release SOP stub MANUAL | CSO + release authority (`docs/GOVERNED_MODEL_RELEASE_SOP.md`) |
| Gates 1–3 signed | MANUAL | Sponsor + CSO |

## Last filled

- Date: 2026-07-18
- Owner: Engineering
- Result: Documentary residual risk list updated; **not** CSO-signed
