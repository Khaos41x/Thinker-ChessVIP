import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import chess

from core.smart_pacing.calibration import CalibrationMode, RolloutPolicy
from core.smart_pacing.capability import CalibrationCapabilityError, CalibrationCapabilityService, RatingScaleMapping, RatingScaleTranslator
from core.smart_pacing.contracts import MovePlanRequest
from core.smart_pacing.identities import analysis_position_key, observation_key
from core.smart_pacing.idempotency import MovePlanIdempotencyStore
import app as server_app


TOKEN = "a" * 32
CHECKSUM_A = "b" * 64
CHECKSUM_M = "c" * 64
AUTH = {"Authorization": f"Bearer {server_app.capability_store.ensure()}"}


def capability_service(epoch=lambda: 1000.0):
    artifact_payload = SimpleNamespace(
        anchors=(SimpleNamespace(rating=900), SimpleNamespace(rating=3064)),
        artifact_version="artifact-v1",
        scale=SimpleNamespace(scale_id="target-scale"),
        search_policy=SimpleNamespace(budget_class="selector-500ms-v1"),
        seed_policy_version="sha256-lp64-v1",
    )
    artifact = SimpleNamespace(payload=artifact_payload, checksum=CHECKSUM_A)
    runtime = SimpleNamespace(
        calibrator=SimpleNamespace(artifact=artifact),
        default_scale_id="target-scale",
        budget_class="selector-500ms-v1",
        rollout_policy=RolloutPolicy(CalibrationMode.ACTIVE),
    )
    mapping = RatingScaleMapping("mapping-v1", "platform-scale", "target-scale", 800, 3000, 900, 3064, (800.0, 3000.0), ((900.0, 2164.0 / 2200.0, 0.0, 0.0),), CHECKSUM_M)
    return CalibrationCapabilityService(runtime, RatingScaleTranslator((mapping,)), epoch=epoch)


def pin_payload(offset=200):
    return {
        "schemaVersion": 1, "runtimeGameToken": TOKEN, "scaleId": "target-scale",
        "opponentRatingScaleId": "platform-scale", "opponentRating": 1800,
        "offsetElo": offset, "platformAdjustedRating": 1800 + offset, "requiredMode": "active",
    }


def schema2_payload(capability):
    fen = chess.STARTING_FEN
    revision = 1
    requirement = {
        "requiredMode": "active", "scaleId": capability["scaleId"],
        "artifactVersion": capability["artifactVersion"], "artifactChecksum": capability["artifactChecksum"],
        "cohort": capability["cohort"], "rolloutVersion": capability["rolloutVersion"],
        "seedPolicyVersion": capability["seedPolicyVersion"], "budgetClass": capability["allowedBudgetClasses"][0],
        "ratingScaleMappingVersion": capability["ratingScaleMappingVersion"],
        "ratingScaleMappingChecksum": capability["ratingScaleMappingChecksum"],
    }
    return {
        "schemaVersion": 2, "requestId": f"{TOKEN}-{revision}", "runtimeGameToken": TOKEN,
        "positionRevision": revision, "observationKey": observation_key(TOKEN, revision, fen, 2),
        "analysisPositionKey": analysis_position_key(fen), "fen": fen, "lastMove": None,
        "historyDigest": None, "moveSelectionElo": capability["effectiveTargetElo"], "perceptionElo": 1700,
        "analysisTier": "standard", "clientBudgetMs": 700, "analysisBudgetVersion": 1,
        "evidenceModelVersion": 1, "calibrationRequirement": requirement,
    }


class CapabilityTests(unittest.TestCase):
    def test_deployment_status_declares_exact_mode_and_scale(self):
        service = capability_service()
        status = service.deployment_status()
        self.assertEqual(status["executionMode"], "active_dda")
        self.assertEqual(status["targetScaleId"], "target-scale")
        self.assertEqual(status["supportedOpponentRatingScaleIds"], ["platform-scale"])

    def test_empty_mapping_declares_compatibility_without_claiming_dda(self):
        service = capability_service()
        service.translator = RatingScaleTranslator()
        status = service.deployment_status()
        readiness = service.readiness({"schemaVersion": 1, "opponentRatingScaleId": "platform-scale", "targetScaleId": "target-scale", "requiredMode": "active"})
        self.assertEqual(status["executionMode"], "compatibility")
        self.assertEqual(status["reasonCode"], "DDA_MAPPING_UNAVAILABLE")
        self.assertFalse(readiness["active"])
        self.assertEqual(readiness["reasonCode"], "DDA_MAPPING_UNAVAILABLE")

    def test_promoted_pchip_mapping_is_checksum_validated(self):
        artifact = {
            "schemaVersion": 1, "mappingVersion": "mapping-v1",
            "sourceScaleId": "platform-scale", "targetScaleId": "target-scale",
            "sourceMinimum": 800, "sourceMaximum": 3000,
            "targetMinimum": 900, "targetMaximum": 3064,
            "knots": [800, 3000],
            "coefficients": [{"c0": 900, "c1": 2164 / 2200, "c2": 0, "c3": 0}],
            "datasetChecksum": "d" * 64, "validationAttestationChecksum": "e" * 64,
        }
        artifact["artifactChecksum"] = hashlib.sha256(json.dumps(artifact, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            path = Path(directory) / "mapping.json"
            path.write_text(json.dumps(artifact), encoding="utf-8")
            mapping = RatingScaleTranslator.from_path(path).get("platform-scale", "target-scale")
        self.assertEqual(round(mapping.translate(3000)), 3064)

    def test_target_is_translated_pinned_and_cannot_retarget(self):
        service = capability_service()
        readiness = service.readiness({"schemaVersion": 1, "opponentRatingScaleId": "platform-scale", "targetScaleId": "target-scale", "requiredMode": "active"})
        self.assertTrue(readiness["active"])
        first = service.pin(pin_payload())
        self.assertEqual(first, service.pin(pin_payload()))
        self.assertEqual(first["platformAdjustedRating"], 2000)
        request = MovePlanRequest.from_payload(schema2_payload(first))
        self.assertEqual(service.validate_move_plan(request)["effectiveTargetElo"], first["effectiveTargetElo"])
        with self.assertRaisesRegex(CalibrationCapabilityError, "already pinned"):
            service.pin(pin_payload(-200))

    def test_schema_v2_identity_rejects_retargeting(self):
        service = capability_service()
        capability = service.pin(pin_payload())
        payload = schema2_payload(capability)
        payload["moveSelectionElo"] += 1
        request = MovePlanRequest.from_payload(payload)
        with self.assertRaises(CalibrationCapabilityError) as raised:
            service.validate_move_plan(request)
        self.assertEqual(raised.exception.code, "CALIBRATION_IDENTITY_MISMATCH")


class IdempotencyTests(unittest.TestCase):
    def test_pending_conflict_completion_and_crash_recovery(self):
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            path = Path(directory) / "replay.sqlite3"
            store = MovePlanIdempotencyStore(path, capacity=2, epoch=lambda: 1000.0)
            body = {"schemaVersion": 2, "value": 1}
            first = store.claim(TOKEN, "request", body, 2_000_000)
            self.assertEqual(first["status"], "claimed")
            self.assertEqual(store.claim(TOKEN, "request", body, 2_000_000)["status"], "pending")
            self.assertEqual(store.claim(TOKEN, "request", {**body, "value": 2}, 2_000_000)["status"], "conflict")
            encoded = b'{"ok":true}'
            store.complete(TOKEN, "request", first["owner"], encoded)
            self.assertEqual(store.claim(TOKEN, "request", body, 2_000_000), {"status": "complete", "response": encoded})
            pending = store.claim(TOKEN, "crash", body, 2_000_000)
            self.assertEqual(pending["status"], "claimed")
            restarted = MovePlanIdempotencyStore(path, capacity=2, epoch=lambda: 1001.0)
            self.assertEqual(restarted.claim(TOKEN, "crash", body, 2_000_000)["status"], "indeterminate")


class EndpointReplayTests(unittest.TestCase):
    def test_schema_v2_response_is_byte_identical_and_conflict_is_409(self):
        capability = capability_service()
        pin = capability.pin(pin_payload())
        payload = schema2_payload(pin)

        class StubService:
            def __init__(self):
                self.calls = 0

            def validate_request(self, request):
                capability.validate_move_plan(request)

            def create_plan(self, request):
                self.calls += 1
                return {"schemaVersion": 2, "requestId": request.request_id, "observationKey": request.observation_key, "analysisPositionKey": request.analysis_position_key, "positionRevision": request.position_revision, "move": "e2e4", "source": "engine", "originSource": "engine", "status": "complete", "calibration": {"calibrationStatus": "applied"}}

        stub = StubService()
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as directory:
            store = MovePlanIdempotencyStore(Path(directory) / "endpoint.sqlite3")
            with patch.object(server_app, "calibration_capability_service", capability), patch.object(server_app, "move_plan_service", stub), patch.object(server_app, "move_plan_idempotency_store", store):
                client = server_app.app.test_client()
                readiness = client.post("/calibration-readiness", json={"schemaVersion": 1, "opponentRatingScaleId": "platform-scale", "targetScaleId": "target-scale", "requiredMode": "active"}, headers=AUTH)
                pinned = client.post("/calibration-capability", json=pin_payload(), headers=AUTH)
                first = client.post("/move-plan", json=payload, headers=AUTH)
                second = client.post("/move-plan", json=payload, headers=AUTH)
                pending_payload = dict(payload)
                pending_payload["positionRevision"] = 2
                pending_payload["requestId"] = f"{TOKEN}-2"
                pending_payload["observationKey"] = observation_key(TOKEN, 2, pending_payload["fen"], 2)
                store.claim(TOKEN, pending_payload["requestId"], pending_payload, 2_000_000_000_000)
                pending = client.post("/move-plan", json=pending_payload, headers=AUTH)
                conflict_payload = dict(payload)
                conflict_payload["perceptionElo"] = 1800
                conflict = client.post("/move-plan", json=conflict_payload, headers=AUTH)
        self.assertEqual(first.status_code, 200)
        self.assertTrue(readiness.get_json()["active"])
        self.assertEqual(pinned.get_json()["effectiveTargetElo"], pin["effectiveTargetElo"])
        self.assertEqual(first.data, second.data)
        self.assertEqual(stub.calls, 1)
        self.assertEqual(pending.status_code, 202)
        self.assertEqual(pending.headers["Retry-After"], "1")
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.get_json()["error"], "REQUEST_ID_CONFLICT")


if __name__ == "__main__":
    unittest.main()
