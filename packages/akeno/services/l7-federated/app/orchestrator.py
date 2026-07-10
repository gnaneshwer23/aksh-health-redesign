from dataclasses import dataclass
from typing import Dict, List

from .secure_aggregation import secure_average


@dataclass
class SiteUpdate:
    site_id: str
    gradients: List[float]


def run_round(updates: List[SiteUpdate]) -> Dict[str, object]:
    if not updates:
        return {"status": "no_updates", "global_weights": []}
    vectors = [u.gradients for u in updates]
    aggregated = secure_average(vectors)
    return {
        "status": "ok",
        "participant_count": len(updates),
        "global_weights": aggregated,
    }
