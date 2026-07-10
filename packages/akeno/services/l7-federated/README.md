# L7 Federated Learning Orchestrator

This module provides a baseline federated aggregation loop for multi-AMC model updates.

## Components

- `app/orchestrator.py`: round coordination logic
- `app/secure_aggregation.py`: secure averaging primitive

## Example Usage

```python
from app.orchestrator import SiteUpdate, run_round

round_result = run_round(
    [
        SiteUpdate(site_id="amc-1", gradients=[0.1, 0.2, 0.3]),
        SiteUpdate(site_id="amc-2", gradients=[0.2, 0.1, 0.4]),
    ]
)
print(round_result)
```

## Next Production Steps

- Replace plain averaging with secure aggregation protocol.
- Add signed update manifests and model lineage checks.
- Integrate fairness and site-level validation gates before global promotion.
