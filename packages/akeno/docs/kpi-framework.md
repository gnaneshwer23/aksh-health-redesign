# KPI Threshold Framework

This document finalizes target KPI thresholds for clinical, operational, model, compliance, and business outcomes.

## 1) Clinical KPIs

| KPI | Baseline | Target (Year 1) | Stretch (Year 2) |
|---|---:|---:|---:|
| Deterioration detection lead time | 0h | >=24h earlier | >=48h earlier |
| 30-day readmission rate | AMC baseline | -10% relative | -18% relative |
| Serious adverse event rate in covered pathways | AMC baseline | -8% relative | -15% relative |
| Medication safety incident rate | AMC baseline | -12% relative | -20% relative |

## 2) Operational KPIs

| KPI | Baseline | Target (Year 1) | Stretch (Year 2) |
|---|---:|---:|---:|
| Time-to-triage (median) | AMC baseline | -25% | -40% |
| Capacity-aware routing SLA adherence | n/a | >=95% | >=98% |
| Alert precision (PPV) for high-risk alerts | n/a | >=0.70 | >=0.80 |
| Clinician override turnaround time | n/a | <15 min p50 | <8 min p50 |

## 3) Model KPIs

| KPI | Minimum Gate | Target |
|---|---:|---:|
| Calibration error (ECE) | <=0.08 | <=0.05 |
| Drift score breach frequency | <=1/month/model | <=1/quarter/model |
| Fairness parity gap (key cohorts) | <=7% | <=4% |
| Explainability coverage | >=95% scored decisions | >=99% scored decisions |
| Silent-mode to live uplift | positive and significant | >=10% vs baseline pathway metric |

## 4) Compliance KPIs

| KPI | Minimum Gate | Target |
|---|---:|---:|
| Audit completeness | 100% | 100% |
| Consent-policy conformance | >=99.5% | >=99.9% |
| Security incident MTTR | <24h | <8h |
| Evidence pack freshness | monthly | weekly |

## 5) Business KPIs

| KPI | Year 1 | Year 2 |
|---|---:|---:|
| Active AMC deployments | 2 | 5+ |
| Net revenue retention | >=110% | >=125% |
| Gross margin | >=55% | >=65% |
| Ecosystem partner ARR share | >=10% | >=20% |

## Stage Gate Rules

- A phase cannot graduate without meeting all compliance gates.
- Clinical rollout requires model gates + clinician acceptance gates.
- Cross-AMC expansion requires demonstrated non-inferiority and fairness checks per site.
