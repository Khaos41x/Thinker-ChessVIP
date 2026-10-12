from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import isfinite
from typing import Any

from .errors import ArtifactValidationError, ValidationError


def _nonempty(value: str, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(field, "must be a non-empty string")


def _sha256(value: str, field: str) -> None:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise ValidationError(field, "must be a lowercase SHA-256 hex digest")


class Side(str, Enum):
    WHITE = "white"
    BLACK = "black"


@dataclass(frozen=True, slots=True)
class EloScale:
    scale_id: str
    protocol_version: str
    reference_pool: str
    time_control: str

    def __post_init__(self) -> None:
        for field in ("scale_id", "protocol_version", "reference_pool", "time_control"):
            _nonempty(getattr(self, field), field)


@dataclass(frozen=True, slots=True)
class EngineIdentity:
    name: str
    version: str
    binary_sha256: str

    def __post_init__(self) -> None:
        _nonempty(self.name, "engine.name")
        _nonempty(self.version, "engine.version")
        _sha256(self.binary_sha256, "engine.binarySha256")


UciOptionValue = str | int | bool


@dataclass(frozen=True, slots=True)
class EngineConfiguration:
    identity: EngineIdentity
    uci_options: tuple[tuple[str, UciOptionValue], ...]

    def __post_init__(self) -> None:
        if not isinstance(self.identity, EngineIdentity):
            raise ValidationError("engineConfiguration.identity", "must be an EngineIdentity")
        if not isinstance(self.uci_options, tuple) or not self.uci_options:
            raise ValidationError("engineConfiguration.uciOptions", "must be a non-empty tuple")
        names: set[str] = set()
        for option in self.uci_options:
            if not isinstance(option, tuple) or len(option) != 2:
                raise ValidationError(
                    "engineConfiguration.uciOptions", "entries must be name/value tuples"
                )
            name, value = option
            _nonempty(name, "engineConfiguration.uciOptions.name")
            if name in names:
                raise ValidationError(
                    "engineConfiguration.uciOptions", f"duplicate option {name}"
                )
            if not isinstance(value, (str, int, bool)):
                raise ValidationError(
                    "engineConfiguration.uciOptions.value", "must be string, integer, or boolean"
                )
            names.add(name)


@dataclass(frozen=True, slots=True)
class SearchPolicy:
    budget_class: str
    threads: int
    hash_mb: int
    multipv: int
    move_time_ms: int
    minimum_admission_ms: int
    clear_hash_before_search: bool = True
    wait_ready: bool = True
    ponder: bool = False
    tablebases: bool = False

    def __post_init__(self) -> None:
        _nonempty(self.budget_class, "searchPolicy.budgetClass")
        for field in (
            "threads",
            "hash_mb",
            "multipv",
            "move_time_ms",
            "minimum_admission_ms",
        ):
            value = getattr(self, field)
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                raise ValidationError(f"searchPolicy.{field}", "must be a positive integer")
        if self.multipv != 1:
            raise ValidationError("searchPolicy.multipv", "must equal 1 in schema v1")
        if self.minimum_admission_ms < self.move_time_ms:
            raise ValidationError(
                "searchPolicy.minimumAdmissionMs", "must cover at least the move-time budget"
            )
        if not self.clear_hash_before_search:
            raise ValidationError(
                "searchPolicy.clearHashBeforeSearch", "must be true in schema v1"
            )
        if not self.wait_ready:
            raise ValidationError("searchPolicy.waitReady", "must be true in schema v1")
        if self.tablebases:
            raise ValidationError(
                "searchPolicy.tablebases", "must be false until tablebase data is fingerprinted"
            )
        for field in ("clear_hash_before_search", "wait_ready", "ponder", "tablebases"):
            if not isinstance(getattr(self, field), bool):
                raise ValidationError(f"searchPolicy.{field}", "must be boolean")


@dataclass(frozen=True, slots=True)
class ExperimentManifest:
    schema_version: int
    manifest_id: str
    scale: EloScale
    subject: EngineConfiguration
    reference_ladder: tuple[EngineConfiguration, ...]
    search_policy: SearchPolicy
    opening_corpus_sha256: str
    opening_pair_count: int
    color_reversal: bool
    seed_policy_version: str
    seed_schedule_sha256: str
    concurrency: int
    hardware_fingerprint: str
    baseline_nps: float
    estimator_version: str
    confidence_method: str
    minimum_pairs: int
    maximum_pairs: int
    stopping_rule: str
    holdout_fraction: float
    holdout_split_version: str
    game_id_version: str
    pair_id_version: str
    subject_perspective: str
    result_enum_version: str
    exclusion_policy_version: str
    pentanomial_order: tuple[str, str, str, str, str]
    isotonic_weight_version: str
    pchip_convention: str
    inverse_convention: str
    decimal_precision: int
    tool_versions: tuple[tuple[str, str], ...]
    point_equivalence_elo: float
    interval_equivalence_elo: float
    nps_drift_fraction: float

    def __post_init__(self) -> None:
        if isinstance(self.schema_version, bool) or not isinstance(self.schema_version, int) or self.schema_version != 1:
            raise ValidationError("manifest.schemaVersion", "must equal 1")
        for field in (
            "manifest_id",
            "seed_policy_version",
            "hardware_fingerprint",
            "estimator_version",
            "confidence_method",
            "stopping_rule",
            "holdout_split_version",
            "game_id_version",
            "pair_id_version",
            "subject_perspective",
            "result_enum_version",
            "exclusion_policy_version",
            "isotonic_weight_version",
            "pchip_convention",
        ):
            _nonempty(getattr(self, field), f"manifest.{field}")
        if self.seed_policy_version != "sha256-lp64-v1":
            raise ValidationError("manifest.seedPolicyVersion", "unsupported policy")
        if self.inverse_convention != "left-continuous-generalized-inverse-v1":
            raise ValidationError("manifest.inverseConvention", "unsupported convention")
        _sha256(self.opening_corpus_sha256, "manifest.openingCorpusSha256")
        _sha256(self.seed_schedule_sha256, "manifest.seedScheduleSha256")
        if not isinstance(self.subject, EngineConfiguration):
            raise ValidationError("manifest.subject", "must be an EngineConfiguration")
        if not isinstance(self.reference_ladder, tuple) or not self.reference_ladder:
            raise ValidationError("manifest.referenceLadder", "must be a non-empty tuple")
        if not all(isinstance(item, EngineConfiguration) for item in self.reference_ladder):
            raise ValidationError(
                "manifest.referenceLadder", "entries must be EngineConfiguration values"
            )
        if not isinstance(self.scale, EloScale):
            raise ValidationError("manifest.scale", "must be an EloScale")
        if not isinstance(self.search_policy, SearchPolicy):
            raise ValidationError("manifest.searchPolicy", "must be a SearchPolicy")
        subject_options = dict(self.subject.uci_options)
        expected_subject_options = {
            "Threads": self.search_policy.threads,
            "Hash": self.search_policy.hash_mb,
            "MultiPV": self.search_policy.multipv,
            "Ponder": self.search_policy.ponder,
        }
        for name, expected in expected_subject_options.items():
            if subject_options.get(name) != expected:
                raise ValidationError(
                    "manifest.subject.uciOptions",
                    f"{name} must match searchPolicy",
                )
        for field in (
            "opening_pair_count",
            "concurrency",
            "minimum_pairs",
            "maximum_pairs",
        ):
            value = getattr(self, field)
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                raise ValidationError(f"manifest.{field}", "must be positive")
        if self.maximum_pairs < self.minimum_pairs:
            raise ValidationError("manifest.maximumPairs", "must be at least minimumPairs")
        if (
            isinstance(self.decimal_precision, bool)
            or not isinstance(self.decimal_precision, int)
            or self.decimal_precision <= 0
        ):
            raise ValidationError("manifest.decimalPrecision", "must be positive")
        if not self.color_reversal:
            raise ValidationError("manifest.colorReversal", "must be true")
        if isinstance(self.color_reversal, bool) is False:
            raise ValidationError("manifest.colorReversal", "must be boolean")
        for field in (
            "baseline_nps",
            "point_equivalence_elo",
            "interval_equivalence_elo",
        ):
            value = getattr(self, field)
            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not isfinite(value)
                or value <= 0
            ):
                raise ValidationError(f"manifest.{field}", "must be finite and positive")
        if self.interval_equivalence_elo < self.point_equivalence_elo:
            raise ValidationError(
                "manifest.intervalEquivalenceElo",
                "must be greater than or equal to point equivalence",
            )
        if (
            isinstance(self.nps_drift_fraction, bool)
            or not isinstance(self.nps_drift_fraction, (int, float))
            or not isfinite(self.nps_drift_fraction)
            or not 0 <= self.nps_drift_fraction < 1
        ):
            raise ValidationError("manifest.npsDriftFraction", "must be in [0, 1)")
        if (
            isinstance(self.holdout_fraction, bool)
            or not isinstance(self.holdout_fraction, (int, float))
            or not isfinite(self.holdout_fraction)
            or not 0 < self.holdout_fraction < 1
        ):
            raise ValidationError("manifest.holdoutFraction", "must be in (0, 1)")
        expected_order = ("LL", "LD", "DD_or_WL", "WD", "WW")
        if self.pentanomial_order != expected_order:
            raise ValidationError("manifest.pentanomialOrder", "unsupported order")
        if not isinstance(self.tool_versions, tuple) or not self.tool_versions:
            raise ValidationError("manifest.toolVersions", "must be a non-empty tuple")
        tool_names: set[str] = set()
        for item in self.tool_versions:
            if not isinstance(item, tuple) or len(item) != 2:
                raise ValidationError("manifest.toolVersions", "entries must be name/version tuples")
            name, version = item
            _nonempty(name, "manifest.toolVersions.name")
            _nonempty(version, "manifest.toolVersions.version")
            if name in tool_names:
                raise ValidationError("manifest.toolVersions", f"duplicate tool {name}")
            tool_names.add(name)


@dataclass(frozen=True, slots=True)
class CalibrationAnchor:
    skill: int
    rating: float

    def __post_init__(self) -> None:
        if isinstance(self.skill, bool) or not isinstance(self.skill, int) or not 0 <= self.skill <= 25:
            raise ArtifactValidationError("anchors.skill", "must be an integer in [0, 25]")
        if isinstance(self.rating, bool) or not isinstance(self.rating, (int, float)) or not isfinite(self.rating):
            raise ArtifactValidationError("anchors.rating", "must be finite")


@dataclass(frozen=True, slots=True)
class PchipSegment:
    left_skill: int
    right_skill: int
    c0: float
    c1: float
    c2: float
    c3: float

    def __post_init__(self) -> None:
        if (
            isinstance(self.left_skill, bool)
            or not isinstance(self.left_skill, int)
            or isinstance(self.right_skill, bool)
            or not isinstance(self.right_skill, int)
        ):
            raise ArtifactValidationError("segments.interval", "bounds must be integers")
        if self.right_skill != self.left_skill + 1:
            raise ArtifactValidationError("segments.interval", "must span one integral Skill")
        if not 0 <= self.left_skill < self.right_skill <= 25:
            raise ArtifactValidationError("segments.interval", "must lie within [0, 25]")
        for field in ("c0", "c1", "c2", "c3"):
            value = getattr(self, field)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value):
                raise ArtifactValidationError(f"segments.{field}", "must be finite")


@dataclass(frozen=True, slots=True)
class CalibrationPayload:
    schema_version: int
    artifact_version: str
    scale: EloScale
    engine: EngineIdentity
    manifest_sha256: str
    search_policy: SearchPolicy
    seed_policy_version: str
    numeric_serialization_version: str
    inverse_convention: str
    anchors: tuple[CalibrationAnchor, ...]
    segments: tuple[PchipSegment, ...]

    def __post_init__(self) -> None:
        if isinstance(self.schema_version, bool) or not isinstance(self.schema_version, int) or self.schema_version != 1:
            raise ArtifactValidationError("schemaVersion", "must equal 1")
        _nonempty(self.artifact_version, "artifact_version")
        try:
            _sha256(self.manifest_sha256, "manifestSha256")
        except ValidationError as error:
            raise ArtifactValidationError(error.field, error.reason) from error
        if self.seed_policy_version != "sha256-lp64-v1":
            raise ArtifactValidationError("seedPolicyVersion", "unsupported policy")
        if self.numeric_serialization_version != "canonical-json-v1":
            raise ArtifactValidationError(
                "numericSerializationVersion", "unsupported serialization"
            )
        if self.inverse_convention != "left-continuous-generalized-inverse-v1":
            raise ArtifactValidationError("inverseConvention", "unsupported convention")
        if not isinstance(self.anchors, tuple) or not isinstance(self.segments, tuple):
            raise ArtifactValidationError("curve", "anchors and segments must be immutable tuples")
        if not all(isinstance(anchor, CalibrationAnchor) for anchor in self.anchors):
            raise ArtifactValidationError("anchors", "entries must be CalibrationAnchor values")
        if not all(isinstance(segment, PchipSegment) for segment in self.segments):
            raise ArtifactValidationError("segments", "entries must be PchipSegment values")
        if not isinstance(self.scale, EloScale):
            raise ArtifactValidationError("scale", "must be an EloScale")
        if not isinstance(self.engine, EngineIdentity):
            raise ArtifactValidationError("engine", "must be an EngineIdentity")
        if not isinstance(self.search_policy, SearchPolicy):
            raise ArtifactValidationError("searchPolicy", "must be a SearchPolicy")


@dataclass(frozen=True, slots=True)
class CalibrationArtifact:
    payload: CalibrationPayload
    checksum: str

    def __post_init__(self) -> None:
        if not isinstance(self.payload, CalibrationPayload):
            raise ArtifactValidationError("payload", "must be a CalibrationPayload")
        try:
            _sha256(self.checksum, "checksum")
        except ValidationError as error:
            raise ArtifactValidationError(error.field, error.reason) from error


@dataclass(frozen=True, slots=True)
class CalibrationRequest:
    target_elo: int
    scale_id: str
    budget_class: str
    runtime_game_token: str
    side: Side

    def __post_init__(self) -> None:
        if isinstance(self.target_elo, bool) or not isinstance(self.target_elo, int):
            raise ValidationError("request.targetElo", "must be an integer")
        for field in ("scale_id", "budget_class", "runtime_game_token"):
            _nonempty(getattr(self, field), f"request.{field}")
        if not isinstance(self.side, Side):
            raise ValidationError("request.side", "must be a Side")


@dataclass(frozen=True, slots=True)
class SkillResolution:
    latent_skill: float
    lower_skill: int
    upper_skill: int
    applied_skill: int
    resolution_key: str

    def __post_init__(self) -> None:
        if (
            isinstance(self.latent_skill, bool)
            or not isinstance(self.latent_skill, (int, float))
            or not isfinite(self.latent_skill)
            or not 0.0 <= self.latent_skill <= 25.0
        ):
            raise ValidationError("resolution.latentSkill", "must be in [0, 25]")
        for field in ("lower_skill", "upper_skill", "applied_skill"):
            value = getattr(self, field)
            if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 25:
                raise ValidationError(f"resolution.{field}", "must be an integer in [0, 25]")
        if self.applied_skill not in {self.lower_skill, self.upper_skill}:
            raise ValidationError("resolution.appliedSkill", "must be adjacent to latent Skill")
        expected_lower = int(self.latent_skill // 1)
        expected_upper = min(expected_lower + 1, 25)
        if (self.lower_skill, self.upper_skill) != (expected_lower, expected_upper):
            raise ValidationError(
                "resolution.bounds", "must be the floor and ceiling adjacent to latent Skill"
            )
        if self.latent_skill == expected_lower and self.applied_skill != expected_lower:
            raise ValidationError(
                "resolution.appliedSkill", "must equal an integral latent Skill"
            )
        _sha256(self.resolution_key, "resolution.resolutionKey")


@dataclass(frozen=True, slots=True)
class EngineProfile:
    scale_id: str
    target_elo: int
    artifact_version: str
    artifact_checksum: str
    budget_class: str
    seed_policy_version: str
    latent_skill: float
    applied_skill: int
    resolution_key: str
    threads: int
    hash_mb: int
    multipv: int
    move_time_ms: int
    minimum_admission_ms: int
    ponder: bool
    tablebases: bool
    profile_digest: str

    def __post_init__(self) -> None:
        for field in (
            "scale_id",
            "artifact_version",
            "budget_class",
            "seed_policy_version",
        ):
            _nonempty(getattr(self, field), f"profile.{field}")
        _sha256(self.artifact_checksum, "profile.artifactChecksum")
        _sha256(self.resolution_key, "profile.resolutionKey")
        _sha256(self.profile_digest, "profile.profileDigest")
        if isinstance(self.target_elo, bool) or not isinstance(self.target_elo, int):
            raise ValidationError("profile.targetElo", "must be an integer")
        if (
            isinstance(self.latent_skill, bool)
            or not isinstance(self.latent_skill, (int, float))
            or not isfinite(self.latent_skill)
            or not 0.0 <= self.latent_skill <= 25.0
        ):
            raise ValidationError("profile.latentSkill", "must be finite and in [0, 25]")
        if (
            isinstance(self.applied_skill, bool)
            or not isinstance(self.applied_skill, int)
            or not 0 <= self.applied_skill <= 25
        ):
            raise ValidationError("profile.appliedSkill", "must be an integer in [0, 25]")
        lower = int(self.latent_skill // 1)
        upper = min(lower + 1, 25)
        allowed = {lower} if self.latent_skill == lower else {lower, upper}
        if self.applied_skill not in allowed:
            raise ValidationError("profile.appliedSkill", "must be adjacent to latent Skill")
        for field in (
            "threads",
            "hash_mb",
            "multipv",
            "move_time_ms",
            "minimum_admission_ms",
        ):
            value = getattr(self, field)
            if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
                raise ValidationError(f"profile.{field}", "must be a positive integer")
        if self.multipv != 1:
            raise ValidationError("profile.multipv", "must equal 1")
        if self.minimum_admission_ms < self.move_time_ms:
            raise ValidationError(
                "profile.minimumAdmissionMs", "must cover at least the move-time budget"
            )
        for field in ("ponder", "tablebases"):
            if not isinstance(getattr(self, field), bool):
                raise ValidationError(f"profile.{field}", "must be boolean")

    @property
    def uci_options(self) -> tuple[tuple[str, Any], ...]:
        return (
            ("Threads", self.threads),
            ("Hash", self.hash_mb),
            ("MultiPV", self.multipv),
            ("Ponder", self.ponder),
            ("Skill", self.applied_skill),
        )

    def admits(self, remaining_ms: int) -> bool:
        if isinstance(remaining_ms, bool) or not isinstance(remaining_ms, int):
            raise ValidationError("remainingMs", "must be an integer")
        return remaining_ms >= self.minimum_admission_ms


@dataclass(frozen=True, slots=True)
class SearchLimit:
    time_ms: int
    depth: int | None = None
    nodes: int | None = None

    def __post_init__(self) -> None:
        if isinstance(self.time_ms, bool) or not isinstance(self.time_ms, int) or self.time_ms <= 0:
            raise ValidationError("limit.timeMs", "must be a positive integer")
        if self.depth is not None or self.nodes is not None:
            raise ValidationError("limit", "depth and nodes are forbidden for calibrated play")


@dataclass(frozen=True, slots=True)
class ScriptedSearchResult:
    best_move: str
    nodes: int
    elapsed_seconds: float

    def __post_init__(self) -> None:
        _nonempty(self.best_move, "searchResult.bestMove")
        if isinstance(self.nodes, bool) or not isinstance(self.nodes, int) or self.nodes < 0:
            raise ValidationError("searchResult.nodes", "must be a non-negative integer")
        if (
            isinstance(self.elapsed_seconds, bool)
            or not isinstance(self.elapsed_seconds, (int, float))
            or not isfinite(self.elapsed_seconds)
            or self.elapsed_seconds <= 0
        ):
            raise ValidationError("searchResult.elapsedSeconds", "must be finite and positive")
