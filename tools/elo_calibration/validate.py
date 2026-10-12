from __future__ import annotations

import argparse
from dataclasses import dataclass
from hashlib import sha256
from math import isfinite
from pathlib import Path

from core.elo_calibration.artifact import artifact_to_bytes, load_artifact_bytes

from .estimate import estimate_cells
from .fit_curve import ArtifactBuildConfig, build_artifact_from_estimates, decode_build_config
from .io import content_sha256, load_json_bytes, write_immutable_json
from .models import BenchmarkPlan, EngineRole, GameOutcome, PairRecord, SubjectColor, ValidationAttestation, ValidationReport
from .run_matches import decode_pair, decode_plan


VALIDATION_VERSION = "independent-hash-holdout-v1"


@dataclass(frozen=True, slots=True)
class ValidationGates:
    holdout_fraction: float
    point_equivalence_elo: float
    interval_equivalence_elo: float
    minimum_pairs_per_cell: int
    baseline_nps: float
    maximum_nps_drift_fraction: float
    maximum_color_score_difference: float
    maximum_operational_failures: int = 0

    @classmethod
    def from_plan(cls, plan: BenchmarkPlan) -> ValidationGates:
        return cls(
            plan.holdout_fraction,
            plan.point_equivalence_elo,
            plan.interval_equivalence_elo,
            plan.minimum_pairs_per_cell,
            plan.baseline_nps,
            plan.maximum_nps_drift_fraction,
            plan.maximum_color_score_difference,
            plan.maximum_operational_failures,
        )

    def __post_init__(self) -> None:
        numeric = (
            self.holdout_fraction,
            self.point_equivalence_elo,
            self.interval_equivalence_elo,
            self.baseline_nps,
            self.maximum_nps_drift_fraction,
            self.maximum_color_score_difference,
        )
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value) for value in numeric):
            raise ValueError("validation gates must be finite numbers")
        if not 0.0 < self.holdout_fraction < 1.0:
            raise ValueError("holdout_fraction must be in (0, 1)")
        if self.point_equivalence_elo <= 0.0 or self.interval_equivalence_elo < self.point_equivalence_elo:
            raise ValueError("invalid equivalence gates")
        if self.maximum_operational_failures < 0:
            raise ValueError("maximum_operational_failures must be non-negative")
        if self.minimum_pairs_per_cell <= 0:
            raise ValueError("minimum_pairs_per_cell must be positive")
        if self.baseline_nps <= 0.0:
            raise ValueError("baseline_nps must be positive")
        if not 0.0 <= self.maximum_nps_drift_fraction < 1.0:
            raise ValueError("maximum_nps_drift_fraction must be in [0, 1)")
        if not 0.0 <= self.maximum_color_score_difference <= 1.0:
            raise ValueError("maximum_color_score_difference must be in [0, 1]")


def is_holdout(pair_id: str, fraction: float) -> bool:
    bucket = int.from_bytes(sha256((VALIDATION_VERSION + pair_id).encode("ascii")).digest()[:8], "big") / 2**64
    return bucket < fraction


def split_records(records: tuple[PairRecord, ...], fraction: float) -> tuple[tuple[PairRecord, ...], tuple[PairRecord, ...]]:
    pair_ids = [record.pair_id for record in records]
    if len(set(pair_ids)) != len(pair_ids):
        raise ValueError("duplicate pair IDs are forbidden")
    training = tuple(record for record in records if not is_holdout(record.pair_id, fraction))
    holdout = tuple(record for record in records if is_holdout(record.pair_id, fraction))
    return training, holdout


def _game_score(outcome: GameOutcome, color: SubjectColor) -> float:
    if outcome is GameOutcome.DRAW:
        return 0.5
    subject_won = (outcome is GameOutcome.WHITE_WIN) == (color is SubjectColor.WHITE)
    return 1.0 if subject_won else 0.0


def validate_artifact(
    candidate_bytes: bytes,
    training_records: tuple[PairRecord, ...],
    holdout_records: tuple[PairRecord, ...],
    config: ArtifactBuildConfig,
    gates: ValidationGates,
    approver_role: str,
) -> tuple[ValidationReport, ValidationAttestation]:
    training_ids = {record.pair_id for record in training_records}
    holdout_ids = {record.pair_id for record in holdout_records}
    if len(training_ids) != len(training_records) or len(holdout_ids) != len(holdout_records):
        raise ValueError("duplicate pair IDs are forbidden")
    if training_ids & holdout_ids:
        raise ValueError("training and holdout records overlap")
    all_records = training_records + holdout_records
    if any(record.manifest_sha256 != config.manifest_sha256 for record in all_records):
        raise ValueError("record manifest does not match artifact config")
    candidate = load_artifact_bytes(candidate_bytes)
    if candidate.payload.manifest_sha256 != config.manifest_sha256:
        raise ValueError("candidate manifest does not match artifact config")
    rebuilt, _ = build_artifact_from_estimates(estimate_cells(training_records), config)
    rebuild_equal = artifact_to_bytes(rebuilt) == candidate_bytes
    operational_failures = sum(not record.estimable for record in all_records)
    holdout_estimates = estimate_cells(holdout_records)
    point_errors: list[float] = []
    interval_errors: list[float] = []
    reasons: list[str] = []
    for estimate in holdout_estimates:
        if estimate.elo_delta is None:
            reasons.append(f"unbounded holdout estimate at Skill {estimate.skill}")
            continue
        predicted = float(candidate.payload.anchors[estimate.skill].rating)
        observed = estimate.reference_rating + estimate.elo_delta
        point_errors.append(abs(predicted - observed))
        if estimate.ci_low is None or estimate.ci_high is None:
            reasons.append(f"unbounded holdout interval at Skill {estimate.skill}")
        else:
            low = estimate.reference_rating + estimate.ci_low
            high = estimate.reference_rating + estimate.ci_high
            interval_errors.append(max(abs(predicted - low), abs(high - predicted)))
    telemetry = tuple(
        move
        for record in holdout_records
        for game in record.games
        for move in game.telemetry
        if move.actor is EngineRole.SUBJECT
    )
    total_seconds = sum(move.elapsed_seconds for move in telemetry)
    observed_nps = (
        sum(move.nodes for move in telemetry) / total_seconds if total_seconds > 0.0 else None
    )
    nps_drift = (
        abs(observed_nps - gates.baseline_nps) / gates.baseline_nps
        if observed_nps is not None
        else None
    )
    color_scores: dict[SubjectColor, list[float]] = {
        SubjectColor.WHITE: [],
        SubjectColor.BLACK: [],
    }
    for record in holdout_records:
        if not record.estimable:
            continue
        for game in record.games:
            color_scores[game.subject_color].append(
                _game_score(game.outcome, game.subject_color)
            )
    color_difference = None
    if all(color_scores.values()):
        white = sum(color_scores[SubjectColor.WHITE]) / len(color_scores[SubjectColor.WHITE])
        black = sum(color_scores[SubjectColor.BLACK]) / len(color_scores[SubjectColor.BLACK])
        color_difference = abs(white - black)
    max_point = max(point_errors) if point_errors else None
    max_interval = max(interval_errors) if interval_errors else None
    if not rebuild_equal:
        reasons.append("candidate artifact is not a byte-identical rebuild")
    if not holdout_estimates:
        reasons.append("holdout contains no estimable cells")
    holdout_skills = {estimate.skill for estimate in holdout_estimates}
    if holdout_skills != set(range(26)):
        reasons.append("holdout Skill coverage gate failed")
    completed_by_cell: dict[tuple[int, str, float], int] = {}
    for record in all_records:
        key = (record.skill, record.reference_id, record.reference_rating)
        completed_by_cell.setdefault(key, 0)
        if record.estimable:
            completed_by_cell[key] += 1
    if any(count < gates.minimum_pairs_per_cell for count in completed_by_cell.values()):
        reasons.append("minimum completed pairs gate failed")
    if max_point is None or max_point > gates.point_equivalence_elo:
        reasons.append("point equivalence gate failed")
    if max_interval is None or max_interval > gates.interval_equivalence_elo:
        reasons.append("interval equivalence gate failed")
    if operational_failures > gates.maximum_operational_failures:
        reasons.append("operational failure gate failed")
    if nps_drift is None or nps_drift > gates.maximum_nps_drift_fraction:
        reasons.append("NPS drift gate failed")
    if (
        color_difference is None
        or color_difference > gates.maximum_color_score_difference
    ):
        reasons.append("color balance gate failed")
    report = ValidationReport(
        1,
        VALIDATION_VERSION,
        candidate.checksum,
        config.manifest_sha256,
        gates.point_equivalence_elo,
        gates.interval_equivalence_elo,
        gates.minimum_pairs_per_cell,
        gates.baseline_nps,
        gates.maximum_nps_drift_fraction,
        gates.maximum_color_score_difference,
        gates.maximum_operational_failures,
        gates.holdout_fraction,
        rebuild_equal,
        len(training_records),
        len(holdout_records),
        sum(estimate.pair_count for estimate in holdout_estimates),
        len(holdout_skills),
        content_sha256(tuple(sorted(training_records, key=lambda record: record.pair_id))),
        content_sha256(tuple(sorted(holdout_records, key=lambda record: record.pair_id))),
        max_point,
        max_interval,
        operational_failures,
        observed_nps,
        nps_drift,
        color_difference,
        not reasons,
        tuple(reasons),
    )
    report_sha = content_sha256(report)
    attestation = ValidationAttestation(
        1,
        candidate.checksum,
        config.manifest_sha256,
        report_sha,
        approver_role,
        "pass" if report.passed else "fail",
    )
    return report, attestation


def write_validation_outputs(report_path: str | Path, attestation_path: str | Path, report: ValidationReport, attestation: ValidationAttestation) -> None:
    write_immutable_json(report_path, report)
    write_immutable_json(attestation_path, attestation)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a calibration artifact against an independent holdout")
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--records", nargs="+", required=True)
    parser.add_argument("--plan", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--attestation", required=True)
    parser.add_argument("--approver-role", required=True)
    args = parser.parse_args()
    records = tuple(decode_pair(Path(path).read_bytes()) for path in args.records)
    plan = decode_plan(Path(args.plan).read_bytes())
    gates = ValidationGates.from_plan(plan)
    training, holdout = split_records(records, gates.holdout_fraction)
    config = decode_build_config(load_json_bytes(Path(args.config).read_bytes()))
    subject_options = dict(plan.subject_options)
    if (
        config.manifest_sha256 != plan.manifest_sha256
        or config.scale.scale_id != plan.scale_id
        or config.scale.protocol_version != plan.reference_protocol
        or config.engine.binary_sha256 != plan.subject_binary_sha256
        or config.search_policy.move_time_ms != plan.move_time_ms
        or config.search_policy.threads != subject_options["Threads"]
        or config.search_policy.hash_mb != subject_options["Hash"]
        or config.inverse_convention != plan.inverse_convention
        or config.numeric_serialization_version != plan.numeric_serialization_version
        or config.decimal_precision != plan.decimal_precision
    ):
        parser.error("artifact config does not match the immutable benchmark plan")
    report, attestation = validate_artifact(Path(args.artifact).read_bytes(), training, holdout, config, gates, args.approver_role)
    write_validation_outputs(args.report, args.attestation, report, attestation)
    return 0 if report.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
