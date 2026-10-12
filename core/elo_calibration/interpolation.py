from __future__ import annotations

from hashlib import sha256
from math import floor, isclose
from struct import pack

from .errors import ArtifactValidationError, UnsupportedRatingRange
from .models import CalibrationAnchor, PchipSegment, Side, SkillResolution


_CURVE_TOLERANCE = 1e-9
_BISECTION_ITERATIONS = 64


def evaluate_segment(segment: PchipSegment, skill: float) -> float:
    dx = skill - segment.left_skill
    return ((segment.c3 * dx + segment.c2) * dx + segment.c1) * dx + segment.c0


def _pchip_derivatives(anchors: tuple[CalibrationAnchor, ...]) -> tuple[float, ...]:
    deltas = [
        float(right.rating) - float(left.rating)
        for left, right in zip(anchors, anchors[1:])
    ]
    derivatives = [0.0] * len(anchors)

    def endpoint(first: float, second: float) -> float:
        derivative = (3.0 * first - second) / 2.0
        if derivative * first <= 0.0:
            return 0.0
        if first * second <= 0.0 and abs(derivative) > abs(3.0 * first):
            return 3.0 * first
        return derivative

    derivatives[0] = endpoint(deltas[0], deltas[1])
    derivatives[-1] = endpoint(deltas[-1], deltas[-2])
    for index in range(1, len(anchors) - 1):
        left = deltas[index - 1]
        right = deltas[index]
        derivatives[index] = (
            0.0 if left * right <= 0.0 else 2.0 * left * right / (left + right)
        )
    return tuple(derivatives)


def build_pchip_segments(
    anchors: tuple[CalibrationAnchor, ...],
) -> tuple[PchipSegment, ...]:
    if len(anchors) != 26 or tuple(anchor.skill for anchor in anchors) != tuple(range(26)):
        raise ArtifactValidationError("anchors", "must contain every integral Skill from 0 to 25")
    if any(right.rating < left.rating for left, right in zip(anchors, anchors[1:])):
        raise ArtifactValidationError("anchors.rating", "must be nondecreasing")
    derivatives = _pchip_derivatives(anchors)
    segments = tuple(
        PchipSegment(
            left_skill=index,
            right_skill=index + 1,
            c0=float(anchors[index].rating),
            c1=derivatives[index],
            c2=(
                3.0 * (anchors[index + 1].rating - anchors[index].rating)
                - 2.0 * derivatives[index]
                - derivatives[index + 1]
            ),
            c3=(
                derivatives[index]
                + derivatives[index + 1]
                - 2.0 * (anchors[index + 1].rating - anchors[index].rating)
            ),
        )
        for index in range(25)
    )
    validate_curve(anchors, segments)
    return segments


def validate_curve(
    anchors: tuple[CalibrationAnchor, ...], segments: tuple[PchipSegment, ...]
) -> None:
    if len(anchors) != 26:
        raise ArtifactValidationError("anchors", "must contain every integral Skill from 0 to 25")
    if tuple(anchor.skill for anchor in anchors) != tuple(range(26)):
        raise ArtifactValidationError("anchors.skill", "must be ordered and contiguous from 0 to 25")
    if any(right.rating < left.rating for left, right in zip(anchors, anchors[1:])):
        raise ArtifactValidationError("anchors.rating", "must be nondecreasing")
    if len(segments) != 25:
        raise ArtifactValidationError("segments", "must contain one segment per Skill interval")
    expected_derivatives = _pchip_derivatives(anchors)
    for index, segment in enumerate(segments):
        if segment.left_skill != index or segment.right_skill != index + 1:
            raise ArtifactValidationError("segments.interval", "must be ordered and contiguous")
        left_rating = anchors[index].rating
        right_rating = anchors[index + 1].rating
        if not isclose(segment.c0, left_rating, rel_tol=0.0, abs_tol=_CURVE_TOLERANCE):
            raise ArtifactValidationError("segments.c0", f"segment {index} misses its left anchor")
        if not isclose(
            evaluate_segment(segment, float(index + 1)),
            right_rating,
            rel_tol=0.0,
            abs_tol=_CURVE_TOLERANCE,
        ):
            raise ArtifactValidationError("segments", f"segment {index} misses its right anchor")
        derivative_points = [0.0, 1.0]
        if segment.c3 > 0:
            vertex = -segment.c2 / (3.0 * segment.c3)
            if 0.0 < vertex < 1.0:
                derivative_points.append(vertex)
        derivatives = [
            segment.c1 + 2.0 * segment.c2 * point + 3.0 * segment.c3 * point * point
            for point in derivative_points
        ]
        if min(derivatives) < -_CURVE_TOLERANCE:
            raise ArtifactValidationError("segments", f"segment {index} is not monotone")
        if index:
            previous = segments[index - 1]
            previous_right_derivative = previous.c1 + 2.0 * previous.c2 + 3.0 * previous.c3
            if not isclose(
                previous_right_derivative,
                segment.c1,
                rel_tol=0.0,
                abs_tol=_CURVE_TOLERANCE,
            ):
                raise ArtifactValidationError(
                    "segments", f"segment {index} is not C1-continuous"
                )
        delta = right_rating - left_rating
        expected = (
            left_rating,
            expected_derivatives[index],
            3.0 * delta
            - 2.0 * expected_derivatives[index]
            - expected_derivatives[index + 1],
            expected_derivatives[index]
            + expected_derivatives[index + 1]
            - 2.0 * delta,
        )
        actual = (segment.c0, segment.c1, segment.c2, segment.c3)
        if any(
            not isclose(value, wanted, rel_tol=0.0, abs_tol=_CURVE_TOLERANCE)
            for value, wanted in zip(actual, expected)
        ):
            raise ArtifactValidationError(
                "segments", f"segment {index} coefficients do not match PCHIP"
            )


def evaluate_curve(
    anchors: tuple[CalibrationAnchor, ...],
    segments: tuple[PchipSegment, ...],
    skill: float,
) -> float:
    if not 0.0 <= skill <= 25.0:
        raise ValueError("skill must be in [0, 25]")
    if skill == 25.0:
        return float(anchors[-1].rating)
    return evaluate_segment(segments[min(floor(skill), 24)], skill)


def generalized_inverse(
    anchors: tuple[CalibrationAnchor, ...],
    segments: tuple[PchipSegment, ...],
    target_elo: int,
) -> float:
    minimum = float(anchors[0].rating)
    maximum = float(anchors[-1].rating)
    if target_elo < minimum or target_elo > maximum:
        raise UnsupportedRatingRange(target_elo, minimum, maximum)
    for anchor in anchors:
        if target_elo == anchor.rating:
            return float(anchor.skill)
    for index, segment in enumerate(segments):
        left_rating = float(anchors[index].rating)
        right_rating = float(anchors[index + 1].rating)
        if target_elo <= left_rating:
            return float(index)
        if target_elo <= right_rating:
            low = float(index)
            high = float(index + 1)
            for _ in range(_BISECTION_ITERATIONS):
                midpoint = (low + high) / 2.0
                if evaluate_segment(segment, midpoint) >= target_elo:
                    high = midpoint
                else:
                    low = midpoint
            return high
    return 25.0


def canonical_resolution_digest(
    seed_policy_version: str,
    artifact_checksum: str,
    runtime_game_token: str,
    target_elo: int,
    side: Side,
) -> bytes:
    values = (
        seed_policy_version,
        artifact_checksum,
        runtime_game_token,
        str(target_elo),
        side.value,
    )
    encoded = bytearray()
    for value in values:
        part = value.encode("utf-8")
        encoded.extend(pack(">Q", len(part)))
        encoded.extend(part)
    return sha256(encoded).digest()


def resolve_adjacent_skill(
    latent_skill: float,
    seed_policy_version: str,
    artifact_checksum: str,
    runtime_game_token: str,
    target_elo: int,
    side: Side,
) -> SkillResolution:
    if not 0.0 <= latent_skill <= 25.0:
        raise ValueError("latent_skill must be in [0, 25]")
    lower = floor(latent_skill)
    upper = min(lower + 1, 25)
    fraction = latent_skill - lower
    digest = canonical_resolution_digest(
        seed_policy_version,
        artifact_checksum,
        runtime_game_token,
        target_elo,
        side,
    )
    unit = int.from_bytes(digest[:8], byteorder="big", signed=False) / 2**64
    applied = upper if upper != lower and unit < fraction else lower
    return SkillResolution(
        latent_skill=latent_skill,
        lower_skill=lower,
        upper_skill=upper,
        applied_skill=applied,
        resolution_key=digest.hex(),
    )
