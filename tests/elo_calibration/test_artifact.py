from __future__ import annotations

import json
import tempfile
import unittest
from dataclasses import FrozenInstanceError, replace
from pathlib import Path

from core.elo_calibration import (
    ArtifactChecksumMismatch,
    ArtifactValidationError,
    CalibrationAnchor,
    CalibrationArtifact,
    EngineConfiguration,
    ExperimentManifest,
    ValidationError,
    artifact_to_bytes,
    create_artifact,
    load_artifact,
    load_artifact_bytes,
)

from helpers import build_artifact, build_payload


class ArtifactTests(unittest.TestCase):
    def test_canonical_round_trip_and_file_load(self) -> None:
        artifact = build_artifact()
        encoded = artifact_to_bytes(artifact)
        self.assertEqual(load_artifact_bytes(encoded), artifact)
        self.assertEqual(artifact_to_bytes(load_artifact_bytes(encoded)), encoded)
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            path = Path(directory) / "artifact.json"
            path.write_bytes(encoded)
            self.assertEqual(load_artifact(path), artifact)

    def test_payload_is_immutable(self) -> None:
        artifact = build_artifact()
        with self.assertRaises(FrozenInstanceError):
            artifact.payload.artifact_version = "changed"

    def test_checksum_corruption_is_rejected(self) -> None:
        raw = json.loads(artifact_to_bytes(build_artifact()))
        raw["payload"]["artifactVersion"] = "tampered"
        with self.assertRaises(ArtifactChecksumMismatch):
            load_artifact_bytes(json.dumps(raw).encode("utf-8"))

    def test_unknown_artifact_field_is_rejected(self) -> None:
        raw = json.loads(artifact_to_bytes(build_artifact()))
        raw["payload"]["unexpected"] = True
        with self.assertRaises(ArtifactValidationError):
            load_artifact_bytes(json.dumps(raw).encode("utf-8"))

    def test_duplicate_json_key_is_rejected(self) -> None:
        encoded = artifact_to_bytes(build_artifact())
        duplicate = encoded.replace(b'{"checksum":', b'{"checksum":"' + b'0' * 64 + b'","checksum":', 1)
        with self.assertRaises(ArtifactValidationError):
            load_artifact_bytes(duplicate)

    def test_missing_anchor_is_rejected_before_use(self) -> None:
        payload = build_payload()
        malformed = payload.__class__(
            schema_version=payload.schema_version,
            artifact_version=payload.artifact_version,
            scale=payload.scale,
            engine=payload.engine,
            manifest_sha256=payload.manifest_sha256,
            search_policy=payload.search_policy,
            seed_policy_version=payload.seed_policy_version,
            numeric_serialization_version=payload.numeric_serialization_version,
            inverse_convention=payload.inverse_convention,
            anchors=payload.anchors[:-1],
            segments=payload.segments,
        )
        with self.assertRaises(ArtifactValidationError):
            create_artifact(malformed)

    def test_manifest_invariants(self) -> None:
        payload = build_payload()
        engine = EngineConfiguration(
            identity=payload.engine,
            uci_options=(
                ("Threads", 1),
                ("Hash", 32),
                ("MultiPV", 1),
                ("Ponder", False),
            ),
        )
        manifest = ExperimentManifest(
            schema_version=1,
            manifest_id="synthetic-run-1",
            scale=payload.scale,
            subject=engine,
            reference_ladder=(engine,),
            search_policy=payload.search_policy,
            opening_corpus_sha256="b" * 64,
            opening_pair_count=256,
            color_reversal=True,
            seed_policy_version=payload.seed_policy_version,
            seed_schedule_sha256="c" * 64,
            concurrency=1,
            hardware_fingerprint="synthetic-cpu-v1",
            baseline_nps=1000000.0,
            estimator_version="pentanomial-v1",
            confidence_method="profile-likelihood-v1",
            minimum_pairs=200,
            maximum_pairs=1000,
            stopping_rule="fixed-or-equivalent-v1",
            holdout_fraction=0.2,
            holdout_split_version="sha256-holdout-v1",
            game_id_version="game-id-v1",
            pair_id_version="pair-id-v1",
            subject_perspective="engine-a-v1",
            result_enum_version="terminal-results-v1",
            exclusion_policy_version="complete-pairs-only-v1",
            pentanomial_order=("LL", "LD", "DD_or_WL", "WD", "WW"),
            isotonic_weight_version="inverse-variance-v1",
            pchip_convention="forward-rating-by-skill-v1",
            inverse_convention="left-continuous-generalized-inverse-v1",
            decimal_precision=12,
            tool_versions=(("python", "3.12"), ("python-chess", "pinned-test")),
            point_equivalence_elo=35.0,
            interval_equivalence_elo=75.0,
            nps_drift_fraction=0.1,
        )
        self.assertEqual(manifest.minimum_pairs, 200)
        with self.assertRaises(ValidationError):
            replace(manifest, minimum_pairs=0)
        contradictory = EngineConfiguration(
            identity=payload.engine,
            uci_options=(
                ("Threads", 8),
                ("Hash", 32),
                ("MultiPV", 1),
                ("Ponder", False),
            ),
        )
        with self.assertRaises(ValidationError):
            replace(manifest, subject=contradictory)

    def test_invalid_skill_is_rejected(self) -> None:
        with self.assertRaises(ArtifactValidationError):
            CalibrationAnchor(skill=26, rating=2000.0)

    def test_unsupported_policy_versions_are_rejected(self) -> None:
        payload = build_payload()
        with self.assertRaises(ArtifactValidationError):
            payload.__class__(
                schema_version=payload.schema_version,
                artifact_version=payload.artifact_version,
                scale=payload.scale,
                engine=payload.engine,
                manifest_sha256=payload.manifest_sha256,
                search_policy=payload.search_policy,
                seed_policy_version="unknown-v1",
                numeric_serialization_version=payload.numeric_serialization_version,
                inverse_convention=payload.inverse_convention,
                anchors=payload.anchors,
                segments=payload.segments,
            )

    def test_payload_rejects_invalid_curve_member_types(self) -> None:
        payload = build_payload()
        with self.assertRaises(ArtifactValidationError):
            replace(payload, anchors=(object(),) * 26)
        with self.assertRaises(ArtifactValidationError):
            replace(payload, segments=(object(),) * 25)

    def test_direct_artifact_checksum_error_is_typed(self) -> None:
        with self.assertRaises(ArtifactValidationError):
            CalibrationArtifact(payload=build_payload(), checksum="invalid")

    def test_manifest_identity_participates_in_artifact_checksum(self) -> None:
        payload = build_payload()
        changed = replace(payload, manifest_sha256="e" * 64)
        self.assertNotEqual(create_artifact(payload).checksum, create_artifact(changed).checksum)


if __name__ == "__main__":
    unittest.main()
