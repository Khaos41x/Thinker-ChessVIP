from __future__ import annotations

import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

from tools.elo_calibration.io import canonical_json_bytes, load_json_bytes, write_canonical_json
from tools.elo_calibration.models import BenchmarkPlan, MatchCell
from tools.elo_calibration.run_matches import EngineMove, PairedMatchRunner, decode_plan, pair_id


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


if __name__ == "__main__":
    unittest.main()
