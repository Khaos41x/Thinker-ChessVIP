from __future__ import annotations

from core.elo_calibration import (
    CalibrationAnchor,
    CalibrationPayload,
    EloScale,
    EngineIdentity,
    PchipSegment,
    SearchPolicy,
    create_artifact,
)


def build_payload(rating_offset: float = 0.0) -> CalibrationPayload:
    ratings = [1000.0 + 40.0 * skill + rating_offset for skill in range(11)]
    ratings.append(1400.0 + rating_offset)
    ratings.extend(1000.0 + 40.0 * (skill - 1) + rating_offset for skill in range(12, 26))
    anchors = tuple(
        CalibrationAnchor(skill=skill, rating=rating)
        for skill, rating in enumerate(ratings)
    )
    deltas = [right - left for left, right in zip(ratings, ratings[1:])]
    derivatives = [0.0] * 26
    derivatives[0] = max(0.0, min(3.0 * deltas[0], 1.5 * deltas[0] - 0.5 * deltas[1]))
    derivatives[-1] = max(
        0.0, min(3.0 * deltas[-1], 1.5 * deltas[-1] - 0.5 * deltas[-2])
    )
    for skill in range(1, 25):
        left = deltas[skill - 1]
        right = deltas[skill]
        derivatives[skill] = 0.0 if left * right <= 0.0 else 2.0 * left * right / (left + right)
    segments = tuple(
        PchipSegment(
            left_skill=skill,
            right_skill=skill + 1,
            c0=ratings[skill],
            c1=derivatives[skill],
            c2=3.0 * deltas[skill] - 2.0 * derivatives[skill] - derivatives[skill + 1],
            c3=derivatives[skill] + derivatives[skill + 1] - 2.0 * deltas[skill],
        )
        for skill in range(25)
    )
    return CalibrationPayload(
        schema_version=1,
        artifact_version="synthetic-v1",
        scale=EloScale(
            scale_id="synthetic.test.v1",
            protocol_version="paired-1+0-v1",
            reference_pool="synthetic-fixture",
            time_control="1+0",
        ),
        engine=EngineIdentity(
            name="Fake Komodo",
            version="14.1-test",
            binary_sha256="a" * 64,
        ),
        manifest_sha256="d" * 64,
        search_policy=SearchPolicy(
            budget_class="test-100ms-v1",
            threads=1,
            hash_mb=32,
            multipv=1,
            move_time_ms=100,
            minimum_admission_ms=125,
        ),
        seed_policy_version="sha256-lp64-v1",
        numeric_serialization_version="canonical-json-v1",
        inverse_convention="left-continuous-generalized-inverse-v1",
        anchors=anchors,
        segments=segments,
    )


def build_artifact(rating_offset: float = 0.0):
    return create_artifact(build_payload(rating_offset))
