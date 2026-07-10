# Compliance Control Library

## Scope

Control mappings for GDPR, HIPAA, EU MDR, and FDA-aligned software lifecycle expectations.

## Control Families

1. **Identity and Access**
   - Least privilege role model.
   - Break-glass access with full audit.
2. **Consent and Privacy**
   - Dynamic consent capture and revocation.
   - Purpose-limited data use enforcement.
3. **Security Operations**
   - Encryption at rest and in transit.
   - Key management rotation and attestation.
   - Security incident response playbooks.
4. **Clinical Safety**
   - Model validation evidence pack.
   - Human override and escalation policy.
   - Post-deployment model drift monitoring.
5. **Audit and Traceability**
   - Immutable event logs for access, inference, overrides, and actions.
   - End-to-end lineage for training and inference datasets.
6. **Regulatory Readiness**
   - Design history file artifacts.
   - Risk management file updates per release.
   - Post-market surveillance report generation.

## Required Runtime Evidence

- Consent decision trace per protected action.
- Inference metadata: model version, confidence, rationale hash.
- Clinician intervention records: approve/reject/override and reason.
- Incident and remediation timelines.
