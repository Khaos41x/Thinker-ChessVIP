from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Callable, Protocol

import chess
import chess.engine
import chess.pgn

from .io import canonical_json_bytes, content_sha256, immutable_write, load_json_bytes
from .models import (
    BenchmarkPlan,
    EngineRole,
    FailureKind,
    GameOutcome,
    GameRecord,
    MatchCell,
    MoveTelemetry,
    PairRecord,
    SubjectColor,
)


@dataclass(frozen=True, slots=True)
class EngineMove:
    uci: str
    nodes: int
    elapsed_seconds: float


class EngineAdapter(Protocol):
    def identity(self) -> dict[str, str]: ...
    def configure(self, options: dict[str, object]) -> None: ...
    def new_game(self) -> None: ...
    def clear_hash(self) -> None: ...
    def ready(self) -> None: ...
    def play(self, board: chess.Board, move_time_ms: int) -> EngineMove: ...
    def close(self) -> None: ...


class PythonChessUciAdapter:
    def __init__(self, executable: str) -> None:
        self._engine = chess.engine.SimpleEngine.popen_uci(executable)
        self._game: object = object()
        self._ponder = False

    def identity(self) -> dict[str, str]:
        return {str(key): str(value) for key, value in self._engine.id.items()}

    def configure(self, options: dict[str, object]) -> None:
        configured = dict(options)
        multipv = configured.pop("MultiPV", 1)
        ponder = configured.pop("Ponder", False)
        if multipv != 1:
            raise ValueError("benchmark play requires MultiPV=1")
        if ponder is not False:
            raise ValueError("benchmark play requires Ponder=false")
        self._ponder = False
        self._engine.configure(configured)

    def new_game(self) -> None:
        self._game = object()

    def clear_hash(self) -> None:
        self._engine.configure({"Clear Hash": None})

    def ready(self) -> None:
        self._engine.ping()

    def play(self, board: chess.Board, move_time_ms: int) -> EngineMove:
        import time

        started = time.perf_counter()
        result = self._engine.play(
            board,
            chess.engine.Limit(time=move_time_ms / 1000.0),
            game=self._game,
            info=chess.engine.INFO_BASIC,
            ponder=self._ponder,
        )
        elapsed = time.perf_counter() - started
        return EngineMove(result.move.uci(), int(result.info.get("nodes", 0)), elapsed)

    def close(self) -> None:
        self._engine.quit()


def _identity(value: object) -> str:
    return sha256(canonical_json_bytes(value)).hexdigest()


def _file_sha256(path: str | Path) -> str:
    digest = sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def pair_id(plan: BenchmarkPlan, cell: MatchCell) -> str:
    return _identity(
        {
            "cell": cell,
            "plan": plan,
        }
    )


def game_id(pair_digest: str, color: SubjectColor, version: str) -> str:
    return _identity({"gameIdVersion": version, "pairId": pair_digest, "subjectColor": color.value})


def _decode_game(raw: dict[str, object]) -> GameRecord:
    required = {"failure", "game_id", "moves", "outcome", "subject_color", "telemetry", "termination"}
    if set(raw) != required:
        raise ValueError("invalid game record keys")
    if not isinstance(raw["game_id"], str) or not isinstance(raw["termination"], str):
        raise ValueError("game string fields must be strings")
    if not isinstance(raw["moves"], list) or not all(isinstance(move, str) for move in raw["moves"]):
        raise ValueError("game moves must be a string array")
    if not isinstance(raw["telemetry"], list) or not all(isinstance(item, dict) for item in raw["telemetry"]):
        raise ValueError("game telemetry must be an object array")
    telemetry = []
    for item in raw["telemetry"]:
        if set(item) != {"actor", "elapsed_seconds", "nodes", "ply", "uci"}:
            raise ValueError("invalid telemetry keys")
        telemetry.append(MoveTelemetry(item["ply"], item["uci"], item["nodes"], item["elapsed_seconds"], EngineRole(item["actor"])))
    return GameRecord(
        game_id=raw["game_id"],
        subject_color=SubjectColor(raw["subject_color"]),
        outcome=None if raw["outcome"] is None else GameOutcome(raw["outcome"]),
        failure=None if raw["failure"] is None else FailureKind(raw["failure"]),
        termination=raw["termination"],
        moves=tuple(raw["moves"]),
        telemetry=tuple(telemetry),
    )


def decode_pair(data: bytes) -> PairRecord:
    raw = load_json_bytes(data)
    if not isinstance(raw, dict) or set(raw) != {"checksum", "payload", "schema_version"} or raw["schema_version"] != 1:
        raise ValueError("invalid pair envelope")
    if not isinstance(raw["checksum"], str) or raw["checksum"] != content_sha256(raw["payload"]):
        raise ValueError("pair record checksum mismatch")
    raw = raw["payload"]
    required = {"games", "manifest_sha256", "opening_fen", "opening_id", "pair_id", "reference_id", "reference_rating", "schema_version", "skill"}
    if not isinstance(raw, dict) or set(raw) != required:
        raise ValueError("invalid pair record keys")
    record = PairRecord(
        schema_version=raw["schema_version"],
        pair_id=raw["pair_id"],
        manifest_sha256=raw["manifest_sha256"],
        skill=raw["skill"],
        reference_id=raw["reference_id"],
        reference_rating=raw["reference_rating"],
        opening_id=raw["opening_id"],
        opening_fen=raw["opening_fen"],
        games=tuple(_decode_game(game) for game in raw["games"]),
    )
    for game in record.games:
        board = chess.Board(record.opening_fen)
        for uci, telemetry in zip(game.moves, game.telemetry):
            subject_turn = board.turn == chess.WHITE if game.subject_color is SubjectColor.WHITE else board.turn == chess.BLACK
            expected_actor = EngineRole.SUBJECT if subject_turn else EngineRole.REFERENCE
            if telemetry.actor is not expected_actor:
                raise ValueError("pair record telemetry actor contradicts replay")
            move = chess.Move.from_uci(uci)
            if move not in board.legal_moves:
                raise ValueError("pair record contains an illegal replay move")
            board.push(move)
        if game.outcome is not None and board.result(claim_draw=True) != game.outcome.value:
            raise ValueError("pair record outcome contradicts replay")
    return record


def pair_to_bytes(record: PairRecord) -> bytes:
    payload = load_json_bytes(canonical_json_bytes(record))
    return canonical_json_bytes({"checksum": content_sha256(payload), "payload": payload, "schema_version": 1})


def parse_reference_engines(values: list[str]) -> dict[str, str]:
    references: dict[str, str] = {}
    for item in values:
        if "=" not in item:
            raise ValueError(f"invalid reference engine value: {item!r}; expected ID=PATH")
        reference_id, path = item.split("=", 1)
        if not reference_id or not path:
            raise ValueError(f"invalid reference engine value: {item!r}; expected non-empty ID=PATH")
        if reference_id in references:
            raise ValueError(f"duplicate reference engine ID: {reference_id}")
        references[reference_id] = path
    return references


def decode_plan(data: bytes) -> BenchmarkPlan:
    raw = load_json_bytes(data)
    required = {"baseline_nps", "cells", "concurrency", "confidence_version", "corpus_sha256", "decimal_precision", "estimator_version", "fit_version", "game_id_version", "hardware_fingerprint", "holdout_fraction", "interval_equivalence_elo", "inverse_convention", "isotonic_weight_version", "manifest_sha256", "maximum_color_score_difference", "maximum_nps_drift_fraction", "maximum_operational_failures", "max_plies", "minimum_pairs_per_cell", "move_time_ms", "numeric_serialization_version", "pair_id_version", "pchip_version", "point_equivalence_elo", "reference_binaries", "reference_options", "reference_protocol", "scale_id", "schema_version", "search_state_policy", "seed_schedule_version", "stopping_rule", "subject_binary_sha256", "subject_id", "subject_options", "tablebase_policy", "tool_versions", "validation_version"}
    if not isinstance(raw, dict) or set(raw) != required:
        raise ValueError("invalid benchmark plan keys")
    cells = tuple(MatchCell(**cell) for cell in raw["cells"])
    plan = BenchmarkPlan(
        schema_version=raw["schema_version"], manifest_sha256=raw["manifest_sha256"], subject_id=raw["subject_id"], subject_binary_sha256=raw["subject_binary_sha256"], reference_binaries=tuple(tuple(item) for item in raw["reference_binaries"]), move_time_ms=raw["move_time_ms"], max_plies=raw["max_plies"], concurrency=raw["concurrency"], cells=cells, corpus_sha256=raw["corpus_sha256"], hardware_fingerprint=raw["hardware_fingerprint"], tool_versions=tuple(tuple(item) for item in raw["tool_versions"]), scale_id=raw["scale_id"], reference_protocol=raw["reference_protocol"], search_state_policy=raw["search_state_policy"], seed_schedule_version=raw["seed_schedule_version"], tablebase_policy=raw["tablebase_policy"], estimator_version=raw["estimator_version"], confidence_version=raw["confidence_version"], fit_version=raw["fit_version"], isotonic_weight_version=raw["isotonic_weight_version"], pchip_version=raw["pchip_version"], inverse_convention=raw["inverse_convention"], numeric_serialization_version=raw["numeric_serialization_version"], decimal_precision=raw["decimal_precision"], validation_version=raw["validation_version"], holdout_fraction=raw["holdout_fraction"], point_equivalence_elo=raw["point_equivalence_elo"], interval_equivalence_elo=raw["interval_equivalence_elo"], minimum_pairs_per_cell=raw["minimum_pairs_per_cell"], baseline_nps=raw["baseline_nps"], maximum_nps_drift_fraction=raw["maximum_nps_drift_fraction"], maximum_color_score_difference=raw["maximum_color_score_difference"], maximum_operational_failures=raw["maximum_operational_failures"], stopping_rule=raw["stopping_rule"], game_id_version=raw["game_id_version"], pair_id_version=raw["pair_id_version"], subject_options=tuple(tuple(item) for item in raw["subject_options"]), reference_options=tuple((item[0], tuple(tuple(option) for option in item[1])) for item in raw["reference_options"])
    )
    for cell in plan.cells:
        try:
            board = chess.Board(cell.opening_fen)
        except ValueError as error:
            raise ValueError(f"invalid opening FEN for {cell.opening_id}") from error
        if not board.is_valid():
            raise ValueError(f"invalid opening position for {cell.opening_id}")
    return plan


class PairedMatchRunner:
    def __init__(self, subject_factory: Callable[[int], EngineAdapter], reference_factory: Callable[[str], EngineAdapter]) -> None:
        self._subject_factory = subject_factory
        self._reference_factory = reference_factory

    def _game(self, plan: BenchmarkPlan, cell: MatchCell, color: SubjectColor, digest: str) -> GameRecord:
        subject: EngineAdapter | None = None
        reference: EngineAdapter | None = None
        moves: list[str] = []
        telemetry: list[MoveTelemetry] = []
        failure: FailureKind | None = None
        termination = "normal"
        try:
            board = chess.Board(cell.opening_fen)
            subject = self._subject_factory(cell.skill)
            reference = self._reference_factory(cell.reference_id)
            subject_options = dict(plan.subject_options)
            subject_options["Skill"] = cell.skill
            subject.configure(subject_options)
            reference.configure(dict(dict(plan.reference_options).get(cell.reference_id, ())))
            subject.new_game()
            reference.new_game()
            for ply in range(1, plan.max_plies + 1):
                if board.is_game_over(claim_draw=True):
                    break
                subject_turn = board.turn == chess.WHITE if color is SubjectColor.WHITE else board.turn == chess.BLACK
                engine = subject if subject_turn else reference
                engine.clear_hash()
                engine.ready()
                move = engine.play(board.copy(stack=False), plan.move_time_ms)
                try:
                    parsed = chess.Move.from_uci(move.uci)
                except ValueError:
                    failure = FailureKind.ILLEGAL_MOVE
                    termination = "invalid_uci"
                    break
                if parsed not in board.legal_moves:
                    failure = FailureKind.ILLEGAL_MOVE
                    termination = "illegal_move"
                    break
                sample = MoveTelemetry(ply, move.uci, move.nodes, move.elapsed_seconds, EngineRole.SUBJECT if subject_turn else EngineRole.REFERENCE)
                board.push(parsed)
                moves.append(move.uci)
                telemetry.append(sample)
                if board.is_game_over(claim_draw=True):
                    break
            else:
                failure = FailureKind.MAX_PLY
                termination = "max_ply"
        except TimeoutError:
            failure = FailureKind.TIMEOUT
            termination = "timeout"
        except Exception:
            failure = FailureKind.CRASH
            termination = "engine_error"
        finally:
            for engine in (subject, reference):
                if engine is not None:
                    try:
                        engine.close()
                    except Exception:
                        if failure is None:
                            failure = FailureKind.CRASH
                            termination = "engine_close_error"
        outcome = None
        if failure is None:
            result = board.result(claim_draw=True)
            if result == "*":
                failure = FailureKind.MAX_PLY
                termination = "unterminated"
            else:
                outcome = GameOutcome(result)
                termination = board.outcome(claim_draw=True).termination.name.lower()
        return GameRecord(
            game_id=game_id(digest, color, plan.game_id_version),
            subject_color=color,
            outcome=outcome,
            failure=failure,
            termination=termination,
            moves=tuple(moves),
            telemetry=tuple(telemetry),
        )

    def run_pair(self, plan: BenchmarkPlan, cell: MatchCell) -> PairRecord:
        digest = pair_id(plan, cell)
        games = tuple(self._game(plan, cell, color, digest) for color in (SubjectColor.WHITE, SubjectColor.BLACK))
        return PairRecord(1, digest, plan.manifest_sha256, cell.skill, cell.reference_id, cell.reference_rating, cell.opening_id, cell.opening_fen, games)

    def run(self, plan: BenchmarkPlan, output_dir: str | Path) -> tuple[PairRecord, ...]:
        root = Path(output_dir)
        completed: dict[str, PairRecord] = {}
        pending: list[MatchCell] = []
        expected_ids = {pair_id(plan, cell) for cell in plan.cells}
        existing_json_ids = {path.stem for path in (root / "pairs").glob("*.json")}
        existing_pgn_ids = {path.stem for path in (root / "pgn").glob("*.pgn")}
        unexpected = sorted((existing_json_ids | existing_pgn_ids) - expected_ids)
        if unexpected:
            raise ValueError(f"unexpected pair output IDs: {unexpected}")
        orphan_pgn = sorted(existing_pgn_ids - existing_json_ids)
        if orphan_pgn:
            raise ValueError(f"orphan pair PGN: {root / 'pgn' / (orphan_pgn[0] + '.pgn')}")
        for cell in plan.cells:
            expected = pair_id(plan, cell)
            json_path = root / "pairs" / f"{expected}.json"
            pgn_path = root / "pgn" / f"{expected}.pgn"
            if json_path.exists():
                existing_bytes = json_path.read_bytes()
                existing = decode_pair(existing_bytes)
                expected_fields = (cell.skill, cell.reference_id, cell.reference_rating, cell.opening_id, cell.opening_fen)
                actual_fields = (existing.skill, existing.reference_id, existing.reference_rating, existing.opening_id, existing.opening_fen)
                expected_game_ids = tuple(game_id(expected, color, plan.game_id_version) for color in (SubjectColor.WHITE, SubjectColor.BLACK))
                if (
                    existing.pair_id != expected
                    or existing.manifest_sha256 != plan.manifest_sha256
                    or actual_fields != expected_fields
                    or tuple(game.game_id for game in existing.games) != expected_game_ids
                    or pair_to_bytes(existing) != existing_bytes
                ):
                    raise ValueError(f"conflicting pair record: {json_path}")
                expected_pgn = self._pair_pgn(existing).encode("utf-8")
                if not pgn_path.exists():
                    immutable_write(pgn_path, expected_pgn)
                elif pgn_path.read_bytes() != expected_pgn:
                    raise ValueError(f"conflicting pair PGN: {pgn_path}")
                completed[expected] = existing
                continue
            pending.append(cell)

        def execute(cell: MatchCell) -> PairRecord:
            expected = pair_id(plan, cell)
            record = self.run_pair(plan, cell)
            pgn_bytes = self._pair_pgn(record).encode("utf-8")
            immutable_write(root / "pairs" / f"{expected}.json", pair_to_bytes(record))
            immutable_write(root / "pgn" / f"{expected}.pgn", pgn_bytes)
            return record

        if pending:
            executor = ThreadPoolExecutor(max_workers=plan.concurrency, thread_name_prefix="elo-pair")
            futures = [executor.submit(execute, cell) for cell in pending]
            try:
                for cell, future in zip(pending, futures):
                    completed[pair_id(plan, cell)] = future.result()
            except BaseException:
                for future in futures:
                    future.cancel()
                raise
            finally:
                executor.shutdown(wait=True, cancel_futures=True)
        return tuple(completed[pair_id(plan, cell)] for cell in plan.cells)

    @staticmethod
    def _pair_pgn(record: PairRecord) -> str:
        rendered: list[str] = []
        for game_record in record.games:
            game = chess.pgn.Game()
            board = chess.Board(record.opening_fen)
            game.setup(board)
            game.headers["PairId"] = record.pair_id
            game.headers["SubjectColor"] = game_record.subject_color.value
            game.headers["Result"] = game_record.outcome.value if game_record.outcome else "*"
            game.headers["Termination"] = game_record.termination
            node = game
            for uci in game_record.moves:
                move = chess.Move.from_uci(uci)
                node = node.add_variation(move)
                board.push(move)
            rendered.append(str(game))
        return "\n\n".join(rendered) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a deterministic paired Elo-calibration schedule")
    parser.add_argument("--plan", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--subject-engine", required=True)
    parser.add_argument("--reference-engine", action="append", required=True, metavar="ID=PATH")
    args = parser.parse_args()
    try:
        references = parse_reference_engines(args.reference_engine)
    except ValueError as error:
        parser.error(str(error))
    plan = decode_plan(Path(args.plan).read_bytes())
    required_references = {cell.reference_id for cell in plan.cells}
    missing = sorted(required_references - set(references))
    if missing:
        parser.error(f"missing reference engine paths: {missing}")
    unexpected = sorted(set(references) - required_references)
    if unexpected:
        parser.error(f"unexpected reference engine paths: {unexpected}")
    if _file_sha256(args.subject_engine) != plan.subject_binary_sha256:
        parser.error("subject engine hash does not match the benchmark plan")
    reference_hashes = dict(plan.reference_binaries)
    mismatched = sorted(
        reference_id
        for reference_id, path in references.items()
        if _file_sha256(path) != reference_hashes.get(reference_id)
    )
    if mismatched:
        parser.error(f"reference engine hash mismatch: {mismatched}")
    runner = PairedMatchRunner(
        lambda skill: PythonChessUciAdapter(args.subject_engine),
        lambda reference_id: PythonChessUciAdapter(references[reference_id]),
    )
    runner.run(plan, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
