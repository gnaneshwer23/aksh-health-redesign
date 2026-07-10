from typing import Dict, Any


def evaluate_safety(features: Dict[str, float], risk_score: float) -> Dict[str, Any]:
    drift_flag = any(abs(v) > 10_000 for v in features.values())
    fairness_flag = False
    blocked = drift_flag or fairness_flag
    return {
        "blocked": blocked,
        "flags": {
            "drift": drift_flag,
            "fairness": fairness_flag,
        },
        "policyVersion": "validation_policy_v1",
        "nextAction": "route_to_clinician_override" if blocked else "allow_with_human_review",
    }
