from __future__ import annotations

import unittest
import threading
import time
from dataclasses import replace
from unittest.mock import Mock

import chess
import chess.engine

from core.elo_calibration import EloCalibrator, Side, create_artifact
from core.smart_pacing.adapter import KomodoEngineAdapter, ProfileTransitionError
from core.smart_pacing.calibration import CalibrationMode, CalibrationRuntime
from core.smart_pacing.contracts import MovePlanRequest
from core.smart_pacing.coordinator import CancellationToken, EngineCoordinator
from core.smart_pacing.identities import analysis_position_key, observation_key
from core.smart_pacing.service import MovePlanService
from core.smart_pacing.testing import FakeEngineAdapter

from helpers import build_artifact


def request(
    *,
    request_id="request-1",
    target_elo=1400,
    budget_ms=700,
    position_revision=1,
):
    fen = chess.STARTING_FEN
    game_token = "game-phase-3"
    return MovePlanRequest.from_payload(
        {
            "schemaVersion": 1,
            "requestId": request_id,
            "runtimeGameToken": game_token,
            "positionRevision": position_revision,
            "observationKey": observation_key(game_token, position_revision, fen),
            "analysisPositionKey": analysis_position_key(fen),
            "fen": fen,
            "lastMove": None,
            "historyDigest": None,
            "moveSelectionElo": target_elo,
            "perceptionElo": target_elo,
            "analysisTier": "standard",
            "clientBudgetMs": budget_ms,
            "analysisBudgetVersion": 1,
            "evidenceModelVersion": 1,
        }
    )


def line(move, score=20, depth=10):
    return {
        "score": chess.engine.PovScore(chess.engine.Cp(score), chess.WHITE),
        "pv": [chess.Move.from_uci(move)],
        "depth": depth,
    }


def runtime(mode, artifact=None):
    artifact = artifact or build_artifact()
    calibrator = EloCalibrator(
        artifact,
        expected_engine_sha256=artifact.payload.engine.binary_sha256,
    )
    return CalibrationRuntime(calibrator, mode=mode)


def service(adapter, calibration):
    return MovePlanService(
        EngineCoordinator(adapter),
        calibration=calibration,
    )


class CoordinatorCalibrationContractTests(unittest.TestCase):
    def test_production_adapter_uses_exact_time_only_calibrated_limit(self):
        komodo = Mock()
        komodo.generation = "generation-1"
        komodo.apply_profile.side_effect = lambda options, deadline=None: {
            "options": options,
            "generation": komodo.generation,
        }
        komodo.play.return_value = chess.Move.from_uci("e2e4")
        profile = runtime(CalibrationMode.ACTIVE).resolve(
            target_elo=1400,
            runtime_game_token="adapter-game",
            side=Side.WHITE,
        ).profile
        adapter = KomodoEngineAdapter(komodo)

        selected = adapter.select_calibrated_move(
            chess.Board(),
            profile=profile,
            token=CancellationToken(),
        )

        self.assertEqual(selected, chess.Move.from_uci("e2e4"))
        applied = komodo.apply_profile.call_args.args[0]
        self.assertEqual(applied["Skill"], profile.applied_skill)
        self.assertNotIn("MultiPV", applied)
        self.assertNotIn("Ponder", applied)
        limit = komodo.play.call_args.args[1]
        self.assertEqual(limit.time, profile.move_time_ms / 1000)
        self.assertIsNone(limit.depth)
        self.assertIsNone(limit.nodes)

    def test_transition_consumed_admission_prevents_calibrated_search(self):
        times = iter((0.0, 0.9, 0.9))
        komodo = Mock()
        komodo.generation = "generation-1"
        komodo.apply_profile.side_effect = lambda options, deadline=None: {
            "options": options,
            "generation": komodo.generation,
        }
        profile = runtime(CalibrationMode.ACTIVE).resolve(
            target_elo=1400,
            runtime_game_token="slow-transition",
            side=Side.WHITE,
        ).profile
        adapter = KomodoEngineAdapter(komodo, monotonic=lambda: next(times))

        with self.assertRaises(TimeoutError):
            adapter.select_calibrated_move(
                chess.Board(),
                profile=profile,
                token=CancellationToken(),
                deadline=1.0,
            )

        komodo.play.assert_not_called()

    def test_uncertain_profile_apply_invalidates_engine_generation(self):
        komodo = Mock()
        komodo.generation = "generation-1"
        komodo.apply_profile.side_effect = RuntimeError("injected configure failure")
        adapter = KomodoEngineAdapter(komodo)

        with self.assertRaises(ProfileTransitionError):
            adapter.prepare_reference(CancellationToken())

        komodo.force_terminate.assert_called_once_with("uncertain_state")

    def test_shadow_mode_profiles_v2_but_executes_v1_selector(self):
        adapter = FakeEngineAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])

        plan = service(adapter, runtime(CalibrationMode.SHADOW)).create_plan(request())

        self.assertEqual(plan["move"], "d2d4")
        self.assertEqual(plan["calibration"]["calibrationMode"], "shadow")
        self.assertEqual(plan["calibration"]["calibrationStatus"], "shadow")
        self.assertIn("profileDigest", plan["calibration"])
        self.assertIn("selector", [call[0] for call in adapter.calls])
        self.assertNotIn("selector-v2", [call[0] for call in adapter.calls])

    def test_active_mode_runs_atomic_cold_profile_sequence(self):
        adapter = FakeEngineAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])

        plan = service(adapter, runtime(CalibrationMode.ACTIVE)).create_plan(request())

        self.assertEqual(plan["move"], "d2d4")
        self.assertEqual(plan["calibration"]["calibrationStatus"], "applied")
        self.assertEqual(
            [call[0] for call in adapter.calls],
            [
                "apply_profile",
                "clear_hash",
                "ready",
                "reference",
                "apply_profile",
                "clear_hash",
                "ready",
                "selector-v2",
                "apply_profile",
                "clear_hash",
                "ready",
                "reference",
            ],
        )
        profile_names = [
            call[1]["name"] for call in adapter.calls if call[0] == "apply_profile"
        ]
        self.assertEqual(profile_names, ["reference", "selector-v2", "reference"])

    def test_profile_is_pinned_by_game_and_side(self):
        calibration = runtime(CalibrationMode.SHADOW)

        first = calibration.resolve(
            target_elo=1400,
            runtime_game_token="same-game",
            side=Side.WHITE,
        )
        second = calibration.resolve(
            target_elo=1800,
            runtime_game_token="same-game",
            side=Side.WHITE,
        )

        self.assertFalse(first.pinned)
        self.assertTrue(second.pinned)
        self.assertEqual(first.profile, second.profile)
        self.assertEqual(first.identity(), second.identity())
        self.assertIn("resolverVersion", first.identity())

    def test_pin_capacity_fails_closed_without_evicting_active_game(self):
        calibration = CalibrationRuntime(
            runtime(CalibrationMode.SHADOW).calibrator,
            mode=CalibrationMode.SHADOW,
            capacity=1,
        )
        first = calibration.resolve(
            target_elo=1400,
            runtime_game_token="first-game",
            side=Side.WHITE,
        )
        rejected = calibration.resolve(
            target_elo=1500,
            runtime_game_token="second-game",
            side=Side.WHITE,
        )
        repeated = calibration.resolve(
            target_elo=1800,
            runtime_game_token="first-game",
            side=Side.WHITE,
        )

        self.assertEqual(
            rejected.reason,
            "CALIBRATION_PIN_CAPACITY_EXHAUSTED",
        )
        self.assertIsNone(rejected.profile)
        self.assertEqual(first.profile, repeated.profile)

    def test_expired_inactive_pin_is_reclaimed_but_active_pin_is_protected(self):
        clock = [0.0]
        active_games = {"first-game"}
        calibration = CalibrationRuntime(
            runtime(CalibrationMode.SHADOW).calibrator,
            mode=CalibrationMode.SHADOW,
            capacity=1,
            pin_ttl_seconds=10,
            monotonic=lambda: clock[0],
            active_game_predicate=lambda token: token in active_games,
        )
        calibration.resolve(
            target_elo=1400,
            runtime_game_token="first-game",
            side=Side.WHITE,
        )
        clock[0] = 20.0

        protected = calibration.resolve(
            target_elo=1500,
            runtime_game_token="second-game",
            side=Side.WHITE,
        )
        active_games.clear()
        reclaimed = calibration.resolve(
            target_elo=1500,
            runtime_game_token="second-game",
            side=Side.WHITE,
        )

        self.assertEqual(protected.reason, "CALIBRATION_PIN_CAPACITY_EXHAUSTED")
        self.assertIsNotNone(reclaimed.profile)

    def test_pin_diagnostic_does_not_change_plan_cache_identity(self):
        adapter = FakeEngineAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])
        planner = service(adapter, runtime(CalibrationMode.SHADOW))

        first = planner.create_plan(request())
        second = planner.create_plan(request(request_id="request-2"))

        self.assertFalse(first["calibration"]["profilePinned"])
        self.assertEqual(second["source"], "cache")
        self.assertTrue(second["calibration"]["profilePinned"])
        self.assertEqual(len(adapter.calls), 12)

    def test_active_mode_does_not_start_unadmitted_selector(self):
        artifact = build_artifact()
        policy = replace(
            artifact.payload.search_policy,
            minimum_admission_ms=5000,
        )
        artifact = create_artifact(replace(artifact.payload, search_policy=policy))
        adapter = FakeEngineAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])

        plan = service(adapter, runtime(CalibrationMode.ACTIVE, artifact)).create_plan(request())

        self.assertEqual(plan["status"], "fallback")
        self.assertEqual(
            plan["calibration"]["calibrationReason"],
            "CALIBRATION_BUDGET_NOT_ADMITTED",
        )
        self.assertNotIn("selector-v2", [call[0] for call in adapter.calls])

    def test_reference_restore_failure_returns_typed_fallback(self):
        class RestoreFailureAdapter(FakeEngineAdapter):
            def restore_reference(self, token, deadline=None):
                raise RuntimeError("injected restore failure")

        adapter = RestoreFailureAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))

        plan = service(adapter, runtime(CalibrationMode.ACTIVE)).create_plan(request())

        self.assertEqual(plan["status"], "fallback")
        self.assertEqual(plan["move"], "e2e4")
        self.assertEqual(plan["diagnostics"]["fallbackReason"], "REFERENCE_RESTORE_FAILED")
        self.assertEqual(
            plan["calibration"]["calibrationReason"],
            "REFERENCE_RESTORE_FAILED",
        )

    def test_missing_artifact_keeps_shadow_v1_available(self):
        adapter = FakeEngineAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])
        calibration = CalibrationRuntime(None, mode=CalibrationMode.SHADOW)

        plan = service(adapter, calibration).create_plan(request())

        self.assertEqual(plan["move"], "d2d4")
        self.assertEqual(plan["calibration"]["calibrationStatus"], "not_applied")
        self.assertEqual(
            plan["calibration"]["calibrationReason"],
            "CALIBRATION_ARTIFACT_UNAVAILABLE",
        )
        self.assertIn("selector", [call[0] for call in adapter.calls])

    def test_shadow_selector_failure_is_not_cached_as_complete(self):
        adapter = FakeEngineAdapter()
        for _ in range(2):
            adapter.queue([line("e2e4"), line("d2d4", 10)])
            adapter.queue(error=RuntimeError("injected selector failure"))
            adapter.queue([line("e2e4", 30), line("d2d4", 15)])
        planner = service(adapter, runtime(CalibrationMode.SHADOW))

        first = planner.create_plan(request())
        second = planner.create_plan(request(request_id="request-2"))

        self.assertEqual(first["status"], "fallback")
        self.assertEqual(second["status"], "fallback")
        self.assertNotEqual(second["source"], "cache")
        self.assertEqual(len(adapter.calls), 24)

    def test_cancelled_selector_still_attempts_reference_cleanup(self):
        class CancellingAdapter(FakeEngineAdapter):
            def select_move(
                self,
                board,
                *,
                move_selection_elo,
                time_limit_ms,
                token,
                deadline=None,
            ):
                self.prepare_legacy_selector(move_selection_elo, token, deadline)
                token.cancel("superseded")
                token.raise_if_cancelled()

        adapter = CancellingAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        planner = service(adapter, CalibrationRuntime(None))

        plan = planner.create_plan(request())

        self.assertEqual(plan["status"], "fallback")
        self.assertEqual(plan["diagnostics"]["fallbackReason"], "REQUEST_OBSOLETE")
        profile_names = [
            call[1]["name"] for call in adapter.calls if call[0] == "apply_profile"
        ]
        self.assertEqual(profile_names, ["reference", "selector-v1", "reference"])

    def test_superseding_job_starts_only_after_reference_cleanup(self):
        class SupersedingAdapter(FakeEngineAdapter):
            def __init__(self):
                super().__init__()
                self.selector_started = threading.Event()
                self.selector_count = 0

            def select_move(
                self,
                board,
                *,
                move_selection_elo,
                time_limit_ms,
                token,
                deadline=None,
            ):
                self.selector_count += 1
                self.prepare_legacy_selector(move_selection_elo, token, deadline)
                if self.selector_count == 1:
                    self.selector_started.set()
                    while not token.cancelled:
                        time.sleep(0.001)
                    token.raise_if_cancelled()
                return self.execute(
                    "selector",
                    {"board": board},
                    deadline,
                    token,
                )

        adapter = SupersedingAdapter()
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue([line("e2e4"), line("d2d4", 10)])
        adapter.queue(chess.Move.from_uci("d2d4"))
        adapter.queue([line("e2e4", 30), line("d2d4", 15)])
        planner = service(adapter, CalibrationRuntime(None))
        first_result = []

        first = threading.Thread(
            target=lambda: first_result.append(
                planner.create_plan(request(request_id="request-old"))
            )
        )
        first.start()
        self.assertTrue(adapter.selector_started.wait(timeout=1))
        second = planner.create_plan(
            request(request_id="request-new", position_revision=2)
        )
        first.join(timeout=1)

        self.assertFalse(first.is_alive())
        self.assertEqual(first_result[0]["status"], "fallback")
        self.assertEqual(second["status"], "complete")
        profile_names = [
            call[1]["name"] for call in adapter.calls if call[0] == "apply_profile"
        ]
        self.assertEqual(
            profile_names,
            [
                "reference",
                "selector-v1",
                "reference",
                "reference",
                "selector-v1",
                "reference",
            ],
        )


if __name__ == "__main__":
    unittest.main()
