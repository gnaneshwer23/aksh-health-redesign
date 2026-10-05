# Keep / Modify / Replace

| Capability | Decision |
|------------|----------|
| Patient management, HITL, dashboards, Nightingale chrome | KEEP |
| Auth / RBAC | KEEP + HARDEN |
| SYNTHESIS documentation | KEEP + MODIFY (context package) |
| 12-agent directory names | KEEP + CONTRACT |
| CONDUCTOR orchestration | MODIFY |
| BRIDGE FHIR staging | KEEP + HARDEN (`liveEmis:false`) |
| Neo4j patient graph | MODIFY + ontology V1 |
| Context Engine, GraphRAG, model registry, evaluation engine | NEW |
| Guardian DDI agent | KEEP (not the gateway) |
| Guardian safety gateway | STRENGTHEN / NEW |
| GP clinician workspace | MODIFY |

Do not replace working 1.0. GraphRAG is infrastructure, not an agent.
