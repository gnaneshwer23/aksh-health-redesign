from typing import List


def secure_average(vectors: List[List[float]]) -> List[float]:
    if not vectors:
        return []
    width = len(vectors[0])
    sums = [0.0] * width
    for vector in vectors:
        if len(vector) != width:
            raise ValueError("All gradient vectors must share the same dimension.")
        for idx, value in enumerate(vector):
            sums[idx] += value
    return [v / len(vectors) for v in sums]
