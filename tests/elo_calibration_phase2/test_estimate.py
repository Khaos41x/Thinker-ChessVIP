from __future__ import annotations

import unittest

from tools.elo_calibration.estimate import estimate_cell, estimate_cells

from helpers import pair


class EstimateTests(unittest.TestCase):
    def test_pentanomial_order_and_operational_exclusion(self) -> None:
        records = (pair(0, "normal"), pair(0, "failure", False))
        estimate = estimate_cells(records)[0]
        self.assertEqual(estimate.counts, (0, 0, 1, 0, 0))
        self.assertEqual(estimate.pair_count, 1)
        self.assertEqual(estimate.elo_delta, 0.0)

    def test_boundary_is_explicitly_unbounded(self) -> None:
        record = pair(0, "loss")
        outcome = __import__("tools.elo_calibration.models", fromlist=["GameOutcome"]).GameOutcome
        games = (
            record.games[0].__class__(record.games[0].game_id, record.games[0].subject_color, outcome.BLACK_WIN, None, "normal", (), ()),
            record.games[1].__class__(record.games[1].game_id, record.games[1].subject_color, outcome.WHITE_WIN, None, "normal", (), ()),
        )
        record = record.__class__(record.schema_version, record.pair_id, record.manifest_sha256, record.skill, record.reference_id, record.reference_rating, record.opening_id, record.opening_fen, games)
        estimate = estimate_cell((record,))
        self.assertIsNone(estimate.elo_delta)
        self.assertEqual(estimate.boundary, "negative_infinity")

    def test_duplicate_pair_ids_are_rejected(self) -> None:
        record = pair(0, "duplicate")
        with self.assertRaisesRegex(ValueError, "duplicate pair IDs"):
            estimate_cells((record, record))

    def test_all_draw_sample_retains_nonzero_uncertainty(self) -> None:
        estimate = estimate_cell(tuple(pair(0, f"draw-{index}") for index in range(4)))
        self.assertLess(estimate.ci_low, estimate.elo_delta)
        self.assertGreater(estimate.ci_high, estimate.elo_delta)
        self.assertGreater(estimate.ci_high - estimate.ci_low, 0.0)


if __name__ == "__main__":
    unittest.main()
