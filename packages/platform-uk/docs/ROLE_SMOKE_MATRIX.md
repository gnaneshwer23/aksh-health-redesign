# Role smoke matrix — clinical proof

HTTP smoke coverage for stakeholder dashboards. Complements Playwright RBAC specs.

| Role | Signup role key | Dashboard | Smoke command | Expected |
| --- | --- | --- | --- | --- |
| GP | `gp` | `/dashboard/gp` | `npm run smoke:gp` | 200 + clinician chrome |
| Nurse | `nurse` | `/dashboard/nurse` | `npm run smoke:nurse` | Auth + nurse views |
| Pharmacist | `pharmacist` | `/dashboard/pharmacist` | `npm run smoke:pharmacist` | Med review surface |
| Admin / practice manager | `practice-manager` | `/dashboard/admin` | `npm run smoke:admin` | Users / integrations / audit |
| ICS lead | `ics-lead` | `/dashboard/ics` | `npm run smoke:ics` | Aggregate only (+ public demo allowlist) |
| Hospital executive | `hospital-executive` | `/dashboard/hospital` | `npm run smoke:hospital` | Capacity / recommendations |
| Patient | `patient` | `/dashboard/patient` | `npm run smoke:patient` | Plain-language companion |
| Researcher | `researcher` | `/dashboard/researcher` | `npm run smoke:researcher` | Aggregate / ethics-gated export |

All roles:

```bash
npm run smoke:all
```

Public allowlist (no auth): `/dashboard/gp`, `/dashboard/ics` only — see `e2e/role-routing.spec.ts`.

Cross-role denial: `e2e/clinical-proof-rbac.spec.ts` (nurse session blocked from admin clinical tools as configured by middleware).
