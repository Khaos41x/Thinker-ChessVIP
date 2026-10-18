from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_EVEN
from math import isfinite
from pathlib import Path

from core.elo_calibration.artifact import artifact_to_bytes, create_artifact
from core.elo_calibration.interpolation import build_pchip_segments
from core.elo_calibration.models import CalibrationAnchor, CalibrationArtifact, CalibrationPayload, EloScale, EngineIdentity, SearchPolicy

from .io import immutable_write, write_immutable_json
from .io import load_json_bytes
from .estimate import decode_estimate
from .models import CellEstimate, FitReport
from .operational_policy import validate_operational_failures


FIT_VERSION = "weighted-pava-pchip-v1"


@dataclass(frozen=True, slots=True)
class ArtifactBuildConfig:
    artifact_version: str
    scale: EloScale
    engine: EngineIdentity
    manifest_sha256: str
    search_policy: SearchPolicy
    seed_policy_version: str = "sha256-lp64-v1"
    numeric_serialization_version: str = "canonical-json-v1"
    inverse_convention: str = "left-continuous-generalized-inverse-v1"
    decimal_precision: int = 12

    def __post_init__(self) -> None:
        if (
            isinstance(self.decimal_precision, bool)
            or not isinstance(self.decimal_precision, int)
            or self.decimal_precision <= 0
        ):
            raise ValueError("decimal_precision must be a positive integer")


def decode_build_config(raw: dict[str, object]) -> ArtifactBuildConfig:
    required = {"artifact_version", "decimal_precision", "engine", "inverse_convention", "manifest_sha256", "numeric_serialization_version", "scale", "search_policy", "seed_policy_version"}
    if set(raw) != required:
        raise ValueError("invalid artifact build config keys")
    scale = raw["scale"]
    engine = raw["engine"]
    policy = raw["search_policy"]
    return ArtifactBuildConfig(
        artifact_version=raw["artifact_version"],
        scale=EloScale(**scale),
        engine=EngineIdentity(**engine),
        manifest_sha256=raw["manifest_sha256"],
        search_policy=SearchPolicy(**policy),
        seed_policy_version=raw["seed_policy_version"],
        numeric_serialization_version=raw["numeric_serialization_version"],
        inverse_convention=raw["inverse_convention"],
        decimal_precision=raw["decimal_precision"],
    )


def weighted_pava(values: tuple[float, ...], weights: tuple[float, ...]) -> tuple[float, ...]:
    if len(values) != len(weights) or not values:
        raise ValueError("values and weights must have equal nonzero length")
    if any(not isfinite(value) for value in values):
        raise ValueError("PAVA values must be finite")
    if any(not isfinite(weight) or weight <= 0.0 for weight in weights):
        raise ValueError("PAVA weights must be finite and positive")
    blocks: list[list[float | int]] = []
    for index, (value, weight) in enumerate(zip(values, weights)):
        weighted = value * weight
        if not isfinite(weighted):
            raise ValueError("PAVA arithmetic overflow")
        blocks.append([index, index, weighted, weight])
        while len(blocks) >= 2:
            left, right = blocks[-2], blocks[-1]
            if float(left[2]) / float(left[3]) <= float(right[2]) / float(right[3]):
                break
            weighted_sum = float(left[2]) + float(right[2])
            weight_sum = float(left[3]) + float(right[3])
            if not isfinite(weighted_sum) or not isfinite(weight_sum):
                raise ValueError("PAVA arithmetic overflow")
            blocks[-2:] = [[left[0], right[1], weighted_sum, weight_sum]]
    result = [0.0] * len(values)
    for start, end, weighted_sum, weight_sum in blocks:
        fitted = float(weighted_sum) / float(weight_sum)
        for index in range(int(start), int(end) + 1):
            result[index] = fitted
    return tuple(result)


def _skill_observations(estimates: tuple[CellEstimate, ...], manifest_sha256: str) -> tuple[tuple[float, ...], tuple[float, ...]]:
    keys = [(estimate.skill, estimate.reference_id, estimate.reference_rating) for estimate in estimates]
    if len(keys) != len(set(keys)):
        raise ValueError("duplicate estimate cells are forbidden")
    sums = [0.0] * 26
    weights = [0.0] * 26
    for estimate in estimates:
        if estimate.manifest_sha256 != manifest_sha256:
            raise ValueError("estimate manifest does not match artifact config")
        if estimate.elo_delta is None:
            raise ValueError(f"Skill {estimate.skill} has an unbounded estimate")
        rating = estimate.reference_rating + estimate.elo_delta
        if not isfinite(rating) or not isfinite(estimate.weight) or estimate.weight <= 0.0:
            raise ValueError("fit inputs must be finite with positive weights")
        sums[estimate.skill] += rating * estimate.weight
        weights[estimate.skill] += estimate.weight
    missing = [skill for skill, weight in enumerate(weights) if weight <= 0.0]
    if missing:
        raise ValueError(f"missing measured Skills: {missing}")
    return tuple(total / weight for total, weight in zip(sums, weights)), tuple(weights)


def _quantize(value: float, precision: int) -> float:
    quantum = Decimal(1).scaleb(-precision)
    return float(Decimal(str(value)).quantize(quantum, rounding=ROUND_HALF_EVEN))


def build_artifact_from_estimates(estimates: tuple[CellEstimate, ...], config: ArtifactBuildConfig) -> tuple[CalibrationArtifact, FitReport]:
    raw, weights = _skill_observations(estimates, config.manifest_sha256)
    raw = tuple(_quantize(value, config.decimal_precision) for value in raw)
    isotonic = tuple(
        _quantize(value, config.decimal_precision)
        for value in weighted_pava(raw, weights)
    )
    anchors = tuple(CalibrationAnchor(skill, rating) for skill, rating in enumerate(isotonic))
    segments = build_pchip_segments(anchors)
    payload = CalibrationPayload(
        schema_version=1,
        artifact_version=config.artifact_version,
        scale=config.scale,
        engine=config.engine,
        manifest_sha256=config.manifest_sha256,
        search_policy=config.search_policy,
        seed_policy_version=config.seed_policy_version,
        numeric_serialization_version=config.numeric_serialization_version,
        inverse_convention=config.inverse_convention,
        anchors=anchors,
        segments=segments,
    )
    artifact = create_artifact(payload)
    return artifact, FitReport(1, FIT_VERSION, config.manifest_sha256, raw, isotonic, weights, artifact.checksum)


def write_fit_outputs(artifact_path: str | Path, report_path: str | Path, artifact: CalibrationArtifact, report: FitReport) -> None:
    immutable_write(artifact_path, artifact_to_bytes(artifact))
    write_immutable_json(report_path, report)


def main() -> int:
    parser = argparse.ArgumentParser(description="Fit a weighted isotonic PCHIP calibration artifact")
    parser.add_argument("--estimates", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    raw_estimates = load_json_bytes(Path(args.estimates).read_bytes())
    if set(raw_estimates) != {"estimatorVersion", "estimates", "operationalFailures", "recordCount"} or raw_estimates["estimatorVersion"] != "pentanomial-delta-v1":
        parser.error("unsupported estimates document")
    try:
        validate_operational_failures(raw_estimates["operationalFailures"], raw_estimates["recordCount"])
    except ValueError as error:
        parser.error(str(error))
    estimates = tuple(decode_estimate(item) for item in raw_estimates["estimates"])
    config = decode_build_config(load_json_bytes(Path(args.config).read_bytes()))
    artifact, report = build_artifact_from_estimates(estimates, config)
    write_fit_outputs(args.artifact, args.report, artifact, report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
