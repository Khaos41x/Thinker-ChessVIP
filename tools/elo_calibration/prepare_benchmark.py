from __future__ import annotations

import argparse
from collections import Counter
import io
import platform
from dataclasses import dataclass, replace
from hashlib import sha256
from math import isfinite
from pathlib import Path

import chess
import chess.pgn

from core.elo_calibration.models import EloScale, EngineIdentity, SearchPolicy

from .estimate import decode_estimate
from .fit_curve import ArtifactBuildConfig, decode_build_config
from .io import canonical_json_bytes, content_sha256, immutable_write, load_json_bytes
from .models import BenchmarkPlan, CellEstimate, MatchCell
from .run_matches import decode_plan


STOCKFISH_RATINGS = (1320, 1500, 1700, 1900, 2100, 2300, 2500, 2700, 2900, 3050, 3190)
STAGE1_SKILLS = (0, 2, 5, 8, 11, 14, 17, 20, 23, 25)
STAGE_OPENING_COUNTS = {1: 12, 2: 20, 3: 260}
MOVE_TIME_MS = 500
MAX_PLIES = 300
HASH_MB = 128
SUBJECT_OPTIONS = (
    ("Threads", 1),
    ("Hash", HASH_MB),
    ("MultiPV", 1),
    ("Ponder", False),
    ("OwnBook", False),
    ("Use Syzygy", False),
)


@dataclass(frozen=True, slots=True)
class Opening:
    opening_id: str
    fen: str


@dataclass(frozen=True, slots=True)
class PreparationEnvironment:
    subject_id: str
    subject_binary_sha256: str
    reference_binary_sha256: str
    corpus_sha256: str
    hardware_fingerprint: str
    baseline_nps: float
    concurrency: int = 4

    def __post_init__(self) -> None:
        for name in ("subject_binary_sha256", "reference_binary_sha256", "corpus_sha256"):
            value = getattr(self, name)
            if len(value) != 64 or any(character not in "0123456789abcdef" for character in value):
                raise ValueError(f"{name} must be a lowercase SHA-256 digest")
        if not self.subject_id.strip() or not self.hardware_fingerprint.strip():
            raise ValueError("subject_id and hardware_fingerprint must be non-empty")
        if not isfinite(self.baseline_nps) or self.baseline_nps <= 0:
            raise ValueError("baseline_nps must be finite and positive")
        if not 1 <= self.concurrency <= 4:
            raise ValueError("concurrency must be in [1, 4]")


def file_sha256(path: str | Path) -> str:
    digest = sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def environment_from_preflight(
    report_path: str | Path,
    subject_engine: str | Path,
    reference_engine: str | Path,
    corpus: str | Path,
    concurrency: int,
) -> PreparationEnvironment:
    raw = load_json_bytes(Path(report_path).read_bytes())
    if not isinstance(raw, dict) or raw.get("schemaVersion") != 1 or raw.get("verdict") != "pass":
        raise ValueError("preflight report must be a passing schema-v1 report")
    if raw.get("moveTimeMs") != MOVE_TIME_MS or raw.get("loadedWorkers") != concurrency or raw.get("safeWorkerRecommendation") != concurrency:
        raise ValueError("preflight report does not approve the requested campaign concurrency")
    hardware = raw.get("hardwareFingerprint")
    engines = raw.get("engines")
    if not isinstance(hardware, str) or not hardware.strip() or not isinstance(engines, dict):
        raise ValueError("preflight report is missing hardware or engine evidence")
    subject = engines.get("subject")
    reference = engines.get("reference")
    if not isinstance(subject, dict) or not isinstance(reference, dict):
        raise ValueError("preflight report is missing engine evidence")
    subject_hash = file_sha256(subject_engine)
    reference_hash = file_sha256(reference_engine)
    if subject.get("engineId") != "Komodo 14.1 64-bit" or subject.get("binarySha256") != subject_hash:
        raise ValueError("preflight subject identity or binary hash does not match")
    if reference.get("engineId") != "Stockfish 19" or reference.get("binarySha256") != reference_hash:
        raise ValueError("preflight reference identity or binary hash does not match")
    baseline = subject.get("loadedNpsPooled")
    if isinstance(baseline, bool) or not isinstance(baseline, (int, float)):
        raise ValueError("preflight report is missing the pooled subject NPS baseline")
    return PreparationEnvironment(
        "Komodo 14.1 64-bit",
        subject_hash,
        reference_hash,
        file_sha256(corpus),
        hardware,
        float(baseline),
        concurrency,
    )


def parse_opening_corpus(data: bytes) -> tuple[Opening, ...]:
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError("opening corpus must be UTF-8 PGN") from error
    stream = io.StringIO(text)
    positions: dict[str, Opening] = {}
    game_index = 0
    while True:
        game = chess.pgn.read_game(stream)
        if game is None:
            break
        game_index += 1
        if game.errors:
            raise ValueError(f"opening corpus game {game_index} contains invalid PGN: {game.errors[0]}")
        board = game.board()
        for move in game.mainline_moves():
            board.push(move)
        if not board.is_valid() or board.is_game_over(claim_draw=False):
            raise ValueError(f"opening corpus game {game_index} contains an invalid or terminal position: {board.fen(en_passant='fen')}")
        fen = board.fen(en_passant="fen")
        identifier = f"opening-{sha256(fen.encode('utf-8')).hexdigest()}"
        positions.setdefault(fen, Opening(identifier, fen))
    if not positions:
        raise ValueError("opening corpus contains no games")
    return tuple(positions[fen] for fen in sorted(positions))


def _ordered_openings(openings: tuple[Opening, ...], seed: str) -> tuple[Opening, ...]:
    if len({opening.fen for opening in openings}) != len(openings):
        raise ValueError("opening corpus contains duplicate positions")
    return tuple(sorted(openings, key=lambda opening: (sha256(f"{seed}:{opening.fen}".encode()).digest(), opening.fen)))


def stage_openings(openings: tuple[Opening, ...], stage: int, seed: str, count: int | None = None) -> tuple[Opening, ...]:
    if stage not in STAGE_OPENING_COUNTS:
        raise ValueError("stage must be 1, 2, or 3")
    ordered = _ordered_openings(openings, seed)
    wanted = STAGE_OPENING_COUNTS[stage] if count is None else count
    if wanted <= 0:
        raise ValueError("opening count must be positive")
    start = sum(STAGE_OPENING_COUNTS[index] for index in range(1, stage))
    if len(ordered) < start + wanted:
        raise ValueError(f"opening corpus needs at least {start + wanted} unique positions")
    return ordered[start : start + wanted]


def reference_id(rating: int) -> str:
    if rating not in STOCKFISH_RATINGS:
        raise ValueError(f"unsupported Stockfish reference rating: {rating}")
    return f"stockfish-19-uci-elo-{rating}"


def _reference_options(rating: int) -> tuple[tuple[str, str | int | bool], ...]:
    return (
        ("Threads", 1),
        ("Hash", HASH_MB),
        ("MultiPV", 1),
        ("Ponder", False),
        ("UCI_LimitStrength", True),
        ("UCI_Elo", rating),
    )


def _plan(environment: PreparationEnvironment, cells: tuple[MatchCell, ...], stage: int) -> BenchmarkPlan:
    used_ratings = tuple(sorted({int(cell.reference_rating) for cell in cells}))
    references = tuple((reference_id(rating), environment.reference_binary_sha256) for rating in used_ratings)
    options = tuple((reference_id(rating), _reference_options(rating)) for rating in used_ratings)
    provisional = BenchmarkPlan(
        schema_version=1,
        manifest_sha256="0" * 64,
        subject_id=environment.subject_id,
        subject_binary_sha256=environment.subject_binary_sha256,
        reference_binaries=references,
        move_time_ms=MOVE_TIME_MS,
        max_plies=MAX_PLIES,
        concurrency=environment.concurrency,
        cells=cells,
        corpus_sha256=environment.corpus_sha256,
        hardware_fingerprint=environment.hardware_fingerprint,
        tool_versions=(("python", platform.python_version()), ("python-chess", chess.__version__)),
        scale_id="stockfish19-uci-elo-500ms-xeon-envelope-v1",
        reference_protocol="stockfish-19-uci-elo-fixed-500ms-v1",
        search_state_policy="clear-hash-isready-per-move-v1",
        seed_schedule_version="sha256-schedule-v1",
        tablebase_policy="disabled",
        estimator_version="pentanomial-delta-v1",
        confidence_version="jeffreys-regularized-delta-v1",
        fit_version="weighted-pava-pchip-v1",
        isotonic_weight_version="inverse-elo-variance-v1",
        pchip_version="fritsch-carlson-v1",
        inverse_convention="left-continuous-generalized-inverse-v1",
        numeric_serialization_version="canonical-json-v1",
        decimal_precision=12,
        validation_version="independent-hash-holdout-v1",
        holdout_fraction=0.2,
        point_equivalence_elo=35.0,
        interval_equivalence_elo=75.0,
        minimum_pairs_per_cell=200,
        baseline_nps=environment.baseline_nps,
        maximum_nps_drift_fraction=0.2,
        maximum_color_score_difference=0.05,
        maximum_operational_failures=0,
        stopping_rule=f"stage-{stage}-fixed-pairs-v1",
        subject_options=SUBJECT_OPTIONS,
        reference_options=options,
    )
    manifest = content_sha256(provisional)
    return replace(provisional, manifest_sha256=manifest)


def build_stage1_plan(environment: PreparationEnvironment, openings: tuple[Opening, ...], seed: str = "official-v1", opening_count: int | None = None) -> BenchmarkPlan:
    selected = stage_openings(openings, 1, seed, opening_count)
    cells = tuple(
        MatchCell(skill, reference_id(rating), float(rating), opening.opening_id, opening.fen)
        for skill in STAGE1_SKILLS
        for rating in STOCKFISH_RATINGS
        for opening in selected
    )
    return _plan(environment, cells, 1)


def _measured_skill_ratings(estimates: tuple[CellEstimate, ...], required_skills: tuple[int, ...]) -> dict[int, float]:
    manifests = {estimate.manifest_sha256 for estimate in estimates}
    if len(manifests) != 1:
        raise ValueError("prior estimates must belong to one immutable manifest")
    keys = {(estimate.skill, estimate.reference_id, estimate.reference_rating) for estimate in estimates}
    if len(keys) != len(estimates):
        raise ValueError("prior estimates contain duplicate cells")
    observations: dict[int, list[CellEstimate]] = {skill: [] for skill in required_skills}
    for estimate in estimates:
        if estimate.skill not in observations:
            continue
        if estimate.reference_rating not in STOCKFISH_RATINGS or estimate.reference_id != reference_id(int(estimate.reference_rating)):
            raise ValueError(f"out-of-range or inconsistent reference at Skill {estimate.skill}")
        if estimate.elo_delta is None:
            continue
        observed = estimate.reference_rating + estimate.elo_delta
        if not STOCKFISH_RATINGS[0] <= observed <= STOCKFISH_RATINGS[-1]:
            raise ValueError(f"measured rating is outside the connected reference ladder at Skill {estimate.skill}")
        observations[estimate.skill].append(estimate)
    missing = [skill for skill, values in observations.items() if not values]
    if missing:
        raise ValueError(f"unbounded required Skill estimates: {missing}")
    result = {}
    for skill, values in observations.items():
        selected = min(values, key=lambda estimate: (abs(estimate.elo_delta), estimate.reference_rating, estimate.reference_id))
        result[skill] = selected.reference_rating + selected.elo_delta
    return result


def _interpolate_sampled_ratings(measured: dict[int, float]) -> dict[int, float]:
    skills = tuple(sorted(measured))
    if not skills or skills[0] != 0 or skills[-1] != 25:
        raise ValueError("measured Skills must bracket [0, 25]")
    monotone: list[float] = []
    for skill in skills:
        monotone.append(max(measured[skill], monotone[-1] if monotone else measured[skill]))
    result: dict[int, float] = {}
    for skill in range(26):
        if skill in measured:
            result[skill] = monotone[skills.index(skill)]
            continue
        right_index = next(index for index, anchor in enumerate(skills) if anchor > skill)
        left_skill, right_skill = skills[right_index - 1], skills[right_index]
        fraction = (skill - left_skill) / (right_skill - left_skill)
        result[skill] = monotone[right_index - 1] + fraction * (monotone[right_index] - monotone[right_index - 1])
    return result


def _nearest_reference(rating: float) -> int:
    if not STOCKFISH_RATINGS[0] <= rating <= STOCKFISH_RATINGS[-1]:
        raise ValueError("measured rating is outside the connected reference ladder")
    return min(STOCKFISH_RATINGS, key=lambda candidate: (abs(candidate - rating), candidate))


def build_adaptive_plan(environment: PreparationEnvironment, openings: tuple[Opening, ...], estimates: tuple[CellEstimate, ...], stage: int, seed: str = "official-v1", opening_count: int | None = None) -> BenchmarkPlan:
    if stage == 2:
        measured = _interpolate_sampled_ratings(_measured_skill_ratings(estimates, STAGE1_SKILLS))
    elif stage == 3:
        measured = _measured_skill_ratings(estimates, tuple(range(26)))
    else:
        raise ValueError("adaptive stage must be 2 or 3")
    selected = stage_openings(openings, stage, seed, opening_count)
    cells = []
    for skill in range(26):
        rating = _nearest_reference(measured[skill])
        cells.extend(MatchCell(skill, reference_id(rating), float(rating), opening.opening_id, opening.fen) for opening in selected)
    return _plan(environment, tuple(cells), stage)


def artifact_build_config(plan: BenchmarkPlan) -> ArtifactBuildConfig:
    return ArtifactBuildConfig(
        artifact_version="komodo-14.1-sf19-500ms-v1",
        scale=EloScale(plan.scale_id, plan.reference_protocol, "Stockfish 19 UCI_Elo proxy", "500ms/move"),
        engine=EngineIdentity(plan.subject_id, "14.1", plan.subject_binary_sha256),
        manifest_sha256=plan.manifest_sha256,
        search_policy=SearchPolicy("calibration-500ms-v1", 1, HASH_MB, 1, MOVE_TIME_MS, 600),
        numeric_serialization_version=plan.numeric_serialization_version,
        inverse_convention=plan.inverse_convention,
        decimal_precision=plan.decimal_precision,
    )


def _load_estimates(path: str | Path) -> tuple[tuple[CellEstimate, ...], int, int]:
    raw = load_json_bytes(Path(path).read_bytes())
    required = {"estimatorVersion", "estimates", "operationalFailures", "recordCount"}
    if not isinstance(raw, dict) or set(raw) != required or raw.get("estimatorVersion") != "pentanomial-delta-v1" or not isinstance(raw.get("estimates"), list):
        raise ValueError("invalid estimates document")
    if isinstance(raw["recordCount"], bool) or not isinstance(raw["recordCount"], int) or raw["recordCount"] <= 0:
        raise ValueError("estimate recordCount must be a positive integer")
    if isinstance(raw["operationalFailures"], bool) or not isinstance(raw["operationalFailures"], int) or raw["operationalFailures"] < 0:
        raise ValueError("estimate operationalFailures must be a non-negative integer")
    return tuple(decode_estimate(item) for item in raw["estimates"]), raw["recordCount"], raw["operationalFailures"]


def plan_self_digest(plan: BenchmarkPlan) -> str:
    return content_sha256(replace(plan, manifest_sha256="0" * 64))


def validate_prior_evidence(
    prior_plan: BenchmarkPlan,
    estimates: tuple[CellEstimate, ...],
    environment: PreparationEnvironment,
    expected_stage: int,
    *,
    record_count: int | None = None,
    operational_failures: int = 0,
) -> None:
    if expected_stage not in (1, 2):
        raise ValueError("prior evidence stage must be 1 or 2")
    if prior_plan.manifest_sha256 != plan_self_digest(prior_plan):
        raise ValueError("prior manifest self-digest mismatch")
    if not estimates or {estimate.manifest_sha256 for estimate in estimates} != {prior_plan.manifest_sha256}:
        raise ValueError("prior estimates do not match the prior immutable manifest")
    expected_rule = f"stage-{expected_stage}-fixed-pairs-v1"
    if prior_plan.stopping_rule != expected_rule:
        raise ValueError(f"expected prior Stage {expected_stage} manifest")
    expected_versions = (
        prior_plan.schema_version == 1,
        prior_plan.subject_id == environment.subject_id,
        prior_plan.subject_binary_sha256 == environment.subject_binary_sha256,
        prior_plan.move_time_ms == MOVE_TIME_MS,
        prior_plan.max_plies == MAX_PLIES,
        prior_plan.concurrency == environment.concurrency,
        prior_plan.corpus_sha256 == environment.corpus_sha256,
        prior_plan.hardware_fingerprint == environment.hardware_fingerprint,
        prior_plan.tool_versions == (("python", platform.python_version()), ("python-chess", chess.__version__)),
        prior_plan.scale_id == "stockfish19-uci-elo-500ms-xeon-envelope-v1",
        prior_plan.reference_protocol == "stockfish-19-uci-elo-fixed-500ms-v1",
        prior_plan.search_state_policy == "clear-hash-isready-per-move-v1",
        prior_plan.seed_schedule_version == "sha256-schedule-v1",
        prior_plan.tablebase_policy == "disabled",
        prior_plan.estimator_version == "pentanomial-delta-v1",
        prior_plan.confidence_version == "jeffreys-regularized-delta-v1",
        prior_plan.fit_version == "weighted-pava-pchip-v1",
        prior_plan.isotonic_weight_version == "inverse-elo-variance-v1",
        prior_plan.pchip_version == "fritsch-carlson-v1",
        prior_plan.inverse_convention == "left-continuous-generalized-inverse-v1",
        prior_plan.numeric_serialization_version == "canonical-json-v1",
        prior_plan.decimal_precision == 12,
        prior_plan.validation_version == "independent-hash-holdout-v1",
        prior_plan.holdout_fraction == 0.2,
        prior_plan.point_equivalence_elo == 35.0,
        prior_plan.interval_equivalence_elo == 75.0,
        prior_plan.minimum_pairs_per_cell == 200,
        prior_plan.baseline_nps == environment.baseline_nps,
        prior_plan.maximum_nps_drift_fraction == 0.2,
        prior_plan.maximum_color_score_difference == 0.05,
        prior_plan.maximum_operational_failures == 0,
        prior_plan.game_id_version == "sha256-canonical-json-v1",
        prior_plan.pair_id_version == "sha256-canonical-json-v1",
        prior_plan.subject_options == SUBJECT_OPTIONS,
    )
    if not all(expected_versions):
        raise ValueError("prior manifest environment does not match the requested campaign")
    used_ratings = tuple(sorted({int(cell.reference_rating) for cell in prior_plan.cells}))
    if any(
        cell.reference_rating not in STOCKFISH_RATINGS
        or cell.reference_id != reference_id(int(cell.reference_rating))
        for cell in prior_plan.cells
    ):
        raise ValueError("prior manifest contains an invalid reference cell")
    if prior_plan.reference_binaries != tuple((reference_id(rating), environment.reference_binary_sha256) for rating in used_ratings):
        raise ValueError("prior manifest reference fingerprints do not match the frozen ladder")
    if prior_plan.reference_options != tuple((reference_id(rating), _reference_options(rating)) for rating in used_ratings):
        raise ValueError("prior manifest reference options do not match the frozen ladder")
    expected_counts = Counter((cell.skill, cell.reference_id, cell.reference_rating) for cell in prior_plan.cells)
    if expected_stage == 1:
        expected_keys = {
            (skill, reference_id(rating), float(rating))
            for skill in STAGE1_SKILLS
            for rating in STOCKFISH_RATINGS
        }
    else:
        expected_keys = set(expected_counts)
        by_skill: dict[int, set[tuple[str, float]]] = {skill: set() for skill in range(26)}
        for skill, reference, rating in expected_keys:
            if skill in by_skill:
                by_skill[skill].add((reference, rating))
        if any(len(references) != 1 for references in by_skill.values()):
            raise ValueError(f"prior Stage {expected_stage} schedule must contain one measured reference per Skill")
    if set(expected_counts) != expected_keys or any(count != STAGE_OPENING_COUNTS[expected_stage] for count in expected_counts.values()):
        raise ValueError(f"prior Stage {expected_stage} schedule topology does not match the frozen campaign")
    openings_by_cell: dict[tuple[int, str, float], set[tuple[str, str]]] = {key: set() for key in expected_counts}
    opening_identity: dict[str, str] = {}
    for cell in prior_plan.cells:
        key = (cell.skill, cell.reference_id, cell.reference_rating)
        openings_by_cell[key].add((cell.opening_id, cell.opening_fen))
        previous_fen = opening_identity.setdefault(cell.opening_id, cell.opening_fen)
        if previous_fen != cell.opening_fen:
            raise ValueError("prior manifest reuses an opening ID for different positions")
    opening_sets = {frozenset(values) for values in openings_by_cell.values()}
    if len(opening_sets) != 1:
        raise ValueError(f"prior Stage {expected_stage} cells do not share the frozen opening schedule")
    actual_counts = Counter((estimate.skill, estimate.reference_id, estimate.reference_rating) for estimate in estimates)
    if set(actual_counts) != set(expected_counts):
        raise ValueError("prior estimates do not cover every planned cell")
    if any(estimate.pair_count != expected_counts[(estimate.skill, estimate.reference_id, estimate.reference_rating)] for estimate in estimates):
        raise ValueError("prior estimate pair counts do not match the immutable schedule")
    effective_record_count = sum(estimate.pair_count for estimate in estimates) if record_count is None else record_count
    if effective_record_count != len(prior_plan.cells) or operational_failures != 0:
        raise ValueError("prior estimate record totals do not match the immutable schedule")
    required_skills = STAGE1_SKILLS if expected_stage == 1 else tuple(range(26))
    _measured_skill_ratings(estimates, required_skills)


def _write_outputs_idempotently(outputs: tuple[tuple[str | Path, bytes], ...]) -> None:
    resolved = [Path(path).resolve() for path, _ in outputs]
    if len(set(resolved)) != len(resolved):
        raise ValueError("output paths must be distinct")
    for (path, data), destination in zip(outputs, resolved):
        if destination.exists() and destination.read_bytes() != data:
            raise FileExistsError(f"conflicting immutable output: {path}")
    for (_, data), destination in reversed(tuple(zip(outputs, resolved))):
        if not destination.exists():
            try:
                immutable_write(destination, data)
            except FileExistsError:
                if not destination.exists() or destination.read_bytes() != data:
                    raise


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate immutable staged Elo-calibration benchmark plans")
    parser.add_argument("stage", choices=("stage1", "stage2", "stage3"))
    parser.add_argument("--subject-engine", required=True)
    parser.add_argument("--reference-engine", required=True)
    parser.add_argument("--corpus", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--preflight-report", required=True)
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--seed", default="official-v1")
    parser.add_argument("--prior-estimates")
    parser.add_argument("--prior-plan")
    parser.add_argument("--artifact-config")
    args = parser.parse_args()
    stage = int(args.stage[-1])
    if stage > 1 and (not args.prior_estimates or not args.prior_plan):
        parser.error("--prior-estimates and --prior-plan are required for Stage 2 and Stage 3")
    corpus_path = Path(args.corpus)
    openings = parse_opening_corpus(corpus_path.read_bytes())
    environment = environment_from_preflight(
        args.preflight_report,
        args.subject_engine,
        args.reference_engine,
        corpus_path,
        args.concurrency,
    )
    if stage == 1:
        plan = build_stage1_plan(environment, openings, args.seed)
    else:
        estimates, record_count, operational_failures = _load_estimates(args.prior_estimates)
        prior_plan = decode_plan(Path(args.prior_plan).read_bytes())
        validate_prior_evidence(
            prior_plan,
            estimates,
            environment,
            stage - 1,
            record_count=record_count,
            operational_failures=operational_failures,
        )
        plan = build_adaptive_plan(environment, openings, estimates, stage, args.seed)
    if args.artifact_config and stage != 3:
        parser.error("--artifact-config is only valid for Stage 3")
    outputs: list[tuple[str | Path, bytes]] = [(args.output, canonical_json_bytes(plan))]
    if args.artifact_config:
        config = artifact_build_config(plan)
        config_bytes = canonical_json_bytes(config)
        decoded_config = decode_build_config(load_json_bytes(config_bytes))
        if decoded_config != config or decoded_config.manifest_sha256 != plan.manifest_sha256:
            raise ValueError("artifact config failed strict validation against the generated plan")
        outputs.append((args.artifact_config, config_bytes))
    _write_outputs_idempotently(tuple(outputs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
