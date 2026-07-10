# Next Phase: Production Hardening (Phase 1 -> 2)

This phase operationalizes the initial scaffold into an integration-ready platform.

## Implemented in this iteration

- L0-L2 ingestion service now:
  - validates consent token format and expiry,
  - routes payloads through interop standardization,
  - persists normalized events to Postgres,
  - projects patient/source relationships into Neo4j,
  - publishes ingestion events to Kafka.
- L3-L4 AI service now:
  - resolves model metadata via model-registry hook,
  - emits scoring and governance audit events to Kafka.

## Configuration

Set these environment variables before startup:

- `POSTGRES_DSN`
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- `KAFKA_BOOTSTRAP_SERVERS`
- `KAFKA_TOPIC_INGESTION`

## Recommended Immediate Follow-Ups

1. Replace in-function table creation with managed migrations.
2. Add retry and dead-letter handling for Kafka publish failures.
3. Add resilient connection pooling for Postgres and Neo4j.
4. Integrate real FHIR/HL7/DICOM adapter libraries.
5. Wire model registry to MLflow or equivalent deployment registry.
