from __future__ import annotations

import hashlib
import json
import math
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from .calibration import CalibrationMode


class CalibrationCapabilityError(ValueError):
    def __init__(self, code, message, status=409):
        self.code = code
        self.status = status
        super().__init__(message)


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=True).encode("utf-8")


@dataclass(frozen=True, slots=True)
class RatingScaleMapping:
    mapping_version: str
    source_scale_id: str
    target_scale_id: str
    source_minimum: int
    source_maximum: int
    target_minimum: int
    target_maximum: int
    knots: tuple[float, ...]
    coefficients: tuple[tuple[float, float, float, float], ...]
    checksum: str

    def translate(self, rating):
        if rating < self.source_minimum or rating > self.source_maximum:
            raise CalibrationCapabilityError("RATING_SCALE_UNMAPPED", "rating is outside mapping support", 422)
        index = len(self.knots) - 2
        for candidate in range(len(self.knots) - 1):
            if rating <= self.knots[candidate + 1]:
                index = candidate
                break
        delta = rating - self.knots[index]
        c0, c1, c2, c3 = self.coefficients[index]
        return c0 + c1 * delta + c2 * delta * delta + c3 * delta * delta * delta


class RatingScaleTranslator:
    def __init__(self, mappings=()):
        self._mappings = {(item.source_scale_id, item.target_scale_id): item for item in mappings}

    @classmethod
    def from_path(cls, path):
        if not path:
            return cls()
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        expected = {
            "schemaVersion", "mappingVersion", "sourceScaleId", "targetScaleId",
            "sourceMinimum", "sourceMaximum", "targetMinimum", "targetMaximum",
            "knots", "coefficients", "datasetChecksum", "validationAttestationChecksum", "artifactChecksum",
        }
        if not isinstance(raw, dict) or set(raw) != expected or raw.get("schemaVersion") != 1:
            raise ValueError("invalid rating scale mapping schema")
        supplied = raw["artifactChecksum"]
        content = dict(raw)
        del content["artifactChecksum"]
        computed = hashlib.sha256(_canonical(content)).hexdigest()
        if supplied != computed:
            raise ValueError("rating scale mapping checksum mismatch")
        for field in ("datasetChecksum", "validationAttestationChecksum", "artifactChecksum"):
            if not isinstance(raw[field], str) or len(raw[field]) != 64 or any(char not in "0123456789abcdef" for char in raw[field]):
                raise ValueError(f"invalid {field}")
        if not all(isinstance(raw[field], str) and raw[field] for field in ("mappingVersion", "sourceScaleId", "targetScaleId")):
            raise ValueError("invalid rating scale mapping identity")
        if not isinstance(raw["coefficients"], list) or any(not isinstance(item, dict) or set(item) != {"c0", "c1", "c2", "c3"} for item in raw["coefficients"]):
            raise ValueError("invalid rating scale mapping coefficients")
        knots = tuple(float(value) for value in raw["knots"])
        coefficients = tuple(tuple(float(item[field]) for field in ("c0", "c1", "c2", "c3")) for item in raw["coefficients"])
        if len(knots) < 2 or len(coefficients) != len(knots) - 1 or any(not math.isfinite(value) for value in (*knots, *(value for item in coefficients for value in item))):
            raise ValueError("mapping PCHIP data is invalid")
        if any(knots[index] >= knots[index + 1] for index in range(len(knots) - 1)):
            raise ValueError("mapping knots must be strictly ordered")
        mapping = RatingScaleMapping(
            raw["mappingVersion"], raw["sourceScaleId"], raw["targetScaleId"],
            raw["sourceMinimum"], raw["sourceMaximum"], raw["targetMinimum"], raw["targetMaximum"],
            knots, coefficients, supplied,
        )
        if knots[0] != mapping.source_minimum or knots[-1] != mapping.source_maximum:
            raise ValueError("mapping support does not match knots")
        samples = [mapping.translate(mapping.source_minimum + (mapping.source_maximum - mapping.source_minimum) * index / 128) for index in range(129)]
        if any(value < mapping.target_minimum or value > mapping.target_maximum for value in samples) or any(samples[index] > samples[index + 1] for index in range(len(samples) - 1)):
            raise ValueError("mapping PCHIP must be monotonic and bounded")
        return cls((mapping,))

    def get(self, source_scale_id, target_scale_id):
        return self._mappings.get((source_scale_id, target_scale_id))

    def source_scale_ids(self, target_scale_id):
        return tuple(sorted(source for source, target in self._mappings if target == target_scale_id))


class CalibrationCapabilityService:
    def __init__(self, runtime, translator, *, epoch=time.time, ttl_seconds=3600):
        self.runtime = runtime
        self.translator = translator
        self.epoch = epoch
        self.ttl_seconds = ttl_seconds
        self._pins = {}
        self._lock = threading.Lock()

    def _artifact(self):
        calibrator = self.runtime.calibrator
        if calibrator is None:
            raise CalibrationCapabilityError("CALIBRATION_NOT_ACTIVE", "calibration artifact is unavailable", 503)
        payload = calibrator.artifact.payload
        scale_id = self.runtime.default_scale_id or payload.scale.scale_id
        return calibrator, payload, scale_id

    def deployment_status(self):
        now = int(self.epoch() * 1000)
        try:
            calibrator, artifact, scale_id = self._artifact()
            sources = list(self.translator.source_scale_ids(scale_id))
            reason = None if sources and self.runtime.rollout_policy.mode is CalibrationMode.ACTIVE else "DDA_MAPPING_UNAVAILABLE" if not sources else "CALIBRATION_NOT_ACTIVE"
            return {
                "schemaVersion": 1,
                "targetScaleId": scale_id,
                "artifactVersion": artifact.artifact_version,
                "artifactChecksum": calibrator.artifact.checksum,
                "supportedOpponentRatingScaleIds": sources,
                "executionMode": "active_dda" if reason is None else "compatibility",
                "reasonCode": reason,
                "generatedAtEpochMs": now,
                "expiresAtEpochMs": now + int(self.ttl_seconds * 1000),
            }
        except CalibrationCapabilityError as error:
            return {
                "schemaVersion": 1,
                "targetScaleId": self.runtime.default_scale_id or "unavailable-calibration-scale-v1",
                "artifactVersion": None,
                "artifactChecksum": None,
                "supportedOpponentRatingScaleIds": [],
                "executionMode": "compatibility",
                "reasonCode": error.code,
                "generatedAtEpochMs": now,
                "expiresAtEpochMs": now + int(self.ttl_seconds * 1000),
            }

    def readiness(self, payload):
        expected = {"schemaVersion", "opponentRatingScaleId", "targetScaleId", "requiredMode"}
        if not isinstance(payload, dict) or set(payload) != expected or payload.get("schemaVersion") != 1 or payload.get("requiredMode") != "active":
            raise CalibrationCapabilityError("INVALID_CALIBRATION_REQUEST", "invalid readiness request", 400)
        now = int(self.epoch() * 1000)
        reason = None
        try:
            _, artifact, scale_id = self._artifact()
            mapping = self.translator.get(payload["opponentRatingScaleId"], payload["targetScaleId"])
            if scale_id != payload["targetScaleId"]:
                active = False
                reason = "CALIBRATION_SCALE_MISMATCH"
            elif mapping is None:
                active = False
                reason = "DDA_MAPPING_UNAVAILABLE"
            elif self.runtime.rollout_policy.mode is not CalibrationMode.ACTIVE:
                active = False
                reason = "CALIBRATION_NOT_ACTIVE"
            else:
                active = True
        except CalibrationCapabilityError as error:
            artifact, scale_id, mapping, active = None, payload["targetScaleId"], None, False
            reason = error.code
        return {
            "schemaVersion": 1,
            "active": active,
            "executionMode": "active_dda" if active else "compatibility",
            "reasonCode": reason,
            "opponentRatingScaleId": payload["opponentRatingScaleId"],
            "targetScaleId": scale_id,
            "supportedOpponentRatingScaleIds": list(self.translator.source_scale_ids(scale_id)),
            "ratingScaleMappingVersion": mapping.mapping_version if mapping else None,
            "ratingScaleMappingChecksum": mapping.checksum if mapping else None,
            "artifactVersion": artifact.artifact_version if artifact else None,
            "artifactChecksum": self.runtime.calibrator.artifact.checksum if artifact else None,
            "sourceMinimum": mapping.source_minimum if mapping else None,
            "sourceMaximum": mapping.source_maximum if mapping else None,
            "generatedAtEpochMs": now,
            "expiresAtEpochMs": now + int(self.ttl_seconds * 1000),
        }

    def pin(self, payload):
        expected = {"schemaVersion", "runtimeGameToken", "scaleId", "opponentRatingScaleId", "opponentRating", "offsetElo", "platformAdjustedRating", "requiredMode"}
        if not isinstance(payload, dict) or set(payload) != expected or payload.get("schemaVersion") != 1 or payload.get("requiredMode") != "active":
            raise CalibrationCapabilityError("INVALID_CALIBRATION_REQUEST", "invalid capability request", 400)
        token = payload.get("runtimeGameToken")
        if not isinstance(token, str) or len(token) != 32 or any(char not in "0123456789abcdef" for char in token):
            raise CalibrationCapabilityError("INVALID_CALIBRATION_REQUEST", "invalid runtime token", 400)
        opponent = payload.get("opponentRating")
        offset = payload.get("offsetElo")
        adjusted = payload.get("platformAdjustedRating")
        if isinstance(opponent, bool) or not isinstance(opponent, int) or offset not in {-200, 200} or adjusted != opponent + offset:
            raise CalibrationCapabilityError("INVALID_CALIBRATION_REQUEST", "invalid target arithmetic", 400)
        calibrator, artifact, scale_id = self._artifact()
        if scale_id != payload.get("scaleId") or self.runtime.rollout_policy.mode is not CalibrationMode.ACTIVE:
            raise CalibrationCapabilityError("CALIBRATION_NOT_ACTIVE", "active calibration is unavailable", 503)
        mapping = self.translator.get(payload.get("opponentRatingScaleId"), scale_id)
        if mapping is None:
            raise CalibrationCapabilityError("RATING_SCALE_UNMAPPED", "rating scale mapping is unavailable", 422)
        translated = int(round(mapping.translate(adjusted)))
        minimum = int(artifact.anchors[0].rating)
        maximum = int(artifact.anchors[-1].rating)
        effective = max(minimum, min(maximum, translated))
        now = int(self.epoch() * 1000)
        mode, cohort = self.runtime.rollout_policy.resolve(token, calibrator.artifact.checksum)
        if mode is not CalibrationMode.ACTIVE:
            raise CalibrationCapabilityError("CALIBRATION_NOT_ACTIVE", "runtime token is not in the active cohort", 409)
        response = {
            "schemaVersion": 1, "runtimeGameToken": token, "mode": "active", "cohort": cohort,
            "scaleId": scale_id, "opponentRatingScaleId": payload["opponentRatingScaleId"],
            "ratingScaleMappingVersion": mapping.mapping_version, "ratingScaleMappingChecksum": mapping.checksum,
            "platformAdjustedRating": adjusted, "translatedTargetElo": translated, "effectiveTargetElo": effective,
            "targetSaturated": effective != translated, "artifactVersion": artifact.artifact_version,
            "artifactChecksum": calibrator.artifact.checksum, "seedPolicyVersion": artifact.seed_policy_version,
            "allowedBudgetClasses": [self.runtime.budget_class or artifact.search_policy.budget_class],
            "minimumElo": minimum, "maximumElo": maximum, "expiresAtEpochMs": now + int(self.ttl_seconds * 1000),
            "rolloutVersion": self.runtime.rollout_policy.version,
        }
        signature = _canonical(payload)
        with self._lock:
            existing = self._pins.get(token)
            if existing is not None:
                if existing[0] != signature:
                    raise CalibrationCapabilityError("MID_GAME_RETARGET_FORBIDDEN", "runtime target is already pinned", 409)
                renewed = dict(existing[1])
                renewed["expiresAtEpochMs"] = now + int(self.ttl_seconds * 1000)
                self._pins[token] = (signature, renewed)
                return dict(renewed)
            self._pins[token] = (signature, dict(response))
        return response

    def validate_move_plan(self, request):
        if request.schema_version != 2:
            return None
        with self._lock:
            pin = self._pins.get(request.runtime_game_token)
        if pin is None:
            raise CalibrationCapabilityError("CALIBRATION_CAPABILITY_REQUIRED", "runtime target is not pinned", 409)
        capability = pin[1]
        if capability["expiresAtEpochMs"] <= int(self.epoch() * 1000):
            raise CalibrationCapabilityError("CALIBRATION_CAPABILITY_EXPIRED", "runtime target capability expired", 409)
        requirement = request.calibration_requirement.to_payload()
        expected = {
            "requiredMode": "active", "scaleId": capability["scaleId"],
            "artifactVersion": capability["artifactVersion"], "artifactChecksum": capability["artifactChecksum"],
            "cohort": capability["cohort"], "rolloutVersion": capability["rolloutVersion"],
            "seedPolicyVersion": capability["seedPolicyVersion"], "budgetClass": capability["allowedBudgetClasses"][0],
            "ratingScaleMappingVersion": capability["ratingScaleMappingVersion"],
            "ratingScaleMappingChecksum": capability["ratingScaleMappingChecksum"],
        }
        if request.move_selection_elo != capability["effectiveTargetElo"] or requirement != expected:
            raise CalibrationCapabilityError("CALIBRATION_IDENTITY_MISMATCH", "move plan does not match pinned capability", 409)
        return capability

    def expiry_for(self, runtime_game_token):
        with self._lock:
            pin = self._pins.get(runtime_game_token)
        return pin[1]["expiresAtEpochMs"] if pin else None
