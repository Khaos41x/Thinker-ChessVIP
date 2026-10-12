from __future__ import annotations

import unittest

from core.elo_calibration.errors import (
    ArtifactValidationError,
    UnsupportedRatingRange,
    ValidationError,
)
from core.elo_calibration.interpolation import generalized_inverse, validate_curve
from core.elo_calibration.models import CalibrationAnchor, PchipSegment, SkillResolution

from helpers import build_payload


class InterpolationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = build_payload()

    def test_exact_anchor_and_plateau_use_lowest_skill(self) -> None:
        self.assertEqual(
            generalized_inverse(self.payload.anchors, self.payload.segments, 1200),
            5.0,
        )
        self.assertEqual(
            generalized_inverse(self.payload.anchors, self.payload.segments, 1400),
            10.0,
        )

    def test_between_anchors_is_inverted_by_bisection(self) -> None:
        latent = generalized_inverse(self.payload.anchors, self.payload.segments, 1210)
        self.assertAlmostEqual(latent, 5.25, places=12)

    def test_unsupported_range_is_rejected_without_clamping(self) -> None:
        for target in (999, 1961):
            with self.subTest(target=target):
                with self.assertRaises(UnsupportedRatingRange):
                    generalized_inverse(self.payload.anchors, self.payload.segments, target)

    def test_non_monotone_segment_is_rejected(self) -> None:
        segments = list(self.payload.segments)
        segments[0] = PchipSegment(0, 1, 1000.0, -40.0, 240.0, -160.0)
        with self.assertRaises(ArtifactValidationError):
            validate_curve(self.payload.anchors, tuple(segments))

    def test_derivative_discontinuity_is_rejected(self) -> None:
        segments = list(self.payload.segments)
        original = segments[1]
        segments[1] = PchipSegment(
            original.left_skill,
            original.right_skill,
            original.c0,
            original.c1 + 1.0,
            original.c2 - 2.0,
            original.c3 + 1.0,
        )
        with self.assertRaises(ArtifactValidationError):
            validate_curve(self.payload.anchors, tuple(segments))

    def test_non_pchip_monotone_coefficients_are_rejected(self) -> None:
        anchors = tuple(
            CalibrationAnchor(skill=skill, rating=1000.0 + 40.0 * skill)
            for skill in range(26)
        )
        segments = tuple(
            PchipSegment(skill, skill + 1, anchors[skill].rating, 20.0, 60.0, -40.0)
            for skill in range(25)
        )
        with self.assertRaises(ArtifactValidationError):
            validate_curve(anchors, segments)

    def test_resolution_bounds_must_bracket_latent_skill(self) -> None:
        with self.assertRaises(ValidationError):
            SkillResolution(10.5, 0, 25, 0, "a" * 64)


if __name__ == "__main__":
    unittest.main()
