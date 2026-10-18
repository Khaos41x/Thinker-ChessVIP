from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from core.elo_calibration.artifact import load_artifact_bytes
from tools.elo_calibration.io import atomic_write, load_json_bytes, write_canonical_json
from tools.elo_calibration.run_matches import pair_to_bytes

from helpers import config, pair


class DeterminismCliTests(unittest.TestCase):
    def test_artifact_is_byte_identical_across_processes(self) -> None:
        code = """
from core.elo_calibration.artifact import artifact_to_bytes
from core.elo_calibration.models import EloScale,EngineIdentity,SearchPolicy
from tools.elo_calibration.fit_curve import ArtifactBuildConfig,build_artifact_from_estimates
from tools.elo_calibration.models import CellEstimate
estimates=tuple(CellEstimate(1,'pentanomial-delta-v1','b'*64,s,'ref',1000.0+s*40.0,(0,0,4,0,0),4,0.5,0.0,-10.0,10.0,1.0,None) for s in range(26))
config=ArtifactBuildConfig('synthetic-v1',EloScale('scale','protocol','pool','tc'),EngineIdentity('engine','1','a'*64),'b'*64,SearchPolicy('budget',1,32,1,100,125))
artifact,_=build_artifact_from_estimates(estimates,config)
print(artifact_to_bytes(artifact).hex())
"""
        first = subprocess.check_output([sys.executable, "-c", code], text=True).strip()
        second = subprocess.check_output([sys.executable, "-c", code], text=True).strip()
        self.assertEqual(first, second)

    def test_complete_pipeline_is_byte_identical_across_processes(self) -> None:
        code = """
from core.elo_calibration.artifact import artifact_to_bytes
from tests.elo_calibration_phase2.helpers import config,pair
from tools.elo_calibration.estimate import estimate_cells
from tools.elo_calibration.fit_curve import build_artifact_from_estimates
from tools.elo_calibration.io import canonical_json_bytes,content_sha256
from tools.elo_calibration.validate import ValidationGates,validate_artifact
training=tuple(pair(s,f'train-{s}') for s in range(26))
holdout=tuple(pair(s,f'holdout-{s}') for s in range(26))
estimates=estimate_cells(training)
artifact,fit=build_artifact_from_estimates(estimates,config())
encoded=artifact_to_bytes(artifact)
report,attestation=validate_artifact(encoded,training,holdout,config(),ValidationGates(0.2,1.0,1.0,1,100000.0,0.01,0.0),'owner')
proof={'records':content_sha256(training+holdout),'estimates':content_sha256(estimates),'artifact':encoded.hex(),'fit':content_sha256(fit),'report':content_sha256(report),'attestation':content_sha256(attestation),'verdict':report.passed}
print(canonical_json_bytes(proof).hex())
"""
        outputs = [
            subprocess.check_output([sys.executable, "-c", code], text=True).strip()
            for _ in range(2)
        ]
        self.assertEqual(outputs[0], outputs[1])

    def test_all_cli_modules_have_offline_help(self) -> None:
        for module in ("run_matches", "estimate", "fit_curve", "validate", "prepare_benchmark", "preflight"):
            completed = subprocess.run(
                [sys.executable, "-m", f"tools.elo_calibration.{module}", "--help"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertIn("usage:", completed.stdout)

    def test_estimate_and_fit_cli_generate_phase1_artifact(self) -> None:
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            root = Path(directory)
            for skill in range(26):
                path = root / f"pair-{skill}.json"
                atomic_write(path, pair_to_bytes(pair(skill, f"cli-{skill}")))
            estimates_path = root / "estimates.json"
            estimate_command = [sys.executable, "-m", "tools.elo_calibration.estimate", str(root), "--output", str(estimates_path)]
            subprocess.run(estimate_command, check=True, capture_output=True, text=True)
            self.assertEqual(load_json_bytes(estimates_path.read_bytes())["recordCount"], 26)
            config_path = root / "config.json"
            write_canonical_json(config_path, config())
            artifact_path = root / "artifact.json"
            report_path = root / "fit-report.json"
            subprocess.run(
                [sys.executable, "-m", "tools.elo_calibration.fit_curve", "--estimates", str(estimates_path), "--config", str(config_path), "--artifact", str(artifact_path), "--report", str(report_path)],
                check=True,
                capture_output=True,
                text=True,
            )
            artifact = load_artifact_bytes(artifact_path.read_bytes())
            self.assertEqual(len(artifact.payload.anchors), 26)
            self.assertEqual(len(artifact.payload.segments), 25)


if __name__ == "__main__":
    unittest.main()
