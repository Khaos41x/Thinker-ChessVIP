from __future__ import annotations

import tempfile
import threading
import time
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from tools.elo_calibration.io import canonical_json_bytes, load_json_bytes, write_canonical_json
from tools.elo_calibration.models import BenchmarkPlan, MatchCell
from tools.elo_calibration.run_matches import EngineMove, PairedMatchRunner, decode_plan, pair_id, parse_reference_engines


class FakeAdapter:
    calls: list[str] = []

    def configure(self, options): self.calls.append(f"configure:{options}")
    def new_game(self): self.calls.append("new_game")
    def clear_hash(self): self.calls.append("clear_hash")
    def ready(self): self.calls.append("ready")
    def play(self, board, move_time_ms):
        self.calls.append(f"play:{move_time_ms}")
        return EngineMove("f7f8", 12, 0.001)
    def close(self): self.calls.append("close")


class RunnerIoTests(unittest.TestCase):
    def setUp(self) -> None:
        FakeAdapter.calls = []
        self.cell = MatchCell(3, "fake-ref", 1120.0, "opening-1", "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1")
        self.plan = BenchmarkPlan(
            schema_version=1,
            manifest_sha256="b" * 64,
            subject_id="fake-subject",
            subject_binary_sha256="a" * 64,
            reference_binaries=(("fake-ref", "c" * 64),),
            move_time_ms=10,
            max_plies=8,
            concurrency=1,
            cells=(self.cell,),
            corpus_sha256="d" * 64,
            hardware_fingerprint="fake-cpu-single-thread",
            tool_versions=(("python-chess", "test"),),
            scale_id="synthetic.phase2.v1",
            reference_protocol="paired-v1",
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
            baseline_nps=100000.0,
            maximum_nps_drift_fraction=0.1,
            maximum_color_score_difference=0.05,
            maximum_operational_failures=0,
            stopping_rule="fixed-minimum-then-ci-v1",
            subject_options=(("Threads", 1), ("Hash", 32), ("MultiPV", 1), ("Ponder", False)),
            reference_options=(("fake-ref", (("Threads", 1), ("Hash", 32), ("MultiPV", 1), ("Ponder", False))),),
        )

    def test_pair_is_color_reversed_atomic_and_resumable(self) -> None:
        runner = PairedMatchRunner(lambda skill: FakeAdapter(), lambda reference: FakeAdapter())
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            first = runner.run(self.plan, directory)
            calls = tuple(FakeAdapter.calls)
            second = runner.run(self.plan, directory)
            self.assertEqual(first, second)
            self.assertEqual(calls, tuple(FakeAdapter.calls))
            self.assertEqual([g.subject_color.value for g in first[0].games], ["white", "black"])
            self.assertEqual(FakeAdapter.calls.count("clear_hash"), 2)
            self.assertEqual(FakeAdapter.calls.count("ready"), 2)
            self.assertEqual(len(list((Path(directory) / "pairs").glob("*.json"))), 1)
            self.assertEqual(len(list((Path(directory) / "pgn").glob("*.pgn"))), 1)
            record_path = next((Path(directory) / "pairs").glob("*.json"))
            tampered = load_json_bytes(record_path.read_bytes())
            tampered["payload"]["skill"] = 4
            write_canonical_json(record_path, tampered)
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                runner.run(self.plan, directory)

    def test_resume_rejects_missing_or_tampered_pgn(self) -> None:
        runner = PairedMatchRunner(lambda skill: FakeAdapter(), lambda reference: FakeAdapter())
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            runner.run(self.plan, directory)
            pgn_path = next((Path(directory) / "pgn").glob("*.pgn"))
            pgn_path.write_text("tampered", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "conflicting pair PGN"):
                runner.run(self.plan, directory)

    def test_resume_repairs_missing_pgn_but_rejects_orphan(self) -> None:
        runner = PairedMatchRunner(lambda skill: FakeAdapter(), lambda reference: FakeAdapter())
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            expected = runner.run(self.plan, directory)
            pgn_path = next((Path(directory) / "pgn").glob("*.pgn"))
            pgn_path.unlink()
            FakeAdapter.calls = []
            self.assertEqual(runner.run(self.plan, directory), expected)
            self.assertEqual(FakeAdapter.calls, [])
            json_path = next((Path(directory) / "pairs").glob("*.json"))
            json_path.unlink()
            with self.assertRaisesRegex(ValueError, "orphan pair PGN"):
                runner.run(self.plan, directory)

    def test_duplicate_schedule_and_invalid_fen_fail_preflight(self) -> None:
        with self.assertRaisesRegex(ValueError, "duplicate cells"):
            replace(self.plan, cells=(self.cell, self.cell))
        raw = load_json_bytes(canonical_json_bytes(self.plan))
        raw["cells"][0]["opening_fen"] = "not-a-fen"
        with self.assertRaisesRegex(ValueError, "invalid opening FEN"):
            decode_plan(canonical_json_bytes(raw))

    def test_duplicate_json_keys_are_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
            load_json_bytes(b'{"a":1,"a":2}')

    def test_pair_identity_binds_full_plan_and_cell(self) -> None:
        baseline = pair_id(self.plan, self.cell)
        self.assertNotEqual(
            baseline,
            pair_id(self.plan, replace(self.cell, reference_rating=1121.0)),
        )
        self.assertNotEqual(
            baseline,
            pair_id(replace(self.plan, move_time_ms=11), self.cell),
        )

    def test_concurrency_is_bounded_and_reference_cli_is_strict(self) -> None:
        replace(self.plan, concurrency=4)
        with self.assertRaisesRegex(ValueError, "concurrency"):
            replace(self.plan, concurrency=5)
        with self.assertRaisesRegex(ValueError, "Threads=1"):
            replace(self.plan, subject_options=(("Threads", 2), ("Hash", 32), ("MultiPV", 1), ("Ponder", False)))
        self.assertEqual(parse_reference_engines(["one=C:/one.exe", "two=C:/two.exe"])["two"], "C:/two.exe")
        with self.assertRaisesRegex(ValueError, "duplicate"):
            parse_reference_engines(["one=C:/one.exe", "one=C:/other.exe"])

    def test_concurrent_run_preserves_manifest_order_and_prevalidates_resume(self) -> None:
        class ConcurrentAdapter(FakeAdapter):
            lock = threading.Lock()
            active = 0
            peak = 0

            def play(self, board, move_time_ms):
                with self.lock:
                    type(self).active += 1
                    type(self).peak = max(type(self).peak, type(self).active)
                time.sleep(0.02)
                try:
                    return super().play(board, move_time_ms)
                finally:
                    with self.lock:
                        type(self).active -= 1

        cells = tuple(replace(self.cell, opening_id=f"opening-{index}") for index in range(6))
        plan = replace(self.plan, concurrency=4, cells=cells)
        runner = PairedMatchRunner(lambda skill: ConcurrentAdapter(), lambda reference: ConcurrentAdapter())
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            records = runner.run(plan, directory)
            self.assertEqual(tuple(record.opening_id for record in records), tuple(cell.opening_id for cell in cells))
            self.assertGreaterEqual(ConcurrentAdapter.peak, 2)
            self.assertLessEqual(ConcurrentAdapter.peak, 4)
            first_json = Path(directory) / "pairs" / f"{pair_id(plan, cells[0])}.json"
            raw = load_json_bytes(first_json.read_bytes())
            raw["payload"]["skill"] = 4
            write_canonical_json(first_json, raw)
            last_json = Path(directory) / "pairs" / f"{pair_id(plan, cells[-1])}.json"
            last_pgn = Path(directory) / "pgn" / f"{pair_id(plan, cells[-1])}.pgn"
            last_json.unlink()
            last_pgn.unlink()
            FakeAdapter.calls = []
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                runner.run(plan, directory)
            self.assertEqual(FakeAdapter.calls, [])

    def test_fatal_worker_exception_cancels_pending_futures(self) -> None:
        class Future:
            def __init__(self, fail=False):
                self.fail = fail
                self.cancelled = False
            def result(self):
                if self.fail:
                    raise RuntimeError("persist failed")
                return None
            def cancel(self):
                self.cancelled = True
                return True

        class Executor:
            instance = None
            def __init__(self, **kwargs):
                type(self).instance = self
                self.futures = []
                self.shutdown_args = None
            def submit(self, function, cell):
                future = Future(fail=not self.futures)
                self.futures.append(future)
                return future
            def shutdown(self, **kwargs):
                self.shutdown_args = kwargs

        plan = replace(self.plan, cells=(self.cell, replace(self.cell, opening_id="opening-2")))
        runner = PairedMatchRunner(lambda skill: FakeAdapter(), lambda reference: FakeAdapter())
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory, patch("tools.elo_calibration.run_matches.ThreadPoolExecutor", Executor):
            with self.assertRaisesRegex(RuntimeError, "persist failed"):
                runner.run(plan, directory)
        self.assertTrue(all(future.cancelled for future in Executor.instance.futures))
        self.assertEqual(Executor.instance.shutdown_args, {"wait": True, "cancel_futures": True})


if __name__ == "__main__":
    unittest.main()
