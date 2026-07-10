from typing import Dict, Any, List, Tuple


def build_rationale(features: Dict[str, float], risk_score: float) -> Dict[str, Any]:
    # Lightweight attribution proxy until SHAP/LIME integration is added.
    top_factors: List[Tuple[str, float]] = sorted(features.items(), key=lambda kv: abs(kv[1]), reverse=True)[:3]
    return {
        "method": "heuristic_attribution_v0",
        "confidence": round(min(0.99, max(0.4, risk_score / 100)), 2),
        "topFactors": [{"feature": name, "weight": value} for name, value in top_factors],
    }
