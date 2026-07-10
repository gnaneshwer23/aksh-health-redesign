# Service Boundaries and Reference Architecture

## Domain Boundaries

1. **Identity and Consent Domain**
   - Registration, identity proofing, proxy/caregiver delegation, consent lifecycle.
2. **Interoperability Domain**
   - FHIR/HL7/DICOM ingestion, terminology mapping, conformance validation.
3. **Patient Context Domain**
   - Longitudinal record assembly, graph projection, unified patient snapshot APIs.
4. **Intelligence Domain**
   - Risk models, digital twin, decision support, causal and explainability services.
5. **Clinical Governance Domain**
   - Human review, override, escalation, policy enforcement, clinical audit workflow.
6. **Care Pathway Domain**
   - Route assignment, action orchestration, SLA and capacity-aware dispatch.
7. **Monitoring and Outcomes Domain**
   - Real-time monitoring events, alerts, follow-up workflows, outcome labeling.
8. **Federated Learning Domain**
   - Cross-AMC training orchestration, secure aggregation, model release governance.
9. **Ecosystem and Marketplace Domain**
   - Partner APIs, billing/licensing, research workspaces, external developer access.
10. **Security and Privacy Vault Domain**
   - Cryptographic controls, immutable audit, privacy-preserving computation controls.

## Core Runtime Services

- `identity-consent-api`
- `interop-gateway`
- `terminology-service`
- `patient-context-api`
- `clinical-graph-service`
- `model-inference-api`
- `xai-api`
- `safety-guardrails`
- `clinician-review-console-api`
- `pathway-orchestrator`
- `monitoring-alerts-api`
- `outcome-labeling-api`
- `federated-orchestrator`
- `partner-api-gateway`
- `privacy-vault-service`

## Data Stores

- Transactional store: Postgres
- Event stream: Kafka
- Longitudinal graph: Neo4j
- Analytical lakehouse: Parquet/Delta-compatible store (implementation-specific)
- Model registry: MLflow-compatible API
- Audit ledger: append-only store (chain-backed where required)

## API Contracts

- Clinical payloads: FHIR R4 resources and bundles.
- Legacy adapters: HL7 v2 and DICOM via interoperability gateway.
- Terminology canonicalization: SNOMED, LOINC, ICD-11 mapping APIs.
- Intelligence payload: recommendation + rationale + confidence + provenance.

## Non-Functional SLOs

- Patient context query p95: <=500 ms
- Real-time high-risk alert p95: <=5 seconds from event ingestion
- Model inference p95: <=300 ms for online scoring endpoints
- Audit write durability: zero data loss under single-node failure

## Release and Control Gates

- **Architecture gate:** new services must declare ownership, SLO, and data contracts.
- **Safety gate:** model/service changes require validation report.
- **Compliance gate:** audit fields and consent checks mandatory.
- **Rollout gate:** feature flag + rollback path required for live traffic.
