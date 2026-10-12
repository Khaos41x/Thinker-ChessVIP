from __future__ import annotations

import json
import subprocess
import sys
import unittest

from core.elo_calibration import CalibrationRequest, EloCalibrator, Side
from core.elo_calibration.interpolation import canonical_resolution_digest

from helpers import build_artifact


class DeterminismTests(unittest.TestCase):
    def test_golden_seed_vector(self) -> None:
        digest = canonical_resolution_digest(
            "sha256-lp64-v1",
            "0123456789abcdef" * 4,
            "game-α-42",
            1210,
            Side.BLACK,
        )
        self.assertEqual(
            digest.hex(),
            "41ebf00f4891d1c864ff64422fddc89d1815f575e7ee431dfe6f0110a25be47a",
        )

    def test_replay_in_separate_python_processes(self) -> None:
        script = """
import json
from core.elo_calibration import CalibrationRequest, EloCalibrator, Side
from tests.elo_calibration.helpers import build_artifact
a = build_artifact()
p = EloCalibrator(a, expected_engine_sha256=a.payload.engine.binary_sha256).interpolate_uci_params(CalibrationRequest(1210, 'synthetic.test.v1', 'test-100ms-v1', 'game-1', Side.WHITE))
print(json.dumps({'checksum': a.checksum, 'resolution': p.resolution_key, 'profile': p.profile_digest, 'skill': p.applied_skill}, sort_keys=True))
"""
        outputs = [
            subprocess.check_output([sys.executable, "-c", script], text=True).strip()
            for _ in range(2)
        ]
        self.assertEqual(outputs[0], outputs[1])
        parsed = json.loads(outputs[0])
        artifact = build_artifact()
        profile = EloCalibrator(
            artifact, expected_engine_sha256=artifact.payload.engine.binary_sha256
        ).interpolate_uci_params(
            CalibrationRequest(
                1210,
                "synthetic.test.v1",
                "test-100ms-v1",
                "game-1",
                Side.WHITE,
            )
        )
        self.assertEqual(parsed["checksum"], artifact.checksum)
        self.assertEqual(parsed["resolution"], profile.resolution_key)
        self.assertEqual(parsed["profile"], profile.profile_digest)
        self.assertEqual(parsed["skill"], profile.applied_skill)


if __name__ == "__main__":
    unittest.main()
