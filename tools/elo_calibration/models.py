from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import isclose, isfinite, log10


def _text(value: str, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")


def _digest(value: str, field: str) -> None:
    if not isinstance(value, str) or len(value) != 64 or any(c not in "0123456789abcdef" for c in value):
        raise ValueError(f"{field} must be a lowercase SHA-256 digest")


class SubjectColor(str, Enum):
    WHITE = "white"
    BLACK = "black"


class EngineRole(str, Enum):
    SUBJECT = "subject"
    REFERENCE = "reference"


class GameOutcome(str, Enum):
    WHITE_WIN = "1-0"
    DRAW = "1/2-1/2"
    BLACK_WIN = "0-1"


class FailureKind(str, Enum):
    CRASH = "crash"
    TIMEOUT = "timeout"
    ILLEGAL_MOVE = "illegal_move"
    MAX_PLY = "max_ply"


@dataclass(frozen=True, slots=True)
class MatchCell:
    skill: int
    reference_id: str
    reference_rating: float
    opening_id: str
    opening_fen: str

    def __post_init__(self) -> None:
        if isinstance(self.skill, bool) or not isinstance(self.skill, int) or not 0 <= self.skill <= 25:
            raise ValueError("skill must be an integer in [0, 25]")
        for name in ("reference_id", "opening_id", "opening_fen"):
            _text(getattr(self, name), name)
        if (
            isinstance(self.reference_rating, bool)
            or not isinstance(self.reference_rating, (int, float))
            or not isfinite(self.reference_rating)
        ):
            raise ValueError("reference_rating must be finite")


@dataclass(frozen=True, slots=True)
class BenchmarkPlan:
    schema_version: int
    manifest_sha256: str
    subject_id: str
    subject_binary_sha256: str
    reference_binaries: tuple[tuple[str, str], ...]
    move_time_ms: int
    max_plies: int
    concurrency: int
    cells: tuple[MatchCell, ...]
    corpus_sha256: str
    hardware_fingerprint: str
    tool_versions: tuple[tuple[str, str], ...]
    scale_id: str
    reference_protocol: str
    search_state_policy: str
    seed_schedule_version: str
    tablebase_policy: str
    estimator_version: str
    confidence_version: str
    fit_version: str
    isotonic_weight_version: str
    pchip_version: str
    inverse_convention: str
    numeric_serialization_version: str
    decimal_precision: int
    validation_version: str
    holdout_fraction: float
    point_equivalence_elo: float
    interval_equivalence_elo: float
    minimum_pairs_per_cell: int
    baseline_nps: float
    maximum_nps_drift_fraction: float
    maximum_color_score_difference: float
    maximum_operational_failures: int
    stopping_rule: str
    game_id_version: str = "sha256-canonical-json-v1"
    pair_id_version: str = "sha256-canonical-json-v1"
    subject_options: tuple[tuple[str, str | int | bool], ...] = ()
    reference_options: tuple[tuple[str, tuple[tuple[str, str | int | bool], ...]], ...] = ()

    def __post_init__(self) -> None:
        if self.schema_version != 1:
            raise ValueError("schema_version must equal 1")
        _digest(self.manifest_sha256, "manifest_sha256")
        _text(self.subject_id, "subject_id")
        _digest(self.subject_binary_sha256, "subject_binary_sha256")
        if not isinstance(self.reference_binaries, tuple) or not self.reference_binaries:
            raise ValueError("reference_binaries must be a non-empty tuple")
        reference_hashes = dict(self.reference_binaries)
        if len(reference_hashes) != len(self.reference_binaries):
            raise ValueError("reference_binaries contains duplicate reference IDs")
        for reference, digest in self.reference_binaries:
            _text(reference, "reference_binaries.reference")
            _digest(digest, "reference_binaries.sha256")
        if any(isinstance(v, bool) or not isinstance(v, int) or v <= 0 for v in (self.move_time_ms, self.max_plies, self.concurrency)):
            raise ValueError("move_time_ms, max_plies, and concurrency must be positive integers")
        if self.concurrency != 1:
            raise ValueError("the python-chess runner supports concurrency=1")
        if not isinstance(self.cells, tuple) or not self.cells or not all(isinstance(c, MatchCell) for c in self.cells):
            raise ValueError("cells must be a non-empty immutable tuple")
        if len(set(self.cells)) != len(self.cells):
            raise ValueError("benchmark plan contains duplicate cells")
        _digest(self.corpus_sha256, "corpus_sha256")
        _text(self.hardware_fingerprint, "hardware_fingerprint")
        if not isinstance(self.tool_versions, tuple) or not self.tool_versions:
            raise ValueError("tool_versions must be a non-empty immutable tuple")
        if len({name for name, _ in self.tool_versions}) != len(self.tool_versions):
            raise ValueError("tool_versions contains duplicate names")
        for name, version in self.tool_versions:
            _text(name, "tool_versions.name")
            _text(version, "tool_versions.version")
        if self.estimator_version != "pentanomial-delta-v1":
            raise ValueError("unsupported estimator_version")
        if self.fit_version != "weighted-pava-pchip-v1":
            raise ValueError("unsupported fit_version")
        if self.validation_version != "independent-hash-holdout-v1":
            raise ValueError("unsupported validation_version")
        for name in (
            "scale_id",
            "reference_protocol",
            "search_state_policy",
            "seed_schedule_version",
            "tablebase_policy",
            "confidence_version",
            "isotonic_weight_version",
            "pchip_version",
            "inverse_convention",
            "numeric_serialization_version",
            "stopping_rule",
        ):
            _text(getattr(self, name), name)
        if isinstance(self.decimal_precision, bool) or not isinstance(self.decimal_precision, int) or self.decimal_precision <= 0:
            raise ValueError("decimal_precision must be a positive integer")
        numeric_policy = (
            self.holdout_fraction,
            self.point_equivalence_elo,
            self.interval_equivalence_elo,
            self.baseline_nps,
            self.maximum_nps_drift_fraction,
            self.maximum_color_score_difference,
        )
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value) for value in numeric_policy):
            raise ValueError("benchmark policy values must be finite numbers")
        if not 0.0 < self.holdout_fraction < 1.0:
            raise ValueError("holdout_fraction must be in (0, 1)")
        if self.point_equivalence_elo <= 0.0 or self.interval_equivalence_elo < self.point_equivalence_elo:
            raise ValueError("invalid Elo equivalence thresholds")
        if isinstance(self.minimum_pairs_per_cell, bool) or not isinstance(self.minimum_pairs_per_cell, int) or self.minimum_pairs_per_cell <= 0:
            raise ValueError("minimum_pairs_per_cell must be a positive integer")
        if self.baseline_nps <= 0.0 or not 0.0 <= self.maximum_nps_drift_fraction < 1.0:
            raise ValueError("invalid NPS envelope")
        if not 0.0 <= self.maximum_color_score_difference <= 1.0:
            raise ValueError("maximum_color_score_difference must be in [0, 1]")
        if isinstance(self.maximum_operational_failures, bool) or not isinstance(self.maximum_operational_failures, int) or self.maximum_operational_failures < 0:
            raise ValueError("maximum_operational_failures must be a non-negative integer")
        if not isinstance(self.subject_options, tuple) or not isinstance(self.reference_options, tuple):
            raise ValueError("UCI option collections must be immutable tuples")
        _text(self.game_id_version, "game_id_version")
        _text(self.pair_id_version, "pair_id_version")
        if len({name for name, _ in self.subject_options}) != len(self.subject_options):
            raise ValueError("subject_options contains duplicate names")
        if len({reference for reference, _ in self.reference_options}) != len(self.reference_options):
            raise ValueError("reference_options contains duplicate reference IDs")
        referenced = {cell.reference_id for cell in self.cells}
        if referenced - set(reference_hashes):
            raise ValueError("every reference cell must have a binary fingerprint")
        if referenced - {reference for reference, _ in self.reference_options}:
            raise ValueError("every reference cell must have explicit UCI options")
        for name, value in self.subject_options:
            _text(name, "subject_options.name")
            if not isinstance(value, (str, int, bool)):
                raise ValueError("subject option values must be scalar")
        subject = dict(self.subject_options)
        required_subject = {"Threads", "Hash", "MultiPV", "Ponder"}
        if required_subject - set(subject):
            raise ValueError("subject_options is missing required fixed options")
        if subject["MultiPV"] != 1 or subject["Ponder"] is not False:
            raise ValueError("subject_options requires MultiPV=1 and Ponder=false")
        if any(isinstance(subject[name], bool) or not isinstance(subject[name], int) or subject[name] <= 0 for name in ("Threads", "Hash")):
            raise ValueError("subject Threads and Hash must be positive integers")
        forbidden = {"skill", "depth", "nodes", "movetime"}
        if forbidden & {name.casefold() for name in subject}:
            raise ValueError("subject_options contains a strength or search-limit option")
        for reference, options in self.reference_options:
            _text(reference, "reference_options.reference")
            if not isinstance(options, tuple) or not options:
                raise ValueError("reference options must be a non-empty tuple")
            if len({name for name, _ in options}) != len(options):
                raise ValueError("reference options contain duplicate names")
            for name, value in options:
                _text(name, "reference_options.name")
                if not isinstance(value, (str, int, bool)):
                    raise ValueError("reference option values must be scalar")
            fixed = dict(options)
            if {"Threads", "Hash", "MultiPV", "Ponder"} - set(fixed):
                raise ValueError("reference options are missing required fixed options")
            if fixed["MultiPV"] != 1 or fixed["Ponder"] is not False:
                raise ValueError("reference options require MultiPV=1 and Ponder=false")
            if any(isinstance(fixed[name], bool) or not isinstance(fixed[name], int) or fixed[name] <= 0 for name in ("Threads", "Hash")):
                raise ValueError("reference Threads and Hash must be positive integers")
            if {"depth", "nodes", "movetime"} & {name.casefold() for name in fixed}:
                raise ValueError("reference options contain a search-limit option")


@dataclass(frozen=True, slots=True)
class MoveTelemetry:
    ply: int
    uci: str
    nodes: int
    elapsed_seconds: float
    actor: EngineRole

    def __post_init__(self) -> None:
        if any(isinstance(v, bool) or not isinstance(v, int) for v in (self.ply, self.nodes)) or self.ply <= 0 or self.nodes < 0 or not isinstance(self.elapsed_seconds, (int, float)) or self.elapsed_seconds <= 0 or not isfinite(self.elapsed_seconds):
            raise ValueError("invalid move telemetry")
        _text(self.uci, "uci")
        if not isinstance(self.actor, EngineRole):
            raise ValueError("actor must be an EngineRole")


@dataclass(frozen=True, slots=True)
class GameRecord:
    game_id: str
    subject_color: SubjectColor
    outcome: GameOutcome | None
    failure: FailureKind | None
    termination: str
    moves: tuple[str, ...]
    telemetry: tuple[MoveTelemetry, ...]

    def __post_init__(self) -> None:
        _digest(self.game_id, "game_id")
        if not isinstance(self.subject_color, SubjectColor):
            raise ValueError("subject_color must be a SubjectColor")
        if self.outcome is not None and not isinstance(self.outcome, GameOutcome):
            raise ValueError("outcome must be a GameOutcome")
        if self.failure is not None and not isinstance(self.failure, FailureKind):
            raise ValueError("failure must be a FailureKind")
        if (self.outcome is None) == (self.failure is None):
            raise ValueError("exactly one of outcome or failure is required")
        _text(self.termination, "termination")
        if not isinstance(self.moves, tuple) or not isinstance(self.telemetry, tuple):
            raise ValueError("moves and telemetry must be tuples")
        if not all(isinstance(move, str) and move for move in self.moves):
            raise ValueError("moves must contain non-empty UCI strings")
        if not all(isinstance(move, MoveTelemetry) for move in self.telemetry):
            raise ValueError("telemetry entries must be MoveTelemetry values")
        if len(self.moves) != len(self.telemetry):
            raise ValueError("moves and telemetry must have equal length")
        if tuple(move.ply for move in self.telemetry) != tuple(range(1, len(self.telemetry) + 1)):
            raise ValueError("telemetry plies must be contiguous")
        if tuple(move.uci for move in self.telemetry) != self.moves:
            raise ValueError("moves and telemetry UCI values must match")


@dataclass(frozen=True, slots=True)
class PairRecord:
    schema_version: int
    pair_id: str
    manifest_sha256: str
    skill: int
    reference_id: str
    reference_rating: float
    opening_id: str
    opening_fen: str
    games: tuple[GameRecord, GameRecord]

    def __post_init__(self) -> None:
        if (
            self.schema_version != 1
            or isinstance(self.skill, bool)
            or not isinstance(self.skill, int)
            or not 0 <= self.skill <= 25
        ):
            raise ValueError("invalid pair schema or skill")
        _digest(self.pair_id, "pair_id")
        _digest(self.manifest_sha256, "manifest_sha256")
        for name in ("reference_id", "opening_id", "opening_fen"):
            _text(getattr(self, name), name)
        if len(self.games) != 2 or tuple(g.subject_color for g in self.games) != (SubjectColor.WHITE, SubjectColor.BLACK):
            raise ValueError("games must be the white/black subject pair")
        if (
            isinstance(self.reference_rating, bool)
            or not isinstance(self.reference_rating, (int, float))
            or not isfinite(self.reference_rating)
        ):
            raise ValueError("reference_rating must be finite")

    @property
    def estimable(self) -> bool:
        return all(game.outcome is not None for game in self.games)


@dataclass(frozen=True, slots=True)
class CellEstimate:
    schema_version: int
    estimator_version: str
    manifest_sha256: str
    skill: int
    reference_id: str
    reference_rating: float
    counts: tuple[int, int, int, int, int]
    pair_count: int
    score: float
    elo_delta: float | None
    ci_low: float | None
    ci_high: float | None
    weight: float
    boundary: str | None

    def __post_init__(self) -> None:
        if self.schema_version != 1 or self.estimator_version != "pentanomial-delta-v1":
            raise ValueError("unsupported estimate schema or estimator")
        _digest(self.manifest_sha256, "manifest_sha256")
        _text(self.reference_id, "reference_id")
        if isinstance(self.skill, bool) or not isinstance(self.skill, int) or not 0 <= self.skill <= 25 or len(self.counts) != 5 or any(isinstance(v, bool) or not isinstance(v, int) or v < 0 for v in self.counts):
            raise ValueError("invalid pentanomial counts")
        if self.pair_count != sum(self.counts) or self.pair_count <= 0:
            raise ValueError("pair_count must equal the pentanomial total")
        if not 0.0 <= self.score <= 1.0 or not isfinite(self.score):
            raise ValueError("score must be finite and in [0, 1]")
        if not isfinite(self.reference_rating) or not isfinite(self.weight) or self.weight <= 0.0:
            raise ValueError("reference rating and weight must be finite; weight must be positive")
        for value in (self.elo_delta, self.ci_low, self.ci_high):
            if value is not None and not isfinite(value):
                raise ValueError("estimate values must be finite or null")
        if self.boundary not in (None, "negative_infinity", "positive_infinity"):
            raise ValueError("unsupported estimate boundary")
        expected_score = sum(index * count for index, count in enumerate(self.counts)) / (4.0 * self.pair_count)
        if not isclose(self.score, expected_score, rel_tol=0.0, abs_tol=1e-12):
            raise ValueError("score contradicts pentanomial counts")
        if self.score == 0.0:
            if self.boundary != "negative_infinity" or any(value is not None for value in (self.elo_delta, self.ci_low, self.ci_high)):
                raise ValueError("negative boundary fields are inconsistent")
        elif self.score == 1.0:
            if self.boundary != "positive_infinity" or any(value is not None for value in (self.elo_delta, self.ci_low, self.ci_high)):
                raise ValueError("positive boundary fields are inconsistent")
        else:
            expected_delta = 400.0 * log10(self.score / (1.0 - self.score))
            if (
                self.boundary is not None
                or self.elo_delta is None
                or self.ci_low is None
                or self.ci_high is None
                or not isclose(self.elo_delta, expected_delta, rel_tol=0.0, abs_tol=1e-9)
                or not self.ci_low <= self.elo_delta <= self.ci_high
            ):
                raise ValueError("finite estimate fields are inconsistent")


@dataclass(frozen=True, slots=True)
class FitReport:
    schema_version: int
    fit_version: str
    manifest_sha256: str
    raw_ratings: tuple[float, ...]
    isotonic_ratings: tuple[float, ...]
    weights: tuple[float, ...]
    artifact_checksum: str

    def __post_init__(self) -> None:
        if self.schema_version != 1 or self.fit_version != "weighted-pava-pchip-v1":
            raise ValueError("unsupported fit report")
        _digest(self.manifest_sha256, "manifest_sha256")
        _digest(self.artifact_checksum, "artifact_checksum")
        if not (len(self.raw_ratings) == len(self.isotonic_ratings) == len(self.weights) == 26):
            raise ValueError("fit report must contain all 26 Skills")
        if any(not isfinite(value) for value in self.raw_ratings + self.isotonic_ratings):
            raise ValueError("fit ratings must be finite")
        if any(not isfinite(weight) or weight <= 0.0 for weight in self.weights):
            raise ValueError("fit weights must be finite and positive")


@dataclass(frozen=True, slots=True)
class ValidationReport:
    schema_version: int
    validation_version: str
    artifact_checksum: str
    manifest_sha256: str
    point_equivalence_elo: float
    interval_equivalence_elo: float
    minimum_pairs_per_cell: int
    baseline_nps: float
    maximum_nps_drift_fraction: float
    maximum_color_score_difference: float
    maximum_operational_failures: int
    holdout_fraction: float
    byte_rebuild_equal: bool
    training_record_count: int
    holdout_record_count: int
    holdout_count: int
    holdout_skill_count: int
    training_records_sha256: str
    holdout_records_sha256: str
    max_point_error: float | None
    max_interval_error: float | None
    operational_failure_count: int
    observed_nps: float | None
    nps_drift_fraction: float | None
    color_score_difference: float | None
    passed: bool
    reasons: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.schema_version != 1 or self.validation_version != "independent-hash-holdout-v1":
            raise ValueError("unsupported validation report")
        _digest(self.artifact_checksum, "artifact_checksum")
        _digest(self.manifest_sha256, "manifest_sha256")
        _digest(self.training_records_sha256, "training_records_sha256")
        _digest(self.holdout_records_sha256, "holdout_records_sha256")
        if not 0.0 < self.holdout_fraction < 1.0:
            raise ValueError("holdout_fraction must be in (0, 1)")
        if self.point_equivalence_elo <= 0.0 or self.interval_equivalence_elo < self.point_equivalence_elo:
            raise ValueError("invalid validation equivalence thresholds")
        if self.minimum_pairs_per_cell <= 0 or self.maximum_operational_failures < 0:
            raise ValueError("invalid validation count thresholds")
        if self.baseline_nps <= 0.0:
            raise ValueError("baseline_nps must be positive")
        if not 0.0 <= self.maximum_nps_drift_fraction < 1.0:
            raise ValueError("maximum_nps_drift_fraction must be in [0, 1)")
        if not 0.0 <= self.maximum_color_score_difference <= 1.0:
            raise ValueError("maximum_color_score_difference must be in [0, 1]")
        if any(value < 0 for value in (self.training_record_count, self.holdout_record_count, self.holdout_count, self.holdout_skill_count, self.operational_failure_count)):
            raise ValueError("validation counts must be non-negative")
        for value in (
            self.max_point_error,
            self.max_interval_error,
            self.observed_nps,
            self.nps_drift_fraction,
            self.color_score_difference,
        ):
            if value is not None and (not isfinite(value) or value < 0.0):
                raise ValueError("validation errors must be finite and non-negative")
        if self.passed == bool(self.reasons):
            raise ValueError("passed verdict and reasons disagree")


@dataclass(frozen=True, slots=True)
class ValidationAttestation:
    schema_version: int
    artifact_checksum: str
    manifest_sha256: str
    report_sha256: str
    approver_role: str
    verdict: str

    def __post_init__(self) -> None:
        if self.schema_version != 1:
            raise ValueError("unsupported attestation schema")
        for name in ("artifact_checksum", "manifest_sha256", "report_sha256"):
            _digest(getattr(self, name), name)
        _text(self.approver_role, "approver_role")
        if self.verdict not in ("pass", "fail"):
            raise ValueError("verdict must be pass or fail")
