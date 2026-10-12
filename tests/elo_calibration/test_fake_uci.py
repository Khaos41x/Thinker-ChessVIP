from __future__ import annotations

import unittest

from core.elo_calibration import (
    CalibrationRequest,
    EloCalibrator,
    InjectedUciFailure,
    ScriptedSearchResult,
    SearchLimit,
    Side,
    UciContractError,
    ValidationError,
)
from core.elo_calibration.testing import FakeUciEngine

from helpers import build_artifact


class FakeUciTests(unittest.TestCase):
    def setUp(self) -> None:
        artifact = build_artifact()
        calibrator = EloCalibrator(
            artifact, expected_engine_sha256=artifact.payload.engine.binary_sha256
        )
        self.selector = calibrator.interpolate_uci_params(
            CalibrationRequest(
                1210,
                "synthetic.test.v1",
                "test-100ms-v1",
                "game-1",
                Side.WHITE,
            )
        )
        self.reference = calibrator.interpolate_uci_params(
            CalibrationRequest(
                1960,
                "synthetic.test.v1",
                "test-100ms-v1",
                "game-1",
                Side.WHITE,
            )
        )

    def test_reference_selector_reference_stages_are_cold_and_ordered(self) -> None:
        engine = FakeUciEngine(
            ScriptedSearchResult(move, 1000, 0.01)
            for move in ("e2e4", "e7e5", "g1f3")
        )
        for profile in (self.reference, self.selector, self.reference):
            engine.apply_profile(profile)
            engine.clear_hash()
            self.assertFalse(engine.warm)
            engine.isready()
            engine.search(SearchLimit(time_ms=profile.move_time_ms))
        operations = [event.operation for event in engine.events]
        self.assertEqual(
            operations,
            ["apply_options", "clear_hash", "isready", "search"] * 3,
        )

    def test_same_profile_can_search_again_after_cold_reset(self) -> None:
        engine = FakeUciEngine(
            [
                ScriptedSearchResult("e2e4", 100, 0.01),
                ScriptedSearchResult("e7e5", 100, 0.01),
            ]
        )
        engine.apply_profile(self.selector)
        for _ in range(2):
            engine.clear_hash()
            engine.isready()
            engine.search(SearchLimit(time_ms=self.selector.move_time_ms))
        self.assertEqual(
            [event.operation for event in engine.events],
            ["apply_options", "clear_hash", "isready", "search", "clear_hash", "isready", "search"],
        )

    def test_search_without_reset_is_rejected(self) -> None:
        engine = FakeUciEngine([ScriptedSearchResult("e2e4", 1, 0.01)])
        engine.apply_profile(self.selector)
        with self.assertRaises(UciContractError):
            engine.search(SearchLimit(time_ms=100))

    def test_search_without_profile_and_wrong_time_are_rejected(self) -> None:
        engine = FakeUciEngine([ScriptedSearchResult("e2e4", 1, 0.01)])
        engine.clear_hash()
        engine.isready()
        with self.assertRaises(UciContractError):
            engine.search(SearchLimit(time_ms=100))
        engine.apply_profile(self.selector)
        engine.clear_hash()
        engine.isready()
        with self.assertRaises(UciContractError):
            engine.search(SearchLimit(time_ms=self.selector.move_time_ms + 1))

    def test_arbitrary_option_and_partial_profile_are_rejected(self) -> None:
        engine = FakeUciEngine()
        with self.assertRaises(UciContractError):
            engine.apply_options({"Threads": 1, "Arbitrary": True})
        with self.assertRaises(UciContractError):
            engine.apply_options({"Threads": 1})

    def test_invalid_scripted_result_is_rejected_at_construction(self) -> None:
        with self.assertRaises(UciContractError):
            FakeUciEngine([object()])

    def test_depth_and_nodes_are_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            SearchLimit(time_ms=100, depth=8)
        with self.assertRaises(ValidationError):
            SearchLimit(time_ms=100, nodes=1000)

    def test_injected_failure_is_observable_and_restart_changes_generation(self) -> None:
        engine = FakeUciEngine()
        engine.inject_failure("clear_hash")
        engine.apply_profile(self.selector)
        with self.assertRaises(InjectedUciFailure):
            engine.clear_hash()
        self.assertEqual(engine.events[-1].operation, "clear_hash_failed")
        engine.restart()
        self.assertEqual(engine.generation, 2)
        self.assertEqual(engine.applied_options, {})
        self.assertFalse(engine.warm)


if __name__ == "__main__":
    unittest.main()
