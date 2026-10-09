"""Shared fixtures for Phase 6 cohort / end-to-end tests."""
from __future__ import annotations

import pytest

from aksh_access.pipeline import AkshPatientAccessPipeline
from aksh_access.scenarios import NOW, seed_ehr


@pytest.fixture
def pipe() -> AkshPatientAccessPipeline:
    p = AkshPatientAccessPipeline(now=lambda: NOW)
    seed_ehr(p.store)
    return p


def run(pipe: AkshPatientAccessPipeline, events) -> None:
    for e in events:
        pipe.handle(e)


def rules_for(pipe: AkshPatientAccessPipeline, pid: str) -> dict:
    return {
        p.finding.rule_id: p
        for p in pipe.gate.proposals.values()
        if p.finding.patient_id == pid and p.status == "pending"
    }
