from __future__ import annotations

import unittest
import tempfile
from dataclasses import replace
from pathlib import Path

from core.elo_calibration.artifact import artifact_to_bytes, load_artifact_bytes
from tools.elo_calibration.estimate import estimate_cells
from tools.elo_calibration.fit_curve import build_artifact_from_estimates
from tools.elo_calibration.validate import ValidationGates, validate_artifact, write_validation_outputs
from tools.elo_calibration.models import GameOutcome

from helpers import config, pair


class ValidateTests(unittest.TestCase):
    def test_byte_rebuild_holdout_and_attestation_pass(self) -> None:
        training = tuple(pair(skill, f"train-{skill}") for skill in range(26))
        holdout = tuple(pair(skill, f"holdout-{skill}") for skill in range(26))
        artifact, _ = build_artifact_from_estimates(estimate_cells(training), config())
        encoded = artifact_to_bytes(artifact)
        report, attestation = validate_artifact(
            encoded,
            training,
            holdout,
            config(),
            ValidationGates(0.2, 1.0, 1000.0, 1, 100000.0, 0.01, 0.0),
            "calibration-owner",
        )
        self.assertTrue(report.passed, report.reasons)
        self.assertTrue(report.byte_rebuild_equal)
        self.assertEqual(attestation.verdict, "pass")
        self.assertEqual(load_artifact_bytes(encoded).checksum, attestation.artifact_checksum)

    def test_tampered_candidate_fails_phase1_loader(self) -> None:
        training = tuple(pair(skill, f"train-{skill}") for skill in range(26))
        artifact, _ = build_artifact_from_estimates(estimate_cells(training), config())
        encoded = artifact_to_bytes(artifact)
        with self.assertRaises(Exception):
            validate_artifact(
                encoded[:-1] + b"0",
                training,
                training,
                config(),
                ValidationGates(0.2, 1.0, 1.0, 1, 100000.0, 0.01, 0.0),
                "owner",
            )

    def test_wide_interval_minimum_pairs_and_nps_gates_fail(self) -> None:
        training = tuple(pair(skill, f"train-gates-{skill}") for skill in range(26))
        holdout = []
        for skill in range(26):
            low = pair(skill, f"holdout-low-{skill}")
            high = pair(skill, f"holdout-high-{skill}")
            holdout.append(
                replace(
                    low,
                    games=(low.games[0], replace(low.games[1], outcome=GameOutcome.WHITE_WIN)),
                )
            )
            holdout.append(
                replace(
                    high,
                    games=(high.games[0], replace(high.games[1], outcome=GameOutcome.BLACK_WIN)),
                )
            )
        artifact, _ = build_artifact_from_estimates(estimate_cells(training), config())
        report, _ = validate_artifact(
            artifact_to_bytes(artifact),
            training,
            tuple(holdout),
            config(),
            ValidationGates(0.2, 1.0, 1.0, 3, 200000.0, 0.01, 1.0),
            "owner",
        )
        self.assertFalse(report.passed)
        self.assertIn("minimum completed pairs gate failed", report.reasons)
        self.assertIn("interval equivalence gate failed", report.reasons)
        self.assertIn("NPS drift gate failed", report.reasons)

    def test_manifest_overlap_and_holdout_coverage_fail_closed(self) -> None:
        training = tuple(pair(skill, f"train-contract-{skill}") for skill in range(26))
        holdout = tuple(pair(skill, f"holdout-contract-{skill}") for skill in range(26))
        artifact, _ = build_artifact_from_estimates(estimate_cells(training), config())
        encoded = artifact_to_bytes(artifact)
        gates = ValidationGates(0.2, 1.0, 1000.0, 1, 100000.0, 0.01, 0.0)
        with self.assertRaisesRegex(ValueError, "overlap"):
            validate_artifact(encoded, training, training, config(), gates, "owner")
        mismatched = (replace(holdout[0], manifest_sha256="c" * 64),) + holdout[1:]
        with self.assertRaisesRegex(ValueError, "manifest"):
            validate_artifact(encoded, training, mismatched, config(), gates, "owner")
        report, _ = validate_artifact(encoded, training, holdout[:-1], config(), gates, "owner")
        self.assertIn("holdout Skill coverage gate failed", report.reasons)

    def test_nps_uses_subject_moves_and_validation_outputs_are_immutable(self) -> None:
        training = tuple(pair(skill, f"train-nps-{skill}") for skill in range(26))
        holdout = []
        for skill in range(26):
            record = pair(skill, f"holdout-nps-{skill}")
            reference_game = record.games[1]
            telemetry = tuple(replace(move, nodes=10_000_000) for move in reference_game.telemetry)
            holdout.append(replace(record, games=(record.games[0], replace(reference_game, telemetry=telemetry))))
        artifact, _ = build_artifact_from_estimates(estimate_cells(training), config())
        report, attestation = validate_artifact(
            artifact_to_bytes(artifact),
            training,
            tuple(holdout),
            config(),
            ValidationGates(0.2, 1.0, 1000.0, 1, 100000.0, 0.01, 0.0),
            "owner",
        )
        self.assertAlmostEqual(report.observed_nps, 100000.0)
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            report_path = Path(directory) / "report.json"
            attestation_path = Path(directory) / "attestation.json"
            write_validation_outputs(report_path, attestation_path, report, attestation)
            with self.assertRaises(FileExistsError):
                write_validation_outputs(report_path, attestation_path, report, attestation)


if __name__ == "__main__":
    unittest.main()
