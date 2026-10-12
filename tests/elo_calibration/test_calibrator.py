from __future__ import annotations

import unittest
from dataclasses import replace

from core.elo_calibration import (
    CalibrationRequest,
    BudgetClassMismatch,
    EloCalibrator,
    EngineIdentityMismatch,
    Side,
    ScaleMismatch,
    UnsupportedRatingRange,
    ValidationError,
)

from helpers import build_artifact


def request(target: int, token: str = "game-1", side: Side = Side.WHITE):
    return CalibrationRequest(
        target_elo=target,
        scale_id="synthetic.test.v1",
        budget_class="test-100ms-v1",
        runtime_game_token=token,
        side=side,
    )


class CalibratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.artifact = build_artifact()
        self.calibrator = EloCalibrator(
            self.artifact, expected_engine_sha256=self.artifact.payload.engine.binary_sha256
        )

    def test_every_supported_integer_is_monotone_and_adjacent(self) -> None:
        previous = -1.0
        for target in range(1000, 1961):
            profile = self.calibrator.interpolate_uci_params(request(target))
            self.assertGreaterEqual(profile.latent_skill, previous)
            self.assertIn(
                profile.applied_skill,
                {int(profile.latent_skill // 1), min(int(profile.latent_skill // 1) + 1, 25)},
            )
            self.assertGreaterEqual(profile.applied_skill, 0)
            self.assertLessEqual(profile.applied_skill, 25)
            previous = profile.latent_skill

    def test_exact_anchor_has_exact_integral_skill(self) -> None:
        profile = self.calibrator.interpolate_uci_params(request(1200))
        self.assertEqual(profile.latent_skill, 5.0)
        self.assertEqual(profile.applied_skill, 5)

    def test_uci_profile_is_allowlisted_and_budget_invariant(self) -> None:
        low = self.calibrator.interpolate_uci_params(request(1100))
        high = self.calibrator.interpolate_uci_params(request(1800))
        self.assertEqual(
            {name for name, _ in low.uci_options},
            {"Threads", "Hash", "MultiPV", "Ponder", "Skill"},
        )
        self.assertFalse(low.admits(low.minimum_admission_ms - 1))
        self.assertTrue(low.admits(low.minimum_admission_ms))
        self.assertEqual(
            (low.threads, low.hash_mb, low.multipv, low.move_time_ms, low.minimum_admission_ms),
            (high.threads, high.hash_mb, high.multipv, high.move_time_ms, high.minimum_admission_ms),
        )

    def test_scale_and_budget_mismatch_fail_closed(self) -> None:
        bad_scale = CalibrationRequest(1200, "other", "test-100ms-v1", "g", Side.WHITE)
        bad_budget = CalibrationRequest(1200, "synthetic.test.v1", "other", "g", Side.WHITE)
        with self.assertRaises(ScaleMismatch):
            self.calibrator.interpolate_uci_params(bad_scale)
        with self.assertRaises(BudgetClassMismatch):
            self.calibrator.interpolate_uci_params(bad_budget)

    def test_unsupported_rating_fails_closed(self) -> None:
        with self.assertRaises(UnsupportedRatingRange):
            self.calibrator.interpolate_uci_params(request(999))

    def test_engine_binary_mismatch_is_rejected(self) -> None:
        with self.assertRaises(EngineIdentityMismatch) as raised:
            EloCalibrator(self.artifact, expected_engine_sha256="b" * 64)
        self.assertEqual(raised.exception.expected, "b" * 64)
        self.assertEqual(raised.exception.actual, "a" * 64)

    def test_profile_rejects_non_adjacent_applied_skill(self) -> None:
        profile = self.calibrator.interpolate_uci_params(request(1210))
        with self.assertRaises(ValidationError):
            replace(profile, applied_skill=25)

    def test_changed_inputs_change_identity(self) -> None:
        base = self.calibrator.interpolate_uci_params(request(1210))
        changed = (
            self.calibrator.interpolate_uci_params(request(1210, token="game-2")),
            self.calibrator.interpolate_uci_params(request(1210, side=Side.BLACK)),
            self.calibrator.interpolate_uci_params(request(1211)),
            EloCalibrator(
                build_artifact(1.0), expected_engine_sha256="a" * 64
            ).interpolate_uci_params(request(1210)),
        )
        for profile in changed:
            self.assertNotEqual(profile.resolution_key, base.resolution_key)
            self.assertNotEqual(profile.profile_digest, base.profile_digest)


if __name__ == "__main__":
    unittest.main()
