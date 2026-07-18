# Gate 1 checklist — Platform readiness (engineering)

**Purpose:** Confirm the product is technically ready for a governed pilot rehearsal.  
**Does not claim:** Clinical safety case complete, live EMIS write-back, or production clinical use.

| # | Criterion | Evidence | Owner | Pass? | Date |
| ---: | --- | --- | --- | --- | --- |
| G1-01 | Clinical-proof suite green | `npm run test:clinical-proof` | Eng | ☐ | |
| G1-02 | Workflow / typecheck green | `npm run verify` | Eng | ☐ | |
| G1-03 | Role smoke matrix | `npm run smoke:all` (against deploy) | Eng | ☐ | |
| G1-04 | Neo4j honesty | `/api/health` → `neo4j.mode` live or honest mock; `npm run smoke:neo4j` | Eng | ☐ | |
| G1-05 | HITL invariants | Agents return `ehrWrite:false`; Accept→stage→sim only | Eng | ☐ | |
| G1-06 | EMIS not live | Staging `liveWriteBack:false`; no Partner write | Eng | ☐ | |
| G1-07 | SHIELD append-only | No PUT/DELETE on `/api/audit/shield` | Eng | ☐ | |
| G1-08 | Public demos labelled | GP / ICS / Hospital demo banners present | Eng | ☐ | |
| G1-09 | Evidence pack generated | `npm run evidence:pack` | Eng | ☐ | |
| G1-10 | Secrets not in git | No `.env` / credentials committed | Eng | ☐ | |

## Sign-off

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Engineering lead | | | |
| Release owner | | | |

**Result:** ☐ PASS · ☐ FAIL · ☐ DEFER  
**Notes:**
