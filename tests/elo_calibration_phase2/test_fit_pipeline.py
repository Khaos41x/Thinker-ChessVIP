from __future__ import annotations

import unittest

from core.elo_calibration.artifact import artifact_to_bytes, load_artifact_bytes
from core.elo_calibration.interpolation import build_pchip_segments
from tools.elo_calibration.fit_curve import build_artifact_from_estimates, weighted_pava

from helpers import config, estimates


class FitPipelineTests(unittest.TestCase):
    def test_weighted_pava_pools_decreasing_blocks(self) -> None:
        self.assertEqual(weighted_pava((1.0, 3.0, 2.0, 4.0), (1.0, 1.0, 1.0, 1.0)), (1.0, 2.5, 2.5, 4.0))

    def test_complete_synthetic_corpus_emits_phase1_artifact(self) -> None:
        artifact, report = build_artifact_from_estimates(estimates(), config())
        encoded = artifact_to_bytes(artifact)
        loaded = load_artifact_bytes(encoded)
        self.assertEqual(loaded.checksum, report.artifact_checksum)
        self.assertEqual(loaded.payload.segments, build_pchip_segments(loaded.payload.anchors))

    def test_missing_skill_and_unbounded_estimate_fail_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "missing measured Skills"):
            build_artifact_from_estimates(estimates()[:-1], config())
        broken = list(estimates())
        broken[4] = broken[4].__class__(1, "pentanomial-delta-v1", "b" * 64, 4, "ref", 1000.0, (4, 0, 0, 0, 0), 4, 0.0, None, None, None, 1.0, "negative_infinity")
        with self.assertRaisesRegex(ValueError, "unbounded"):
            build_artifact_from_estimates(tuple(broken), config())

    def test_duplicate_cells_and_pava_overflow_fail_closed(self) -> None:
        duplicated = estimates() + (estimates()[0],)
        with self.assertRaisesRegex(ValueError, "duplicate estimate cells"):
            build_artifact_from_estimates(duplicated, config())
        with self.assertRaisesRegex(ValueError, "overflow"):
            weighted_pava((1e308, 1e308), (1e308, 1e308))


if __name__ == "__main__":
    unittest.main()
