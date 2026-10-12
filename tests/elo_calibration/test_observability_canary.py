from __future__ import annotations

import unittest
import threading
from unittest.mock import Mock

from prometheus_client import CollectorRegistry

from core.elo_calibration import EloCalibrator, EngineTelemetry, Side
from core.smart_pacing.calibration import CalibrationMode, CalibrationRuntime, RolloutPolicy
from core.smart_pacing.coordinator import EngineCoordinator, EngineJob
from core.smart_pacing.testing import FakeEngineAdapter

from helpers import build_artifact


def runtime(policy):
    artifact = build_artifact()
    calibrator = EloCalibrator(
        artifact,
        expected_engine_sha256=artifact.payload.engine.binary_sha256,
    )
    return CalibrationRuntime(
        calibrator,
        mode=policy.mode,
        rollout_policy=policy,
    )


class CanaryRolloutTests(unittest.TestCase):
    def test_percentage_boundaries_and_explicit_key_are_deterministic(self):
        checksum = "a" * 64
        control = RolloutPolicy(CalibrationMode.CANARY, 0)
        full = RolloutPolicy(CalibrationMode.CANARY, 10_000)
        explicit = RolloutPolicy(CalibrationMode.CANARY, 0, frozenset({"selected-game"}))

        self.assertEqual(control.resolve("game", checksum), (CalibrationMode.SHADOW, "control"))
        self.assertEqual(full.resolve("game", checksum), (CalibrationMode.ACTIVE, "canary"))
        self.assertEqual(explicit.resolve("selected-game", checksum), (CalibrationMode.ACTIVE, "canary"))
        self.assertEqual(explicit.resolve("selected-game", checksum), explicit.resolve("selected-game", checksum))

    def test_cohort_is_pinned_until_game_release(self):
        calibration = runtime(RolloutPolicy(CalibrationMode.CANARY, 10_000))
        first = calibration.resolve(target_elo=1400, runtime_game_token="game", side=Side.WHITE)
        calibration.rollout_policy = RolloutPolicy(
            CalibrationMode.CANARY,
            0,
            version="canary-sha256-v2",
        )
        pinned = calibration.resolve(target_elo=1400, runtime_game_token="game", side=Side.WHITE)

        self.assertEqual(first.mode, CalibrationMode.ACTIVE)
        self.assertEqual(pinned.mode, CalibrationMode.ACTIVE)
        self.assertEqual(pinned.cohort, "canary")
        self.assertEqual(pinned.rollout_version, "canary-sha256-v1")
        self.assertTrue(pinned.pinned)

        calibration.release_game("game")
        released = calibration.resolve(target_elo=1400, runtime_game_token="game", side=Side.WHITE)
        self.assertEqual(released.mode, CalibrationMode.SHADOW)
        self.assertEqual(released.cohort, "control")
        self.assertEqual(released.rollout_version, "canary-sha256-v2")

    def test_missing_artifact_still_pins_control_cohort(self):
        calibration = CalibrationRuntime(
            None,
            mode=CalibrationMode.CANARY,
            rollout_policy=RolloutPolicy(CalibrationMode.CANARY, 10_000),
        )
        first = calibration.resolve(target_elo=1400, runtime_game_token="missing", side=Side.WHITE)
        calibration.rollout_policy = RolloutPolicy(CalibrationMode.ACTIVE)
        repeated = calibration.resolve(target_elo=1400, runtime_game_token="missing", side=Side.WHITE)

        self.assertEqual((first.mode, first.cohort), (CalibrationMode.SHADOW, "control"))
        self.assertEqual((repeated.mode, repeated.cohort), (CalibrationMode.SHADOW, "control"))

    def test_active_capacity_denial_remains_fail_closed_after_release(self):
        calibration = CalibrationRuntime(
            runtime(RolloutPolicy(CalibrationMode.ACTIVE)).calibrator,
            mode=CalibrationMode.ACTIVE,
            rollout_policy=RolloutPolicy(CalibrationMode.ACTIVE),
            capacity=1,
        )
        calibration.resolve(target_elo=1400, runtime_game_token="first", side=Side.WHITE)
        denied = calibration.resolve(target_elo=1500, runtime_game_token="denied", side=Side.WHITE)
        calibration.release_game("first")
        repeated = calibration.resolve(target_elo=1500, runtime_game_token="denied", side=Side.WHITE)

        self.assertEqual(denied.reason, "CALIBRATION_PIN_CAPACITY_EXHAUSTED")
        self.assertEqual(repeated.reason, "CALIBRATION_PIN_CAPACITY_EXHAUSTED")
        self.assertIsNone(repeated.profile)

    def test_same_inputs_match_across_runtime_instances(self):
        policy = RolloutPolicy(CalibrationMode.CANARY, 3750)
        left = runtime(policy).resolve(target_elo=1400, runtime_game_token="stable-game", side=Side.WHITE)
        right = runtime(policy).resolve(target_elo=1400, runtime_game_token="stable-game", side=Side.WHITE)
        self.assertEqual((left.mode, left.cohort), (right.mode, right.cohort))


class TelemetryTests(unittest.TestCase):
    def test_search_nps_population_and_bounded_labels(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        telemetry.set_artifact(
            version="v1",
            scale_id="synthetic.test.v1",
            budget_class="test-100ms-v1",
        )
        telemetry.record_search(
            slot="0",
            stage="selector_v2",
            status="ok",
            duration_seconds=0.21,
            nodes=2500,
            engine_seconds=0.2,
        )
        telemetry.observe_selection(
            target_elo=1700,
            applied_skill=12,
            scale_id="synthetic.test.v1",
            status="applied",
        )
        payload = telemetry.render().decode("utf-8")

        self.assertIn('thinker_engine_search_nodes_total{slot="0",stage="selector_v2",status="ok"} 2500.0', payload)
        self.assertIn('thinker_engine_search_seconds_total{slot="0",stage="selector_v2",status="ok"} 0.2', payload)
        self.assertIn("thinker_engine_search_duration_seconds_bucket", payload)
        self.assertIn("thinker_engine_target_elo_bucket", payload)
        self.assertIn("thinker_engine_applied_skill_bucket", payload)
        self.assertNotIn("stable-game", payload)

    def test_arbitrary_slot_and_scale_are_collapsed_to_bounded_values(self):
        telemetry = EngineTelemetry(CollectorRegistry(), slots=("0",))
        telemetry.record_search(
            slot="attacker-controlled-slot",
            stage="arbitrary-stage",
            status="arbitrary-status",
            duration_seconds=0.1,
        )
        telemetry.observe_selection(
            target_elo=1700,
            applied_skill=12,
            scale_id="attacker-controlled-scale",
            status="applied",
        )
        payload = telemetry.render().decode("utf-8")

        self.assertIn('slot="unknown",stage="unknown",status="unknown"', payload)
        self.assertIn('scaleId="unknown",status="applied"', payload)
        self.assertNotIn("attacker-controlled", payload)

    def test_analysis_stats_require_nodes_and_time_from_same_line(self):
        from core.smart_pacing.adapter import KomodoEngineAdapter

        self.assertEqual(
            KomodoEngineAdapter._analysis_stats(
                [{"nodes": 5000}, {"time": 0.25}, {"nodes": 4000, "time": 0.2}]
            ),
            (4000, 0.2),
        )

    def test_missing_engine_stats_omit_both_nps_totals(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        telemetry.record_search(
            slot="0",
            stage="reference_shallow",
            status="ok",
            duration_seconds=0.1,
        )
        payload = telemetry.render().decode("utf-8")
        self.assertNotIn('thinker_engine_search_nodes_total{slot="0",stage="reference_shallow",status="ok"}', payload)
        self.assertNotIn('thinker_engine_search_seconds_total{slot="0",stage="reference_shallow",status="ok"}', payload)

    def test_non_finite_engine_time_does_not_poison_counters(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        telemetry.record_search(
            slot="0",
            stage="selector_v2",
            status="ok",
            duration_seconds=float("inf"),
            nodes=2500,
            engine_seconds=float("inf"),
        )
        payload = telemetry.render().decode("utf-8")

        self.assertNotIn('thinker_engine_search_nodes_total{slot="0",stage="selector_v2",status="ok"}', payload)
        self.assertNotIn('thinker_engine_search_seconds_total{slot="0",stage="selector_v2",status="ok"}', payload)
        self.assertNotIn("+Inf", payload.replace('le="+Inf"', ""))

    def test_slot_gauges_clear_when_transaction_fails(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        coordinator = EngineCoordinator(FakeEngineAdapter(), telemetry=telemetry)

        with self.assertRaisesRegex(RuntimeError, "injected"):
            coordinator.run_transaction(
                EngineJob("request", "move-plan", target_elo=1700, applied_skill=12),
                500,
                lambda _adapter, _deadline, _token: (_ for _ in ()).throw(RuntimeError("injected")),
            )

        payload = telemetry.render().decode("utf-8")
        self.assertIn('thinker_engine_slot_active{slot="0"} 0.0', payload)
        self.assertIn('thinker_engine_slot_target_elo{slot="0"} 0.0', payload)
        self.assertIn('thinker_engine_slot_applied_skill{slot="0"} 0.0', payload)

    def test_artifact_info_and_operational_counters_render(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        telemetry.set_artifact(
            version="v1",
            scale_id="synthetic.test.v1",
            budget_class="test-100ms-v1",
        )
        telemetry.record_failure("invalid_artifact")
        telemetry.record_timeout("selector_v2")
        telemetry.record_clamp("move_selection_elo")
        telemetry.record_restart("uncertain_state")
        telemetry.record_degraded("fallback")
        payload = telemetry.render().decode("utf-8")

        self.assertIn("thinker_engine_calibration_info", payload)
        self.assertNotIn("a" * 64, payload)
        self.assertIn('thinker_engine_failures_total{status="invalid_artifact"} 1.0', payload)
        self.assertIn('thinker_engine_timeouts_total{stage="selector_v2"} 1.0', payload)
        self.assertIn('thinker_engine_clamps_total{status="move_selection_elo"} 1.0', payload)
        self.assertIn('thinker_engine_restarts_total{status="uncertain_state"} 1.0', payload)
        self.assertIn('thinker_engine_degraded_mode_total{status="fallback"} 1.0', payload)

    def test_profile_transition_timeout_is_counted(self):
        from core.smart_pacing.adapter import KomodoEngineAdapter, ProfileTransitionError
        from core.smart_pacing.coordinator import CancellationToken

        telemetry = EngineTelemetry(CollectorRegistry())
        komodo = Mock()
        komodo.generation = "generation-1"
        komodo.apply_profile.side_effect = TimeoutError("expired")
        adapter = KomodoEngineAdapter(komodo, telemetry=telemetry)

        with self.assertRaises(ProfileTransitionError):
            adapter.prepare_reference(CancellationToken())

        payload = telemetry.render().decode("utf-8")
        self.assertIn('thinker_engine_timeouts_total{stage="unknown"} 1.0', payload)
        self.assertIn('thinker_engine_failures_total{status="profile_apply"} 1.0', payload)

    def test_adapter_records_restart_when_injected_engine_does_not(self):
        from core.smart_pacing.adapter import KomodoEngineAdapter

        telemetry = EngineTelemetry(CollectorRegistry())
        komodo = Mock()
        adapter = KomodoEngineAdapter(komodo, telemetry=telemetry)
        adapter.force_restart()
        payload = telemetry.render().decode("utf-8")

        komodo.force_terminate.assert_called_once_with("superseded")
        self.assertIn('thinker_engine_restarts_total{status="superseded"} 1.0', payload)

    def test_capacity_guard_is_visible_in_metrics(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        calibration = CalibrationRuntime(
            runtime(RolloutPolicy(CalibrationMode.ACTIVE)).calibrator,
            mode=CalibrationMode.ACTIVE,
            rollout_policy=RolloutPolicy(CalibrationMode.ACTIVE),
            capacity=1,
            telemetry=telemetry,
        )
        calibration.resolve(target_elo=1400, runtime_game_token="first", side=Side.WHITE)
        calibration.resolve(target_elo=1500, runtime_game_token="denied", side=Side.WHITE)
        payload = telemetry.render().decode("utf-8")

        self.assertIn('thinker_engine_failures_total{status="capacity"} 1.0', payload)
        self.assertIn('thinker_engine_degraded_mode_total{status="not_applied"} 1.0', payload)

    def test_engine_status_remains_one_hot_under_concurrency(self):
        telemetry = EngineTelemetry(CollectorRegistry())
        threads = [
            threading.Thread(
                target=lambda status=status: [telemetry.set_engine_status(status) for _ in range(100)]
            )
            for status in ("ready", "degraded")
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        samples = {
            sample.labels["status"]: sample.value
            for metric in telemetry.registry.collect()
            if metric.name == "thinker_engine_status"
            for sample in metric.samples
        }
        self.assertEqual(sum(samples.values()), 1.0)


if __name__ == "__main__":
    unittest.main()
