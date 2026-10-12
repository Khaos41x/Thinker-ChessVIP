from __future__ import annotations

from hashlib import sha256

from core.elo_calibration.models import EloScale, EngineIdentity, SearchPolicy
from tools.elo_calibration.fit_curve import ArtifactBuildConfig
from tools.elo_calibration.models import (
    CellEstimate,
    EngineRole,
    FailureKind,
    GameOutcome,
    GameRecord,
    MoveTelemetry,
    PairRecord,
    SubjectColor,
)


def digest(text: str) -> str:
    return sha256(text.encode()).hexdigest()


def config() -> ArtifactBuildConfig:
    return ArtifactBuildConfig(
        artifact_version="synthetic-phase2-v1",
        scale=EloScale("synthetic.phase2.v1", "paired-v1", "fake-reference", "100ms/move"),
        engine=EngineIdentity("Fake Komodo", "14.1", "a" * 64),
        manifest_sha256="b" * 64,
        search_policy=SearchPolicy("phase2-100ms", 1, 32, 1, 100, 125),
    )


def estimates() -> tuple[CellEstimate, ...]:
    return tuple(
        CellEstimate(1, "pentanomial-delta-v1", "b" * 64, skill, "ref", 1000.0 + skill * 40.0, (0, 0, 4, 0, 0), 4, 0.5, 0.0, -10.0, 10.0, 1.0, None)
        for skill in range(26)
    )


def pair(skill: int, token: str, estimable: bool = True) -> PairRecord:
    games = (
        GameRecord(
            digest(token + "w"),
            SubjectColor.WHITE,
            GameOutcome.DRAW if estimable else None,
            None if estimable else FailureKind.CRASH,
            "normal" if estimable else "engine_error",
            () if not estimable else ("a1b1",),
            () if not estimable else (MoveTelemetry(1, "a1b1", 100, 0.001, EngineRole.SUBJECT),),
        ),
        GameRecord(
            digest(token + "b"),
            SubjectColor.BLACK,
            GameOutcome.DRAW,
            None,
            "normal",
            ("a1b1",),
            (MoveTelemetry(1, "a1b1", 100, 0.001, EngineRole.REFERENCE),),
        ),
    )
    return PairRecord(1, digest(token), "b" * 64, skill, "ref", 1000.0 + skill * 40.0, token, "7k/8/8/8/8/8/K7/R7 w - - 149 75", games)
